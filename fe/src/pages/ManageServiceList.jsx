import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { manageServiceService, getUploadFullUrl } from "../services";
import { Loading, Alert } from "../components/UI";
import { PageHeader } from "../components/PageHeader";
import { SearchForm } from "../components/SearchForm";
import { Pagination } from "../components/Pagination";

export function ManageServiceList() {
  const [result, setResult] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const limit = 10;
  const { data: services, metadata } = result;

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

  useEffect(() => {
    fetchList();
  }, [page, search]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa dịch vụ "${name}"?`)) return;
    setDeletingId(id);
    setError(null);
    try {
      await manageServiceService.delete(id);
      await fetchList();
    } catch (err) {
      setError(err.response?.data?.message || "Xóa thất bại");
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = metadata?.totalPages ?? 1;

  if (loading && !services?.length) return <Loading />;

  return (
    <div className="page manage-service-list-page">
      <PageHeader
        backTo="/staff/dashboard"
        backLabel="← Dashboard"
        title="Quản lý gói dịch vụ"
        action={
          <Link to="/staff/manage-services/new" className="btn btn-primary">
            Thêm gói dịch vụ
          </Link>
        }
      />

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

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Tên</th>
              <th>Mô tả</th>
              <th>Giá (VNĐ)</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {services?.length ? (
              services.map((sv) => (
                <tr key={sv._id}>
                  <td>
                    {sv.image ? (
                      <img src={getUploadFullUrl(sv.image)} alt={sv.name} className="table-thumb" />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>{sv.name}</td>
                  <td className="cell-desc">{sv.description}</td>
                  <td>{sv.price != null ? Number(sv.price).toLocaleString("vi-VN") : "—"}</td>
                  <td>
                    <div className="table-actions">
                      <Link
                        to={`/staff/manage-services/${sv._id}`}
                        className="btn-link"
                      >
                        Xem / Sửa
                      </Link>
                      <button
                        type="button"
                        className="btn-link btn-link-danger"
                        onClick={() => handleDelete(sv._id, sv.name)}
                        disabled={deletingId === sv._id}
                      >
                        {deletingId === sv._id ? "Đang xóa..." : "Xóa"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="cell-empty">
                  Chưa có gói dịch vụ nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
