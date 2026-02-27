import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { blogService } from "../services";
import { Loading, Alert } from "../components/UI";
import { SearchForm } from "../components/SearchForm";
import { Pagination } from "../components/Pagination";

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

  const totalPages = metadata?.totalPages ?? 1;

  if (loading && !blogs?.length) return <Loading />;

  return (
    <div className="page blogs-page">
      <h1 className="blogs-page-title">Bài viết</h1>
      <p className="blogs-page-desc">
        Các bài viết về chăm sóc mắt và sức khỏe.
      </p>

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

      <div className="blogs-grid">
        {blogs?.length ? (
          blogs.map((blog) => (
            <article key={blog._id} className="blog-card">
              <h3 className="blog-card-title">{blog.title}</h3>
              <p className="blog-card-content">{truncate(blog.content, 120)}</p>
              <Link to={`/blogs/${blog._id}`} className="btn btn-primary">
                Xem chi tiết
              </Link>
            </article>
          ))
        ) : (
          <p className="blogs-empty">Chưa có bài viết nào.</p>
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
