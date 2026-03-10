import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { manageBlogService, UploadService, getUploadFullUrl } from "../services";
import { Input, Button, Loading, Alert } from "../components/UI";
import { PageHeader } from "../components/PageHeader";

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

  const handleImageChange = async (e) => {
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
  };

  if (loading) return <Loading />;

  return (
    <div className="page manage-blog-form-page">
      <PageHeader
        backTo="/staff/manage-blogs"
        backLabel="← Quay lại danh sách"
        title={isCreate ? "Thêm bài blog" : "Xem / Sửa bài blog"}
      />

      {error && <Alert type="error">{error}</Alert>}

      <div className="manage-blog-form-wrap">
        <form onSubmit={handleSubmit} className="manage-blog-form">
          <div className="manage-blog-form-main">
            <div className="manage-blog-form-fields">
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
                  className="form-input form-textarea manage-blog-textarea"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  required
                  placeholder="Nội dung bài viết..."
                />
                {fieldErrors.content && (
                  <span className="form-error">{fieldErrors.content}</span>
                )}
              </div>
            </div>

            <div className="manage-blog-form-image-section">
              <label className="form-label">Ảnh bài viết</label>
              <div
                className={`manage-blog-image-zone ${image ? "has-image" : ""} ${uploadingImage ? "uploading" : ""}`}
              >
                {image ? (
                  <>
                    <div className="manage-blog-image-preview">
                      <img src={getUploadFullUrl(image)} alt="Preview" />
                    </div>
                    <div className="manage-blog-image-actions">
                      <label className="btn btn-outline btn-sm">
                        Đổi ảnh
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          disabled={uploadingImage}
                          className="manage-blog-file-input"
                        />
                      </label>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => setImage("")}
                      >
                        Xóa ảnh
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="manage-blog-image-upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={uploadingImage}
                      className="manage-blog-file-input"
                    />
                    <span className="manage-blog-image-upload-icon">📷</span>
                    <span className="manage-blog-image-upload-text">
                      {uploadingImage ? "Đang tải lên..." : "Chọn ảnh hoặc kéo thả vào đây"}
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="manage-blog-form-actions">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : isCreate ? "Tạo bài blog" : "Cập nhật"}
            </Button>
            <Link to="/staff/manage-blogs" className="btn btn-secondary">
              Hủy
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
