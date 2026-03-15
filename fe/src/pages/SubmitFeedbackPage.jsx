import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { feedbackService, appointmentService } from "../services";
import { Loading, Alert } from "../components/UI";
import { PageHeader } from "../components/PageHeader";

const STAR_LABELS = ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc"];

// ─── Star Rating Input ────────────────────────────────────────────────────────
function StarRating({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="star-rating-input">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${active >= star ? "star-active" : ""}`}
          onMouseEnter={() => !disabled && setHovered(star)}
          onMouseLeave={() => !disabled && setHovered(0)}
          onClick={() => !disabled && onChange(star)}
          disabled={disabled}
          aria-label={`${star} sao`}
        >
          ★
        </button>
      ))}
      {active > 0 && (
        <span className="star-label">{STAR_LABELS[active]}</span>
      )}
    </div>
  );
}

// ─── Already Submitted View ───────────────────────────────────────────────────
function AlreadyReviewed({ feedback, appointment }) {
  const navigate = useNavigate();
  const doctorName = appointment?.doctorId?.fullName || "Bác sĩ";

  return (
    <div className="card feedback-done">
      <div className="feedback-done__icon">✅</div>
      <h3 className="feedback-done__title">Bạn đã đánh giá buổi khám này</h3>
      <p className="feedback-done__doctor">Bác sĩ: <strong>{doctorName}</strong></p>

      <div className="feedback-done__stars">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} className={s <= feedback.point ? "star-filled" : "star-empty"}>★</span>
        ))}
        <span className="star-label">{STAR_LABELS[feedback.point]}</span>
      </div>

      {feedback.comment && (
        <blockquote className="feedback-done__comment">
          "{feedback.comment}"
        </blockquote>
      )}

      <p className="feedback-done__date">
        Đã gửi ngày {new Date(feedback.createdAt).toLocaleDateString("vi-VN")}
      </p>

      <button
        className="btn btn-primary mt-3"
        onClick={() => navigate("/appointments")}
      >
        Quay lại lịch hẹn
      </button>
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
        setError(err.response?.data?.message || "Không tải được thông tin cuộc hẹn.");
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
      setError(err.response?.data?.message || "Gửi đánh giá thất bại. Vui lòng thử lại.");
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
          <button className="btn-link" onClick={() => navigate("/appointments")}>
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
      <PageHeader title="Đánh giá bác sĩ" />

      {/* Already submitted */}
      {existingFeedback && (
        <AlreadyReviewed feedback={existingFeedback} appointment={appointment} />
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
        <div className="card feedback-form-card">
          {/* Appointment info summary */}
          <div className="feedback-appt-info">
            <div className="feedback-appt-info__row">
              <span className="detail-label">Bác sĩ</span>
              <span className="font-semibold">{doctorName}</span>
            </div>
            <div className="feedback-appt-info__row">
              <span className="detail-label">Ngày khám</span>
              <span>{desiredDate}</span>
            </div>
            {appointment?.type && (
              <div className="feedback-appt-info__row">
                <span className="detail-label">Loại khám</span>
                <span>{appointment.type === "BASIC" ? "Cơ bản" : "Nâng cao"}</span>
              </div>
            )}
          </div>

          <div className="divider" />

          <form onSubmit={handleSubmit} className="feedback-form">
            <h3 className="section-title">Bạn cảm thấy thế nào về buổi khám?</h3>

            {error && <Alert type="error">{error}</Alert>}

            {/* Star rating */}
            <div className="form-group">
              <label className="form-label">
                Đánh giá <span className="required">*</span>
              </label>
              <StarRating value={point} onChange={setPoint} disabled={submitting} />
            </div>

            {/* Comment */}
            <div className="form-group">
              <label className="form-label" htmlFor="feedback-comment">
                Nhận xét <span className="text-muted">(tuỳ chọn)</span>
              </label>
              <textarea
                id="feedback-comment"
                className="form-input"
                rows={4}
                maxLength={1000}
                placeholder="Chia sẻ trải nghiệm của bạn về bác sĩ và buổi khám..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={submitting}
              />
              <p className="form-hint">{comment.length}/1000 ký tự</p>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/appointments")}
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || point === 0}
              >
                {submitting ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
