import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { feedbackService, appointmentService } from "../services";
import { Loading, Alert } from "../components/UI";

const STAR_LABELS = ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc"];
const FORM_STAR_LABELS = {
  1: "Rất tệ",
  2: "Không hài lòng",
  3: "Bình thường",
  4: "Hài lòng",
  5: "Xuất sắc",
};

// ─── Star Rating Input ────────────────────────────────────────────────────────
function StarRating({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div>
      <div className="feedback-submit-stars" aria-label="Chọn số sao">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`feedback-submit-star-btn ${
              value >= star ? "is-active" : ""
            } ${hovered >= star ? "is-hovered" : ""}`}
            onMouseEnter={() => !disabled && setHovered(star)}
            onMouseLeave={() => !disabled && setHovered(0)}
            onClick={() => !disabled && onChange(star)}
            disabled={disabled}
            aria-label={`${star} sao`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        ))}
      </div>

      <div
        className={`feedback-submit-rating-desc ${active > 0 ? "" : "is-empty"}`}
      >
        {active > 0 ? FORM_STAR_LABELS[active] : "-"}
      </div>
    </div>
  );
}

// ─── Already Submitted View ───────────────────────────────────────────────────
function AlreadyReviewed({ feedback, appointment }) {
  const navigate = useNavigate();
  const doctorName = appointment?.doctorId?.fullName || "Bác sĩ";
  const rating = Number(feedback?.point || 0);

  return (
    <div className="feedback-view-card">
      <div className="feedback-view-card__header">
        <div className="feedback-view-card__check-circle" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2>Đánh giá bác sĩ</h2>
        <p>Bạn đã đánh giá buổi khám này</p>
        <div className="feedback-view-card__header-divider" />
      </div>

      <div className="feedback-view-card__body">
        <div className="feedback-view-card__info-row">
          <div className="feedback-view-card__info-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5a7a50"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="feedback-view-card__info-text">
            <div className="feedback-view-card__info-label">Bác sĩ</div>
            <div className="feedback-view-card__info-value">{doctorName}</div>
          </div>
        </div>

        <div className="feedback-view-card__info-row">
          <div className="feedback-view-card__info-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="#EF9F27"
              stroke="#EF9F27"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="feedback-view-card__info-text">
            <div className="feedback-view-card__info-label">Xếp hạng</div>
            <div className="feedback-view-card__info-value">
              <div className="feedback-view-card__stars-wrap">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg
                    className="feedback-view-card__star-svg"
                    key={s}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <polygon
                      points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                      fill={s <= rating ? "#EF9F27" : "none"}
                      stroke={s <= rating ? "#EF9F27" : "#D4CFC8"}
                      strokeWidth="1.2"
                    />
                  </svg>
                ))}
                <span className="feedback-view-card__rating-label">
                  {STAR_LABELS[rating] || "Chưa đánh giá"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {feedback.comment && (
        <div className="feedback-view-card__comment-block">
          <div className="feedback-view-card__comment-quote">
            {feedback.comment}
          </div>
        </div>
      )}

      <div className="feedback-view-card__sent-date">
        <span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Đã gửi ngày {new Date(feedback.createdAt).toLocaleDateString("vi-VN")}
        </span>
      </div>

      <div className="feedback-view-card__footer">
        <button
          className="feedback-view-card__back-btn"
          onClick={() => navigate("/appointments")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Quay lại lịch hẹn
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function SubmitFeedbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appointmentId = searchParams.get("appointmentId");

  const [appointment, setAppointment] = useState(null);
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [point, setPoint] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load appointment info & check existing feedback
  useEffect(() => {
    if (!appointmentId) {
      setError("Không tìm thấy mã cuộc hẹn. Vui lòng quay lại trang lịch hẹn.");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load appointment info
        const aptRes = await appointmentService.getById(appointmentId);
        const apt = aptRes.data?.data || aptRes.data;
        setAppointment(apt);

        // Check if already submitted
        try {
          const fbRes = await feedbackService.getByAppointment(appointmentId);
          const fb = fbRes.data?.data || fbRes.data;
          if (fb) setExistingFeedback(fb);
        } catch (fbErr) {
          // 404 = chưa có feedback → bình thường
          if (fbErr.response?.status !== 404) {
            console.warn("Could not check existing feedback:", fbErr);
          }
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Không tải được thông tin cuộc hẹn.",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [appointmentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (point === 0) {
      setError("Vui lòng chọn số sao đánh giá.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await feedbackService.create({
        appointmentId,
        point,
        comment: comment.trim() || undefined,
      });
      setSuccess(true);
      // Redirect after short delay
      setTimeout(() => navigate("/appointments"), 2500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Gửi đánh giá thất bại. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  // No appointmentId in URL
  if (!appointmentId) {
    return (
      <div className="page submit-feedback-page">
        <Alert type="error">
          Thiếu thông tin cuộc hẹn.{" "}
          <button
            className="btn-link"
            onClick={() => navigate("/appointments")}
          >
            Quay lại
          </button>
        </Alert>
      </div>
    );
  }

  const doctorName = appointment?.doctorId?.fullName || "Bác sĩ";
  const desiredDate = appointment?.desiredDate
    ? new Date(appointment.desiredDate).toLocaleDateString("vi-VN")
    : appointment?.slotId?.startTime
      ? new Date(appointment.slotId.startTime).toLocaleDateString("vi-VN")
      : "—";

  return (
    <div className="page submit-feedback-page">
      {/* Already submitted */}
      {existingFeedback && (
        <AlreadyReviewed
          feedback={existingFeedback}
          appointment={appointment}
        />
      )}

      {/* Success state */}
      {!existingFeedback && success && (
        <div className="card feedback-done">
          <div className="feedback-done__icon">🎉</div>
          <h3 className="feedback-done__title">Cảm ơn bạn đã đánh giá!</h3>
          <p>Phản hồi của bạn giúp chúng tôi cải thiện dịch vụ.</p>
          <p className="text-muted">Đang chuyển về trang lịch hẹn...</p>
        </div>
      )}

      {/* Form */}
      {!existingFeedback && !success && (
        <div className="feedback-submit-card">
          <form onSubmit={handleSubmit}>
            <div className="feedback-submit-card__header">
              <h2>Đánh giá bác sĩ</h2>

              <div className="feedback-submit-appt-info">
                <div className="feedback-submit-chip">
                  <div className="feedback-submit-chip__label">Bác sĩ</div>
                  <div className="feedback-submit-chip__value">
                    {doctorName}
                  </div>
                </div>
                <div className="feedback-submit-chip">
                  <div className="feedback-submit-chip__label">Ngày khám</div>
                  <div className="feedback-submit-chip__value">
                    {desiredDate}
                  </div>
                </div>
                {appointment?.type && (
                  <div className="feedback-submit-chip feedback-submit-chip--full">
                    <div className="feedback-submit-chip__label">Loại khám</div>
                    <div className="feedback-submit-chip__value">
                      {appointment.type === "BASIC" ? "Cơ bản" : "Nâng cao"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="feedback-submit-card__body">
              <p className="feedback-submit-question">
                Bạn cảm thấy thế nào về buổi khám?
              </p>

              <div className="feedback-submit-field-label">
                Đánh giá <span className="req">*</span>
              </div>

              <StarRating
                value={point}
                onChange={setPoint}
                disabled={submitting}
              />

              {error && (
                <div className="feedback-submit-error-msg">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="feedback-submit-field-label">
                Nhận xét <span className="optional">(tuỳ chọn)</span>
              </div>

              <div className="feedback-submit-textarea-wrap">
                <textarea
                  id="feedback-comment"
                  className="feedback-submit-textarea"
                  rows={4}
                  maxLength={1000}
                  placeholder="Chia sẻ trải nghiệm của bạn về buổi khám..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div
                className={`feedback-submit-char-count ${comment.length >= 900 ? "near-limit" : ""}`}
              >
                {comment.length} / 1000 ký tự
              </div>
            </div>

            <div className="feedback-submit-card__footer">
              <button
                type="button"
                className="feedback-submit-btn feedback-submit-btn--cancel"
                onClick={() => navigate("/appointments")}
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="feedback-submit-btn feedback-submit-btn--submit"
                disabled={submitting || point === 0}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                {submitting ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
