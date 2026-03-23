/* eslint-disable react/prop-types */
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { feedbackService } from "../services";
import { Loading, Alert } from "../components/UI";
import "./FeedbacksPage.css";

function getInitials(fullName) {
  if (!fullName) return "--";
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StarIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" className={filled ? "star-filled" : "star-empty"}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function Stars({ point }) {
  const safePoint = Number(point) || 0;
  return (
    <div className="stars" aria-label={`${safePoint} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} filled={star <= safePoint} />
      ))}
    </div>
  );
}

function getDateSubLabel(createdAt) {
  const inputDate = new Date(createdAt);
  const now = new Date();
  const diffDays = Math.floor((now - inputDate) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return "";
}

function SummaryStrip({ feedbacks }) {
  const total = feedbacks.length;
  const sum = feedbacks.reduce((acc, fb) => acc + (Number(fb.point) || 0), 0);
  const avg = total ? (sum / total).toFixed(1) : "0.0";
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  feedbacks.forEach((fb) => {
    const p = Number(fb.point);
    if (counts[p] !== undefined) counts[p] += 1;
  });

  return (
    <div className="fb-summary">
      <div className="summary-score">
        <div className="score-num">{avg}</div>
        <Stars point={Math.round(Number(avg))} />
        <div className="score-count">{total} đánh giá</div>
      </div>

      <div className="summary-bars">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = counts[star];
          const width = total ? `${(count / total) * 100}%` : "0%";

          return (
            <div className="bar-row" key={star}>
              <div className="bar-star-label">{star}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width }} />
              </div>
              <div className="bar-count">{count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TemplatePagination({ page, totalPages, totalItems, onPrev, onNext }) {
  const safeTotalItems = totalItems || 0;
  const start = safeTotalItems ? (page - 1) * 10 + 1 : 0;
  const end = Math.min(page * 10, safeTotalItems);

  return (
    <div className="fb-pagination">
      <div className="page-info">
        Hiển thị {start}-{end} trong {safeTotalItems} đánh giá
      </div>
      <div className="page-btns">
        <button className="page-btn" onClick={onPrev} disabled={page <= 1}>
          <svg viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button className="page-btn active">{page}</button>
        <button
          className="page-btn"
          onClick={onNext}
          disabled={page >= (totalPages || 1)}
        >
          <svg viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Customer: danh sách feedback của mình ────────────────────────────────────
function MyFeedbacks() {
  const [result, setResult] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 10;
  const { data: feedbacks, metadata } = result;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await feedbackService.getMy({ page, limit });
        setResult(data);
      } catch (err) {
        setError(err.response?.data?.message || "Không tải được đánh giá");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page]);

  if (loading && !feedbacks.length) return <Loading />;

  const filteredFeedbacks = feedbacks.filter((fb) => {
    const keyword = searchTerm.toLowerCase();
    return (
      fb.appointmentId?.doctorId?.fullName?.toLowerCase().includes(keyword) ||
      fb.comment?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="fb-page-shell">
      {error && <Alert type="error">{error}</Alert>}

      <div className="fb-header">
        <div className="fb-header-icon" aria-hidden>
          <svg viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div>
          <div className="fb-header-title">Đánh giá khách hàng</div>
          <div className="fb-header-sub">Tổng hợp phản hồi từ bệnh nhân</div>
        </div>
      </div>

      <SummaryStrip feedbacks={feedbacks} />

      <div className="fb-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder="Tìm theo bác sĩ, bình luận..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="fb-table-card">
        <div className="table-head fb-cols-my">
          <div className="th">Ngày</div>
          <div className="th">Bác sĩ</div>
          <div className="th">Đánh giá</div>
          <div className="th">Bình luận</div>
        </div>

        {filteredFeedbacks.length ? (
          filteredFeedbacks.map((fb) => {
            const doctorName = fb.appointmentId?.doctorId?.fullName || "--";
            const subDate = getDateSubLabel(fb.createdAt);
            return (
              <div key={fb._id} className="review-row fb-cols-my">
                <div>
                  <div className="cell-date">
                    {new Date(fb.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                  {subDate && <div className="cell-date-sub">{subDate}</div>}
                </div>

                <div className="cell-doctor">
                  <div className="doctor-avatar">{getInitials(doctorName)}</div>
                  <div className="doctor-name">{doctorName}</div>
                </div>

                <div className="cell-rating">
                  <Stars point={fb.point} />
                  <div className="rating-num">
                    {Number(fb.point).toFixed(1)} / 5
                  </div>
                </div>

                <div className="cell-comment">{fb.comment || "--"}</div>
              </div>
            );
          })
        ) : (
          <div className="fb-empty">Chưa có đánh giá nào phù hợp.</div>
        )}

        <TemplatePagination
          page={page}
          totalPages={metadata?.totalPages ?? 1}
          totalItems={metadata?.totalItems}
          onPrev={() => setPage((p) => Math.max(p - 1, 1))}
          onNext={() =>
            setPage((p) => Math.min(p + 1, metadata?.totalPages ?? 1))
          }
        />
      </div>
    </div>
  );
}

// ─── Staff/CS/Admin: tất cả feedback + filter + review ───────────────────────
function AllFeedbacks() {
  const [result, setResult] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filterPoint, setFilterPoint] = useState("");
  const [filterReviewed, setFilterReviewed] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [reviewing, setReviewing] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const limit = 10;
  const { data: feedbacks, metadata } = result;
  const { user } = useAuth();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await feedbackService.getAll({
        page,
        limit,
        point: filterPoint || undefined,
        reviewed: filterReviewed || undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, filterPoint, filterReviewed]);

  const handleReview = async (id) => {
    setReviewing(id);
    setSuccessMsg(null);
    try {
      await feedbackService.review(id);
      setSuccessMsg("Đã đánh dấu review thành công!");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi review");
    } finally {
      setReviewing(null);
    }
  };

  if (loading && !feedbacks.length) return <Loading />;

  const filteredFeedbacks = feedbacks.filter((fb) => {
    const keyword = searchTerm.toLowerCase();
    return (
      fb.appointmentId?.customerId?.fullName?.toLowerCase().includes(keyword) ||
      fb.appointmentId?.doctorId?.fullName?.toLowerCase().includes(keyword) ||
      fb.comment?.toLowerCase().includes(keyword)
    );
  });

  const tableColsClass =
    user?.role === "CUSTOMER_SUPPORT" ? "fb-cols-all-action" : "fb-cols-all";

  return (
    <div className="fb-page-shell">
      {error && <Alert type="error">{error}</Alert>}
      {successMsg && <Alert type="success">{successMsg}</Alert>}

      <div className="fb-header">
        <div className="fb-header-icon" aria-hidden>
          <svg viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div>
          <div className="fb-header-title">Đánh giá khách hàng</div>
          <div className="fb-header-sub">Tổng hợp phản hồi từ bệnh nhân</div>
        </div>
      </div>

      <SummaryStrip feedbacks={feedbacks} />

      <div className="fb-toolbar">
        <div className="search-wrap">
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder="Tìm theo bác sĩ, khách hàng, bình luận..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          className="filter-btn"
          onClick={() => setShowFilters((s) => !s)}
        >
          <svg viewBox="0 0 24 24">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          Lọc
        </button>
      </div>

      {showFilters && (
        <div className="fb-filter-panel">
          <select
            className="fb-filter-select"
            value={filterPoint}
            onChange={(e) => {
              setPage(1);
              setFilterPoint(e.target.value);
            }}
          >
            <option value="">Tất cả rating</option>
            {[1, 2, 3, 4, 5].map((p) => (
              <option key={p} value={p}>
                {p} sao
              </option>
            ))}
          </select>

          <select
            className="fb-filter-select"
            value={filterReviewed}
            onChange={(e) => {
              setPage(1);
              setFilterReviewed(e.target.value);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="false">Chưa review</option>
            <option value="true">Đã review</option>
          </select>
        </div>
      )}

      <div className="fb-table-card">
        <div className={`table-head ${tableColsClass}`}>
          <div className="th">Ngày</div>
          <div className="th">Khách hàng</div>
          <div className="th">Bác sĩ</div>
          <div className="th">Đánh giá</div>
          <div className="th">Bình luận</div>
          <div className="th">Review</div>
          {user?.role === "CUSTOMER_SUPPORT" && (
            <div className="th">Thao tác</div>
          )}
        </div>

        {filteredFeedbacks.length ? (
          filteredFeedbacks.map((fb) => {
            const customerName = fb.appointmentId?.customerId?.fullName || "--";
            const doctorName = fb.appointmentId?.doctorId?.fullName || "--";
            const subDate = getDateSubLabel(fb.createdAt);
            return (
              <div key={fb._id} className={`review-row ${tableColsClass}`}>
                <div>
                  <div className="cell-date">
                    {new Date(fb.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                  {subDate && <div className="cell-date-sub">{subDate}</div>}
                </div>

                <div className="cell-doctor">
                  <div className="doctor-avatar alt">
                    {getInitials(customerName)}
                  </div>
                  <div className="doctor-name">{customerName}</div>
                </div>

                <div className="cell-doctor">
                  <div className="doctor-avatar">{getInitials(doctorName)}</div>
                  <div className="doctor-name">{doctorName}</div>
                </div>

                <div className="cell-rating">
                  <Stars point={fb.point} />
                  <div className="rating-num">
                    {Number(fb.point).toFixed(1)} / 5
                  </div>
                </div>

                <div className="cell-comment">{fb.comment || "--"}</div>

                <div>
                  {fb.reviewedBy ? (
                    <span className="fb-badge success">Đã review</span>
                  ) : (
                    <span className="fb-badge warning">Chưa review</span>
                  )}
                </div>

                {user?.role === "CUSTOMER_SUPPORT" && (
                  <div>
                    {fb.reviewedBy ? (
                      <span className="muted-inline">--</span>
                    ) : (
                      <button
                        className="review-btn"
                        disabled={reviewing === fb._id}
                        onClick={() => handleReview(fb._id)}
                      >
                        {reviewing === fb._id ? "..." : "Review"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="fb-empty">Không có đánh giá nào phù hợp.</div>
        )}

        <TemplatePagination
          page={page}
          totalPages={metadata?.totalPages ?? 1}
          totalItems={metadata?.totalItems}
          onPrev={() => setPage((p) => Math.max(p - 1, 1))}
          onNext={() =>
            setPage((p) => Math.min(p + 1, metadata?.totalPages ?? 1))
          }
        />
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function FeedbacksPage() {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <div className="page feedbacks-page-template">
      {role === "CUSTOMER" && <MyFeedbacks />}
      {(role === "SALE_STAFF" ||
        role === "CUSTOMER_SUPPORT" ||
        role === "ADMIN") && <AllFeedbacks />}
      {!role && (
        <Alert type="warning">Vui lòng đăng nhập để xem đánh giá.</Alert>
      )}
    </div>
  );
}
