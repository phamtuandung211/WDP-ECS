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
  const shortDesc = plainDesc.slice(0, 220) || "Thong tin dang duoc cap nhat.";
  const htmlDesc = toHtml(service.description || "");
  const hasPrice = service.price != null;

  const servicePrice = hasPrice
    ? `${Number(service.price).toLocaleString("vi-VN")} VND`
    : "Lien he";

  let estimatedDuration = "20-40 phut";
  const durationText = `${service.name || ""} ${plainDesc}`;
  if (/phau thuat|laser|lasik|smile/i.test(durationText)) {
    estimatedDuration = "45-60 phut";
  } else if (/tre em|nhi|hoc sinh/i.test(durationText)) {
    estimatedDuration = "30-45 phut";
  }

  const serviceAudience = /tre em|nhi|hoc sinh/i.test(
    `${service.name || ""} ${plainDesc}`,
  )
    ? "Tre tu 3 tuoi tro len"
    : "Moi do tuoi";

  return (
    <div className="page vsdetail-page">
      <div className="vsdetail-back-bar">
        <Link to="/services" className="vsdetail-back-link">
          <span>←</span>
          <span>Danh sach dich vu</span>
        </Link>
      </div>

      <div className="vsdetail-wrap">
        <div className="vsdetail-content">
          <div className="vsdetail-eyebrow">
            <span className="vsdetail-eyebrow-dot" />
            <span>Dich vu kham mat</span>
          </div>

          <h1 className="vsdetail-title">{service.name || "Dich vu"}</h1>

          <div className="vsdetail-price-inline">
            <span className="vsdetail-price-num">{servicePrice}</span>
            <span className="vsdetail-price-unit">/ luot kham</span>
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
            <span className="vsdetail-tag">✅ Khong xam lan</span>
            <span className="vsdetail-tag">🛡 An toan</span>
          </div>

          <div className="vsdetail-divider" />

          <div className="vsdetail-cta-strip">
            <Link to="/appointments" className="vsdetail-btn-book-lg">
              Dat lich kham ngay
            </Link>
            <Link to="/appointments" className="vsdetail-btn-ask">
              Tu van mien phi
            </Link>
          </div>

          <p className="vsdetail-cta-note">
            ℹ Huy lich mien phi truoc 24 gio · Khong phat sinh phu phi
          </p>

          <Link to="/services" className="vsdetail-back-bottom">
            ← Quay lai danh sach dich vu
          </Link>
        </div>

        <aside className="vsdetail-sidebar">
          <div className="vsdetail-cta-card">
            <p className="vsdetail-cta-label">Chi phi dich vu</p>
            <p className="vsdetail-cta-price">{servicePrice}</p>
            <p className="vsdetail-cta-unit">
              / luot kham · Chua bao gom thuoc
            </p>
            <div className="vsdetail-cta-divider" />
            <Link to="/appointments" className="vsdetail-btn-book-cta">
              Dat lich kham ngay
            </Link>
            <Link to="/appointments" className="vsdetail-btn-ask-cta">
              Tu van mien phi
            </Link>
            <p className="vsdetail-cta-note-dark">
              Huy lich mien phi truoc 24 gio
            </p>
          </div>

          <div className="vsdetail-s-card">
            <h3 className="vsdetail-s-card-head">Thong tin dich vu</h3>
            <div className="vsdetail-meta-list">
              <div className="vsdetail-meta-row">
                <span className="vsdetail-meta-icon">⏱️</span>
                <div>
                  <span className="vsdetail-meta-label">Thoi gian</span>
                  <span className="vsdetail-meta-val">{estimatedDuration}</span>
                </div>
              </div>
              <div className="vsdetail-meta-row">
                <span className="vsdetail-meta-icon">📅</span>
                <div>
                  <span className="vsdetail-meta-label">Lich gan nhat</span>
                  <span className="vsdetail-meta-val">Hom nay</span>
                </div>
              </div>
              <div className="vsdetail-meta-row">
                <span className="vsdetail-meta-icon">🏥</span>
                <div>
                  <span className="vsdetail-meta-label">Dia diem</span>
                  <span className="vsdetail-meta-val">Co so VisionCare</span>
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
