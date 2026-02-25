import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { serviceService } from "../services";
import { Loading, Alert } from "../components/UI";

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
        <h1 className="service-detail-title">{service.name}</h1>
        <p className="service-detail-desc">{service.description}</p>
        <p className="service-detail-price">
          {service.price != null
            ? Number(service.price).toLocaleString("vi-VN") + " VNĐ"
            : "—"}
        </p>
        <Link to="/services" className="btn btn-secondary">Quay lại danh sách</Link>
      </div>
    </div>
  );
}
