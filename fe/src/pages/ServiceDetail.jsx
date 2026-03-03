import React from "react";
import { Link, useParams } from "react-router-dom";
import { serviceService, getUploadFullUrl } from "../services";
import { Loading, Alert } from "../components/UI";

export function ServiceDetail() {
  const { id } = useParams();
  const service = mockServices.find((s) => s.id === id);
  if (!service) return <p className="p-4">Dịch vụ không tồn tại.</p>;

  return (
    <div className="page service-detail-page">
      <Link to="/services" className="back-link">
        ← Danh sách dịch vụ
      </Link>
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
          {service.description && (
            <p className="service-detail-desc">{service.description}</p>
          )}
          <Link to="/services" className="btn btn-secondary">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    </div>
  );
}
