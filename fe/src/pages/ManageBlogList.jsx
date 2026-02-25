import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { manageBlogService } from "../services";
import { Loading, Alert } from "../components/UI";

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

  const limit = 10;
  const { data: blogs, metadata } = result;

  useEffect(() => {
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
    <div className="page manage-blog-list-page">
      <div className="page-header">
        <div>
          <Link to="/staff/dashboard" className="back-link">← Dashboard</Link>
          <h1 className="page-title">Quản lý bài blog</h1>
        </div>
        <Link to="/staff/manage-blogs/new" className="btn btn-primary">
          Thêm bài blog
        </Link>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={handleSearchSubmit} className="search-form">
        <input
          type="text"
          name="search"
          className="form-input search-input"
          placeholder="Tìm theo tiêu đề hoặc nội dung..."
          defaultValue={search}
        />
        <button type="submit" className="btn btn-secondary">Tìm kiếm</button>
      </form>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Nội dung</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {blogs?.length ? (
              blogs.map((blog) => (
                <tr key={blog._id}>
                  <td>{blog.title}</td>
                  <td className="cell-desc">{truncate(blog.content, 80)}</td>
                  <td>
                    <Link
                      to={`/staff/manage-blogs/${blog._id}`}
                      className="btn-link"
                    >
                      Xem / Sửa
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="cell-empty">
                  Chưa có bài blog nào.
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
