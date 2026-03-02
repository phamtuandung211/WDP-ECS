import React, { useState } from "react";
import { Link } from "react-router-dom";
import { blogs as mockBlogs } from "../mockData";
import { SearchForm } from "../components/SearchForm";
import { Pagination } from "../components/Pagination";

function truncate(str, maxLen) {
  if (!str) return "";
  return str.length <= maxLen ? str : str.slice(0, maxLen) + "…";
}

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

      <div className="grid gap-6">
        {paged.length ? (
          paged.map((blog) => (
            <article key={blog.id} className="border p-4 rounded bg-white">
              <h3 className="text-xl font-semibold mb-1">{blog.title}</h3>
              <p className="text-gray-600 mb-2">
                {truncate(blog.content, 120)}
              </p>
              <Link
                to={`/blogs/${blog.id}`}
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Xem chi tiết
              </Link>
            </article>
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
