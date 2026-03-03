import React from "react";
import { Link, useParams } from "react-router-dom";
import { blogService, getUploadFullUrl } from "../services";
import { Loading, Alert } from "../components/UI";

export function BlogDetail() {
  const { id } = useParams();
  const blog = mockBlogs.find((b) => b.id === id);
  if (!blog) return <p className="p-4">Bài viết không tồn tại.</p>;

  return (
    <div className="page blog-detail-page">
      <Link to="/blogs" className="back-link">
        ← Danh sách bài viết
      </Link>
      <article className="blog-detail-card">
        {blog.image && (
          <div className="blog-detail-image">
            <img src={getUploadFullUrl(blog.image)} alt={blog.title} />
          </div>
        )}
        <div className="blog-detail-body">
          <h1 className="blog-detail-title">{blog.title}</h1>
          <div className="blog-detail-content">{blog.content}</div>
          <Link to="/blogs" className="btn btn-secondary">
            Quay lại danh sách
          </Link>
        </div>
      </article>
    </div>
  );
}
