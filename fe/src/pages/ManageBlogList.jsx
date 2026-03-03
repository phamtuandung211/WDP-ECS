import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { manageBlogService, getUploadFullUrl } from "../services";
import { Loading, Alert } from "../components/UI";
import { PageHeader } from "../components/PageHeader";
import { SearchForm } from "../components/SearchForm";
import { Pagination } from "../components/Pagination";

function truncate(str, maxLen) {
  if (!str) return "";
  return str.length <= maxLen ? str : str.slice(0, maxLen) + "…";
}

export function ManageBlogList() {
  const [result, setResult] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const limit = 10;
  const { data: blogs, metadata } = result;

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await manageBlogService.getList({
        page,
        limit,
        search: search || undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được danh sách blog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [page, search]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bài viết "${title}"?`)) return;
    setDeletingId(id);
    setError(null);
    try {
      await manageBlogService.delete(id);
      await fetchList();
    } catch (err) {
      setError(err.response?.data?.message || "Xóa thất bại");
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = metadata?.totalPages ?? 1;

  if (loading && !blogs?.length) return <Loading />;

  return (
    <div className="page manage-blog-list-page">
      <PageHeader
        backTo="/staff/dashboard"
        backLabel="← Dashboard"
        title="Quản lý bài blog"
        action={
          <Link to="/staff/manage-blogs/new" className="btn btn-primary">
            Thêm bài blog
          </Link>
        }
      />

      {error && <Alert type="error">{error}</Alert>}

      <SearchForm
        placeholder="Tìm theo tiêu đề hoặc nội dung..."
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
              <th>Tiêu đề</th>
              <th>Nội dung</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {blogs?.length ? (
              blogs.map((blog) => (
                <tr key={blog._id}>
                  <td>
                    {blog.image ? (
                      <img src={getUploadFullUrl(blog.image)} alt={blog.title} className="table-thumb" />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>{blog.title}</td>
                  <td className="cell-desc">{truncate(blog.content, 80)}</td>
                  <td>
                    <div className="table-actions">
                      <Link
                        to={`/staff/manage-blogs/${blog._id}`}
                        className="btn-link"
                      >
                        Xem / Sửa
                      </Link>
                      <button
                        type="button"
                        className="btn-link btn-link-danger"
                        onClick={() => handleDelete(blog._id, blog.title)}
                        disabled={deletingId === blog._id}
                      >
                        {deletingId === blog._id ? "Đang xóa..." : "Xóa"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="cell-empty">
                  Chưa có bài blog nào.
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
