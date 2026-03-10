import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { manageServiceService, getUploadFullUrl } from "../services";
import { Loading, Alert } from "../components/UI";
import { PageHeader } from "../components/PageHeader";
import { SearchForm } from "../components/SearchForm";
import { Pagination } from "../components/Pagination";
import { EmptyState } from "../components/EmptyState";

export function ManageServiceList() {
  const [result, setResult] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const limit = 9;
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
          <Link to="/staff/manage-services/new" className="btn btn-primary manage-service-add-btn">
            <span className="manage-service-add-icon">+</span>
            Thêm gói dịch vụ
          </Link>
        }
      />

      {error && <Alert type="error">{error}</Alert>}

      <div className="manage-service-toolbar">
        <SearchForm
          placeholder="Tìm theo tên hoặc mô tả..."
          defaultValue={search}
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(e.target.search?.value?.trim() ?? "");
          }}
        />
      </div>

      <div className="manage-service-grid">
        {services?.length ? (
          services.map((sv) => (
            <article key={sv._id} className="manage-service-card">
              <Link to={`/staff/manage-services/${sv._id}`} className="manage-service-card-link">
                {sv.image ? (
                  <div className="manage-service-card-image">
                    <img src={getUploadFullUrl(sv.image)} alt={sv.name} />
                  </div>
                ) : (
                  <div className="manage-service-card-image manage-service-card-image-placeholder" />
                )}
                <div className="manage-service-card-body">
                  <h3 className="manage-service-card-title">{sv.name}</h3>
                  <p className="manage-service-card-desc">
                    {sv.description
                      ? sv.description.length > 100
                        ? sv.description.slice(0, 100) + "…"
                        : sv.description
                      : "—"}
                  </p>
                  <p className="manage-service-card-price">
                    {sv.price != null
                      ? Number(sv.price).toLocaleString("vi-VN") + " VNĐ"
                      : "—"}
                  </p>
                </div>
              </Link>
              <div className="manage-service-card-actions">
                <Link
                  to={`/staff/manage-services/${sv._id}`}
                  className="btn btn-outline manage-service-btn-edit"
                >
                  Xem / Sửa
                </Link>
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => handleDelete(sv._id, sv.name)}
                  disabled={deletingId === sv._id}
                  title="Xóa dịch vụ"
                >
                  {deletingId === sv._id ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            message="Chưa có gói dịch vụ nào. Hãy thêm gói dịch vụ mới."
            className="manage-service-empty"
          />
        )}
      </div>

      {services?.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={metadata?.total}
          onPrev={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      )}
    </div>
  );
}
