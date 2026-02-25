import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { serviceService } from "../services";
import { Loading, Alert } from "../components/UI";

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(e.target.search?.value?.trim() ?? "");
  };

  const totalPages = metadata?.totalPages ?? 1;

  if (loading && !services?.length) return <Loading />;

  return (
    <div className="page services-page">
      <h1 className="services-page-title">Gói dịch vụ</h1>
      <p className="services-page-desc">
        Xem các gói dịch vụ chăm sóc mắt của chúng tôi.
      </p>

      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={handleSearchSubmit} className="search-form">
        <input
          type="text"
          name="search"
          className="form-input search-input"
          placeholder="Tìm theo tên hoặc mô tả..."
          defaultValue={search}
        />
        <button type="submit" className="btn btn-secondary">
          Tìm kiếm
        </button>
      </form>

      <div className="services-grid">
        {services?.length ? (
          services.map((service) => (
            <div key={service._id} className="service-card">
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <p className="price">
                {service.price != null
                  ? Number(service.price).toLocaleString("vi-VN") + " VNĐ"
                  : "—"}
              </p>
              <Link to={`/services/${service._id}`} className="btn">
                Xem chi tiết
              </Link>
            </div>
          ))
        ) : (
          <p className="services-empty">Chưa có gói dịch vụ nào.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Trước
          </button>
          <span className="pagination-info">
            Trang {page} / {totalPages} (tổng {metadata?.total ?? 0})
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
