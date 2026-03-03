import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { manageBlogService, UploadService, getUploadFullUrl } from "../services";
import { Input, Button, Loading, Alert } from "../components/UI";

export function ManageBlogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = id === "new" || !id;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(!isCreate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isCreate && id) {
      const fetchOne = async () => {
        setLoading(true);
        setError(null);
        try {
          const { data } = await manageBlogService.getById(id);
          setTitle(data.title ?? "");
          setContent(data.content ?? "");
          setImage(data.image ?? "");
        } catch (err) {
          setError(err.response?.data?.message || "Không tải được bài blog");
        } finally {
          setLoading(false);
        }
      };
      fetchOne();
    }
  }, [id, isCreate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!title.trim()) {
      setFieldErrors((prev) => ({ ...prev, title: "Nhập tiêu đề" }));
      return;
    }
    if (!content.trim()) {
      setFieldErrors((prev) => ({ ...prev, content: "Nhập nội dung" }));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
      };
      if (image) payload.image = image;
      if (isCreate) {
        await manageBlogService.create(payload);
      } else {
        await manageBlogService.update(id, payload);
      }
      navigate("/staff/manage-blogs");
    } catch (err) {
      const res = err.response?.data;
      setError(res?.message || "Có lỗi xảy ra");
      if (res?.errors && typeof res.errors === "object") {
        setFieldErrors(res.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="page manage-blog-form-page">
      <div className="page-header">
        <div>
          <Link to="/staff/manage-blogs" className="back-link">
            ← Quay lại danh sách
          </Link>
          <h1 className="page-title">
            {isCreate ? "Thêm bài blog" : "Sửa bài blog"}
          </h1>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="form-container form-narrow">
        <Input
          label="Tiêu đề"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={fieldErrors.title}
          required
        />
        <div className="form-group">
          <label className="form-label">Nội dung</label>
          <textarea
            className="form-input form-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            required
          />
          {fieldErrors.content && (
            <span className="form-error">{fieldErrors.content}</span>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Ảnh bài viết</label>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadingImage(true);
              setError(null);
              try {
                const url = await UploadService.uploadImage(file);
                if (url) setImage(url);
                else setError("Không lấy được URL ảnh");
              } catch (err) {
                setError(err.response?.data?.message || "Upload ảnh thất bại");
              } finally {
                setUploadingImage(false);
              }
            }}
            disabled={uploadingImage}
            className="form-input"
          />
          {uploadingImage && <span className="form-hint">Đang tải lên...</span>}
          {image && (
            <div className="form-image-preview">
              <img src={getUploadFullUrl(image)} alt="Preview" />
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setImage("")}>
                Xóa ảnh
              </button>
            </div>
          )}
        </div>
        <div className="form-actions">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Đang lưu..." : isCreate ? "Tạo mới" : "Cập nhật"}
          </Button>
          <Link to="/staff/manage-blogs" className="btn btn-secondary">
            Hủy
          </Link>
        </div>
      </form>
    </div>
  );
}
