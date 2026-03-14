import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { serviceService, getUploadFullUrl } from "../services";
import { Loading, Alert } from "../components/UI";

/** Chuẩn hóa mô tả: đã là HTML thì dùng nguyên, plain text cũ thì bọc thành HTML. */
function toHtml(content) {
  if (!content || typeof content !== "string") return "";
  const s = content.trim();
  if (!s) return "";
  if (s.includes("</") && (s.includes("<p>") || s.includes("<h") || s.includes("<div"))) return s;
  return "<p>" + s.replace(/\n/g, "</p><p>") + "</p>";
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
        setError(err.response?.data?.message || "Không tải được thông tin dịch vụ");
      } finally {
        setLoading(false);
      }
    };
    fetchOne();
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <Alert type="error">{error}</Alert>;
  if (!service) return null;

  return (
    <div className="page service-detail-page">
      <Link to="/services" className="back-link">← Danh sách dịch vụ</Link>
      <div className="service-detail-card">
        {service.image && (
          <div className="service-detail-image">
            <img src={getUploadFullUrl(service.image)} alt={service.name} />
          </div>
        )}
        <div className="service-detail-body">
          <h1 className="service-detail-title">{service.name}</h1>
          <p className="service-detail-price">
            {service.price != null
              ? Number(service.price).toLocaleString("vi-VN") + " VNĐ"
              : "—"}
          </p>
          {service.description && (() => {
            const html = toHtml(service.description);
            return html ? (
              <div
                className="service-detail-desc service-detail-desc--html"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : null;
          })()}
          <Link to="/services" className="btn btn-secondary">Quay lại danh sách</Link>
        </div>
      </div>
    </div>
  );
}
