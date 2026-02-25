import React, { useEffect, useState } from "react";
import { blogService } from "../services";
import { Loading, Alert } from "../components/UI";

function truncate(str, maxLen) {
  if (!str) return "";
  return str.length <= maxLen ? str : str.slice(0, maxLen) + "…";
}

export function Blogs() {
  const [result, setResult] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const limit = 9;
  const { data: blogs, metadata } = result;

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await blogService.getList({
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
    fetchList();
  }, [page, search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(e.target.search?.value?.trim() ?? "");
  };

  const totalPages = metadata?.totalPages ?? 1;

  if (loading && !blogs?.length) return <Loading />;

  return (
    <div className="page blogs-page">
      <h1 className="blogs-page-title">Bài viết</h1>
      <p className="blogs-page-desc">
        Các bài viết về chăm sóc mắt và sức khỏe.
      </p>

      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={handleSearchSubmit} className="search-form">
        <input
          type="text"
          name="search"
          className="form-input search-input"
          placeholder="Tìm theo tiêu đề hoặc nội dung..."
          defaultValue={search}
        />
        <button type="submit" className="btn btn-secondary">
          Tìm kiếm
        </button>
      </form>

      <div className="blogs-grid">
        {blogs?.length ? (
          blogs.map((blog) => (
            <article key={blog._id} className="blog-card">
              <h3 className="blog-card-title">{blog.title}</h3>
              <p className="blog-card-content">{truncate(blog.content, 120)}</p>
            </article>
          ))
        ) : (
          <p className="blogs-empty">Chưa có bài viết nào.</p>
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
