import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { serviceService, getUploadFullUrl } from "../services";
import { Loading, Alert } from "../components/UI";

/** Chuẩn hóa mô tả: đã là HTML thì dùng nguyên, plain text cũ thì bọc thành HTML. */
function toHtml(content) {
  if (!content || typeof content !== "string") return "";
  const s = content.trim();
  if (!s) return "";
  if (
    s.includes("</") &&
    (s.includes("<p>") || s.includes("<h") || s.includes("<div"))
  )
    return s;
  return "<p>" + s.replaceAll("\n", "</p><p>") + "</p>";
}

function stripHtml(content) {
  return (content || "")
    .replaceAll(/<[^>]*>/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}

export function ServiceDetail() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchOne = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await serviceService.getById(id);
        setService(data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Không tải được thông tin dịch vụ",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchOne();
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <Alert type="error">{error}</Alert>;
  if (!service) return null;

  const plainDesc = stripHtml(service.description || "");
  const shortDesc = plainDesc.slice(0, 220) || "Thông tin đang được cập nhật.";
  const htmlDesc = toHtml(service.description || "");
  const hasPrice = service.price != null;

  const servicePrice = hasPrice
    ? `${Number(service.price).toLocaleString("vi-VN")} VND`
    : "Liên hệ";

  let estimatedDuration = "20-40 phút";
  const durationText = `${service.name || ""} ${plainDesc}`;
  if (/phau thuat|laser|lasik|smile/i.test(durationText)) {
    estimatedDuration = "45-60 phút";
  } else if (/tre em|nhi|hoc sinh/i.test(durationText)) {
    estimatedDuration = "30-45 phút";
  }

  const serviceAudience = /tre em|nhi|hoc sinh/i.test(
    `${service.name || ""} ${plainDesc}`,
  )
    ? "Trẻ từ 3 tuổi trở lên"
    : "Mọi độ tuổi";

  const handleOpenChat = () => {
    globalThis.dispatchEvent(new CustomEvent("open-eyecare-chat"));
  };

  return (
    <div className="page vsdetail-page">
      <div className="vsdetail-back-bar">
        <Link to="/services" className="vsdetail-back-link">
          <span>←</span>
          <span>Danh sách dịch vụ</span>
        </Link>
      </div>

      <div className="vsdetail-wrap">
        <div className="vsdetail-content">
          <div className="vsdetail-eyebrow">
            <span className="vsdetail-eyebrow-dot" />
            <span>Dịch vụ khám mắt</span>
          </div>

          <h1 className="vsdetail-title">{service.name || "Dịch vụ"}</h1>

          <div className="vsdetail-price-inline">
            <span className="vsdetail-price-num">{servicePrice}</span>
            <span className="vsdetail-price-unit">/ lượt khám</span>
          </div>

          {service.image ? (
            <div className="vsdetail-hero-image">
              <img
                src={getUploadFullUrl(service.image)}
                alt={service.name || "Service"}
              />
            </div>
          ) : null}

          <div className="vsdetail-desc-block">
            <p className="vsdetail-desc-text">{shortDesc}</p>
          </div>

          {htmlDesc ? (
            <div
              className="vsdetail-desc-html"
              dangerouslySetInnerHTML={{ __html: htmlDesc }}
            />
          ) : null}

          <div className="vsdetail-tags">
            <span className="vsdetail-tag">⏱ {estimatedDuration}</span>
            <span className="vsdetail-tag">👥 {serviceAudience}</span>
            <span className="vsdetail-tag">✅ Không xâm lấn</span>
            <span className="vsdetail-tag">🛡 An toàn</span>
          </div>

          <div className="vsdetail-divider" />

          <div className="vsdetail-cta-strip">
            <Link to="/appointments" className="vsdetail-btn-book-lg">
              Đặt lịch khám ngay
            </Link>
            <button
              type="button"
              className="vsdetail-btn-ask"
              onClick={handleOpenChat}
            >
              Tư vấn miễn phí
            </button>
          </div>

          {/* <p className="vsdetail-cta-note">
            ℹ Hủy lịch miễn phí trước 24 giờ · Không phát sinh phụ phí
          </p> */}

          {/* <Link to="/services" className="vsdetail-back-bottom">
            ← Quay lại danh sách dịch vụ
          </Link> */}
        </div>

        <aside className="vsdetail-sidebar">
          <div className="vsdetail-cta-card">
            <p className="vsdetail-cta-label">Chi phí dịch vụ</p>
            <p className="vsdetail-cta-price">{servicePrice}</p>
            <p className="vsdetail-cta-unit">
              / lượt khám · Chưa bao gồm thuốc
            </p>
            <div className="vsdetail-cta-divider" />
            <Link to="/appointments" className="vsdetail-btn-book-cta">
              Đặt lịch khám ngay
            </Link>
            <button
              type="button"
              className="vsdetail-btn-ask-cta"
              onClick={handleOpenChat}
            >
              Tư vấn miễn phí
            </button>
            {/* <p className="vsdetail-cta-note-dark">
              Hủy lịch miễn phí trước 24 giờ
            </p> */}
          </div>

          <div className="vsdetail-s-card">
            <h3 className="vsdetail-s-card-head">Thông tin dịch vụ</h3>
            <div className="vsdetail-meta-list">
              <div className="vsdetail-meta-row">
                <span className="vsdetail-meta-icon">⏱️</span>
                <div>
                  <span className="vsdetail-meta-label">Thời gian</span>
                  <span className="vsdetail-meta-val">{estimatedDuration}</span>
                </div>
              </div>
              <div className="vsdetail-meta-row">
                <span className="vsdetail-meta-icon">📅</span>
                <div>
                  <span className="vsdetail-meta-label">Lịch gần nhất</span>
                  <span className="vsdetail-meta-val">Hôm nay</span>
                </div>
              </div>
              <div className="vsdetail-meta-row">
                <span className="vsdetail-meta-icon">🏥</span>
                <div>
                  <span className="vsdetail-meta-label">Địa điểm</span>
                  <span className="vsdetail-meta-val">Cơ sở VisionCare</span>
                </div>
              </div>
              <div className="vsdetail-meta-row">
                <span className="vsdetail-meta-icon">👶</span>
                <div>
                  <span className="vsdetail-meta-label">Doi tuong</span>
                  <span className="vsdetail-meta-val">{serviceAudience}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
