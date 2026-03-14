import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { manageServiceService, UploadService, getUploadFullUrl } from "../services";
import { Input, Button, Loading, Alert } from "../components/UI";
import { PageHeader } from "../components/PageHeader";
import { BlogRichEditor } from "../components/BlogRichEditor";

export function ManageServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = id === "new" || !id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
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
          const { data } = await manageServiceService.getById(id);
          setName(data.name ?? "");
          setDescription(data.description ?? "");
          setPrice(data.price != null ? String(data.price) : "");
          setImage(data.image ?? "");
        } catch (err) {
          setError(err.response?.data?.message || "Không tải được thông tin dịch vụ");
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

    const priceNum = price.trim() === "" ? NaN : Number(price);
    if (!name.trim()) {
      setFieldErrors((prev) => ({ ...prev, name: "Nhập tên dịch vụ" }));
      return;
    }
    const descText = description.replace(/<[^>]+>/g, "").trim();
    if (!descText) {
      setFieldErrors((prev) => ({ ...prev, description: "Nhập mô tả" }));
      return;
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setFieldErrors((prev) => ({ ...prev, price: "Giá phải là số không âm" }));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
      };
      if (image) payload.image = image;
      if (isCreate) {
        await manageServiceService.create(payload);
      } else {
        await manageServiceService.update(id, payload);
      }
      navigate("/staff/manage-services");
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
    <div className="page manage-service-form-page">
      <PageHeader
        backTo="/staff/manage-services"
        backLabel="← Quay lại danh sách"
        title={isCreate ? "Thêm gói dịch vụ" : "Xem / Sửa gói dịch vụ"}
      />

      {error && <Alert type="error">{error}</Alert>}

      <div className="manage-service-form-wrap">
        <form onSubmit={handleSubmit} className="manage-service-form">
          <div className="manage-service-form-main">
            <div className="manage-service-form-fields">
              <Input
                label="Tên dịch vụ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={fieldErrors.name}
                required
              />
              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <BlogRichEditor
                  key={loading ? "loading" : isCreate ? "new" : id}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả chi tiết gói dịch vụ..."
                />
                {fieldErrors.description && (
                  <span className="form-error">{fieldErrors.description}</span>
                )}
              </div>
              <Input
                label="Giá (VNĐ)"
                type="number"
                min={0}
                step={1000}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                error={fieldErrors.price}
                placeholder="Ví dụ: 200000"
              />
            </div>

            <div className="manage-service-form-image-section">
              <label className="form-label">Ảnh dịch vụ</label>
              <div
                className={`manage-service-image-zone ${image ? "has-image" : ""} ${uploadingImage ? "uploading" : ""}`}
              >
                {image ? (
                  <>
                    <div className="manage-service-image-preview">
                      <img src={getUploadFullUrl(image)} alt="Preview" />
                    </div>
                    <div className="manage-service-image-actions">
                      <label className="btn btn-outline btn-sm">
                        Đổi ảnh
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          disabled={uploadingImage}
                          className="manage-service-file-input"
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
                  <label className="manage-service-image-upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={uploadingImage}
                      className="manage-service-file-input"
                    />
                    <span className="manage-service-image-upload-icon">📷</span>
                    <span className="manage-service-image-upload-text">
                      {uploadingImage ? "Đang tải lên..." : "Chọn ảnh hoặc kéo thả vào đây"}
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="manage-service-form-actions">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : isCreate ? "Tạo gói dịch vụ" : "Cập nhật"}
            </Button>
            <Link to="/staff/manage-services" className="btn btn-secondary">
              Hủy
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
