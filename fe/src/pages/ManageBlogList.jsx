import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { manageBlogService, getUploadFullUrl } from "../services";
import { Loading, Alert } from "../components/UI";
import { PageHeader } from "../components/PageHeader";
import { SearchForm } from "../components/SearchForm";
import { Pagination } from "../components/Pagination";
import { EmptyState } from "../components/EmptyState";

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

  const limit = 9;
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
          <Link to="/staff/manage-blogs/new" className="btn btn-primary manage-blog-add-btn">
            <span className="manage-blog-add-icon">+</span>
            Thêm bài blog
          </Link>
        }
      />

      {error && <Alert type="error">{error}</Alert>}

      <div className="manage-blog-toolbar">
        <SearchForm
          placeholder="Tìm theo tiêu đề hoặc nội dung..."
          defaultValue={search}
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(e.target.search?.value?.trim() ?? "");
          }}
        />
      </div>

      <div className="manage-blog-grid">
        {blogs?.length ? (
          blogs.map((blog) => (
            <article key={blog._id} className="manage-blog-card">
              <Link to={`/staff/manage-blogs/${blog._id}`} className="manage-blog-card-link">
                {blog.image ? (
                  <div className="manage-blog-card-image">
                    <img src={getUploadFullUrl(blog.image)} alt={blog.title} />
                  </div>
                ) : (
                  <div className="manage-blog-card-image manage-blog-card-image-placeholder" />
                )}
                <div className="manage-blog-card-body">
                  <h3 className="manage-blog-card-title">{blog.title}</h3>
                  <p className="manage-blog-card-content">
                    {blog.content
                      ? truncate(blog.content, 120)
                      : "—"}
                  </p>
                </div>
              </Link>
              <div className="manage-blog-card-actions">
                <Link
                  to={`/staff/manage-blogs/${blog._id}`}
                  className="btn btn-outline manage-blog-btn-edit"
                >
                  Xem / Sửa
                </Link>
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => handleDelete(blog._id, blog.title)}
                  disabled={deletingId === blog._id}
                  title="Xóa bài viết"
                >
                  {deletingId === blog._id ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            message="Chưa có bài blog nào. Hãy thêm bài viết mới."
            className="manage-blog-empty"
          />
        )}
      </div>

      {blogs?.length > 0 && (
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
