import React, { useState } from "react";
import { Link } from "react-router-dom";
import { blogService, getUploadFullUrl } from "../services";
import { Loading, Alert } from "../components/UI";
import { SearchForm } from "../components/SearchForm";
import { Pagination } from "../components/Pagination";

export function Blogs() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const perPage = 3;
  const filtered = mockBlogs.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">Bài viết</h1>
      <p className="mb-4 text-gray-600">
        Các bài viết về chăm sóc mắt và sức khỏe.
      </p>

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
            <Link
              key={blog._id}
              to={`/blogs/${blog._id}`}
              className="blog-card"
            >
              {blog.image ? (
                <div className="blog-card-image">
                  <img src={getUploadFullUrl(blog.image)} alt={blog.title} />
                </div>
              ) : (
                <div className="blog-card-image blog-card-image-placeholder" />
              )}
              <div className="blog-card-body">
                <h3 className="blog-card-title">{blog.title}</h3>
                <span className="blog-card-cta">Xem chi tiết</span>
              </div>
            </Link>
          ))
        ) : (
          <p>Chưa có bài viết nào.</p>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />
    </div>
  );
}
