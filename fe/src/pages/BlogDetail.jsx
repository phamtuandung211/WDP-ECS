import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { blogService, getUploadFullUrl } from "../services";
import { Loading, Alert } from "../components/UI";

/** Nhận dạng dòng là tiêu đề mục (số + chấm/ngoặc + nội dung), ví dụ: "1. Tăng nhãn áp là gì?" */
function isSectionHeading(line) {
  const t = line.trim();
  return /^\d+[.)]\s+.+$/.test(t);
}

/** Nội dung có chứa HTML thật (đã lưu từ trước) thì render HTML; còn lại parse plain text thành đoạn + heading. */
function renderBlogContent(content) {
  if (!content || typeof content !== "string") return null;
  const s = content.trim();
  if (s.includes("</") && (s.includes("<p>") || s.includes("<h2>") || s.includes("<h3>") || s.includes("<div"))) {
    return (
      <div
        className="blog-detail-content blog-detail-content--html"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  const lines = content.split(/\r?\n/);
  const blocks = [];
  let paragraphLines = [];
  const flushParagraph = () => {
    if (paragraphLines.length) {
      blocks.push({ type: "p", text: paragraphLines.join(" ") });
      paragraphLines = [];
    }
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === "") {
      flushParagraph();
      continue;
    }
    if (isSectionHeading(trimmed)) {
      flushParagraph();
      blocks.push({ type: "h", text: trimmed });
    } else {
      paragraphLines.push(trimmed);
    }
  }
  flushParagraph();
  return (
    <div className="blog-detail-content blog-detail-content--parsed">
      {blocks.map((block, i) =>
        block.type === "h" ? (
          <div key={i} className="blog-detail-heading">
            {block.text}
          </div>
        ) : (
          <p key={i} className="blog-detail-content-p">
            {block.text}
          </p>
        )
      )}
    </div>
  );
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
