import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { feedbackService } from "../services";
import { Loading, Alert, Button } from "../components/UI";
import { PageHeader } from "../components/PageHeader";
import { Pagination } from "../components/Pagination";

const STAR_COLORS = ["", "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#27ae60"];

function Stars({ point }) {
  return (
    <span style={{ color: STAR_COLORS[point] || "#999", fontSize: "1.1rem" }}>
      {"★".repeat(point)}{"☆".repeat(5 - point)}
    </span>
  );
}

// ─── Customer: danh sách feedback của mình ────────────────────────────────────
function MyFeedbacks() {
  const [result, setResult] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
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

  return (
    <div>
      {error && <Alert type="error">{error}</Alert>}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Bác sĩ</th>
              <th>Rating</th>
              <th>Bình luận</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.length ? (
              feedbacks.map((fb) => (
                <tr key={fb._id}>
                  <td>{new Date(fb.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td>{fb.appointmentId?.doctorId?.fullName || "—"}</td>
                  <td><Stars point={fb.point} /></td>
                  <td className="cell-desc">{fb.comment || "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="cell-empty">
                  Chưa có đánh giá nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={metadata?.totalPages ?? 1}
        total={metadata?.totalItems}
        onPrev={() => setPage((p) => p - 1)}
        onNext={() => setPage((p) => p + 1)}
      />
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

  useEffect(() => { load(); }, [page, filterPoint, filterReviewed]);

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

  return (
    <div>
      {error && <Alert type="error">{error}</Alert>}
      {successMsg && <Alert type="success">{successMsg}</Alert>}

      {/* Filters */}
      <div className="filter-bar">
        <select
          className="form-input filter-select"
          value={filterPoint}
          onChange={(e) => { setPage(1); setFilterPoint(e.target.value); }}
        >
          <option value="">Tất cả rating</option>
          {[1, 2, 3, 4, 5].map((p) => (
            <option key={p} value={p}>{p} sao</option>
          ))}
        </select>
        <select
          className="form-input filter-select"
          value={filterReviewed}
          onChange={(e) => { setPage(1); setFilterReviewed(e.target.value); }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="false">Chưa review</option>
          <option value="true">Đã review</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Khách hàng</th>
              <th>Bác sĩ</th>
              <th>Rating</th>
              <th>Bình luận</th>
              <th>Review</th>
              {user?.role === "CUSTOMER_SUPPORT" && <th></th>}
            </tr>
          </thead>
          <tbody>
            {feedbacks.length ? (
              feedbacks.map((fb) => (
                <tr key={fb._id}>
                  <td>{new Date(fb.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td>{fb.appointmentId?.customerId?.fullName || "—"}</td>
                  <td>{fb.appointmentId?.doctorId?.fullName || "—"}</td>
                  <td><Stars point={fb.point} /></td>
                  <td className="cell-desc">{fb.comment || "—"}</td>
                  <td>
                    {fb.reviewedBy ? (
                      <span className="badge badge-success">Đã review bởi {fb.reviewedBy.fullName}</span>
                    ) : (
                      <span className="badge badge-warning">Chưa review</span>
                    )}
                  </td>
                  {user?.role === "CUSTOMER_SUPPORT" && (
                    <td>
                      {!fb.reviewedBy && (
                        <button
                          className="btn btn-secondary"
                          disabled={reviewing === fb._id}
                          onClick={() => handleReview(fb._id)}
                        >
                          {reviewing === fb._id ? "..." : "Review"}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="cell-empty">
                  Không có đánh giá nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={metadata?.totalPages ?? 1}
        total={metadata?.totalItems}
        onPrev={() => setPage((p) => p - 1)}
        onNext={() => setPage((p) => p + 1)}
      />
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function FeedbacksPage() {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <div className="page feedbacks-page">
      <PageHeader title="Đánh giá của khách hàng" />
      {role === "CUSTOMER" && <MyFeedbacks />}
      {(role === "SALE_STAFF" || role === "CUSTOMER_SUPPORT" || role === "ADMIN") && (
        <AllFeedbacks />
      )}
      {!role && <Alert type="warning">Vui lòng đăng nhập để xem đánh giá.</Alert>}
    </div>
  );
}
