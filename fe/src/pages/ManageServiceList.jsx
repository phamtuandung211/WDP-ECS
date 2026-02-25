import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { manageServiceService } from "../services";
import { Loading, Alert } from "../components/UI";

export function ManageServiceList() {
  const [result, setResult] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const limit = 10;
  const { data: services, metadata } = result;

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await manageServiceService.getList({
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
    <div className="page manage-service-list-page">
      <div className="page-header">
        <div>
          <Link to="/staff/dashboard" className="back-link">← Dashboard</Link>
          <h1 className="page-title">Quản lý gói dịch vụ</h1>
        </div>
        <Link to="/staff/manage-services/new" className="btn btn-primary">
          Thêm gói dịch vụ
        </Link>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={handleSearchSubmit} className="search-form">
        <input
          type="text"
          name="search"
          className="form-input search-input"
          placeholder="Tìm theo tên hoặc mô tả..."
          defaultValue={search}
        />
        <button type="submit" className="btn btn-secondary">Tìm kiếm</button>
      </form>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Mô tả</th>
              <th>Giá (VNĐ)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {services?.length ? (
              services.map((sv) => (
                <tr key={sv._id}>
                  <td>{sv.name}</td>
                  <td className="cell-desc">{sv.description}</td>
                  <td>{sv.price != null ? Number(sv.price).toLocaleString("vi-VN") : "—"}</td>
                  <td>
                    <Link
                      to={`/staff/manage-services/${sv._id}`}
                      className="btn-link"
                    >
                      Xem / Sửa
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="cell-empty">
                  Chưa có gói dịch vụ nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
