import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { blogService, getUploadFullUrl } from "../services";
import { Loading, Alert } from "../components/UI";

/** Chuẩn hóa nội dung: đã là HTML (từ CKEditor) thì dùng nguyên, plain text cũ thì bọc thành HTML. */
function toHtml(content) {
  if (!content || typeof content !== "string") return "";
  const s = content.trim();
  if (!s) return "";
  if (s.includes("</") && (s.includes("<p>") || s.includes("<h") || s.includes("<div"))) return s;
  return "<p>" + s.replace(/\n/g, "</p><p>") + "</p>";
}

/** Render nội dung blog (luôn HTML, style h2/h3/strong/p/list trong CSS). */
function renderBlogContent(content) {
  const html = toHtml(content);
  if (!html) return null;
  return <div className="blog-detail-content" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function BlogDetail() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchOne = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await blogService.getById(id);
        setBlog(data);
      } catch (err) {
        setError(err.response?.data?.message || "Không tải được bài viết");
      } finally {
        setLoading(false);
      }
    };
    fetchOne();
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <Alert type="error">{error}</Alert>;
  if (!blog) return null;

  return (
    <div className="page blog-detail-page">
      <Link to="/blogs" className="back-link">← Danh sách bài viết</Link>
      <article className="blog-detail-card">
        {blog.image && (
          <div className="blog-detail-image">
            <img src={getUploadFullUrl(blog.image)} alt={blog.title} />
          </div>
        )}
        <div className="blog-detail-body">
          <h1 className="blog-detail-title">{blog.title}</h1>
          {renderBlogContent(blog.content)}
          <Link to="/blogs" className="btn btn-secondary">Quay lại danh sách</Link>
        </div>
      </article>
    </div>
  );
}
