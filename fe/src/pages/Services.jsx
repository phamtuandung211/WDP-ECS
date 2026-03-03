import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { serviceService, getUploadFullUrl } from "../services";
import { Loading, Alert } from "../components/UI";
import { SearchForm } from "../components/SearchForm";
import { Pagination } from "../components/Pagination";

export function Services() {
  const [result, setResult] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const limit = 9;
  const { data: services, metadata } = result;

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await serviceService.getList({
          page,
          limit,
          search: search || undefined,
        });
        setResult(data);
      } catch (err) {
        setError(err.response?.data?.message || "Không tải được danh sách dịch vụ");
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [page, search]);

  const totalPages = metadata?.totalPages ?? 1;

  if (loading && !services?.length) return <Loading />;

  return (
    <div className="page services-page">
      <h1 className="services-page-title">Gói dịch vụ</h1>
      <p className="services-page-desc">
        Xem các gói dịch vụ chăm sóc mắt của chúng tôi.
      </p>

      {error && <Alert type="error">{error}</Alert>}

      <SearchForm
        placeholder="Tìm theo tên hoặc mô tả..."
        defaultValue={search}
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(e.target.search?.value?.trim() ?? "");
        }}
      />

      <div className="services-grid">
        {services?.length ? (
          services.map((service) => (
            <Link key={service._id} to={`/services/${service._id}`} className="service-card">
              {service.image ? (
                <div className="service-card-image">
                  <img src={getUploadFullUrl(service.image)} alt={service.name} />
                </div>
              ) : (
                <div className="service-card-image service-card-image-placeholder" />
              )}
              <div className="service-card-body">
                <h3 className="service-card-title">{service.name}</h3>
                <p className="service-card-price">
                  {service.price != null
                    ? Number(service.price).toLocaleString("vi-VN") + " VNĐ"
                    : "—"}
                </p>
                <span className="service-card-cta">Xem chi tiết</span>
              </div>
            </Link>
          ))
        ) : (
          <p className="services-empty">Chưa có gói dịch vụ nào.</p>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={metadata?.total}
        onPrev={() => setPage((p) => p - 1)}
        onNext={() => setPage((p) => p + 1)}
      />
    </div>
  );
}
