import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { manageServiceService } from "../services";
import { Input, Button, Loading, Alert } from "../components/UI";

export function ManageServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = id === "new" || !id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
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
    if (!description.trim()) {
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

  if (loading) return <Loading />;

  return (
    <div className="page manage-service-form-page">
      <div className="page-header">
        <div>
          <Link to="/staff/manage-services" className="back-link">
            ← Quay lại danh sách
          </Link>
          <h1 className="page-title">
            {isCreate ? "Thêm gói dịch vụ" : "Sửa gói dịch vụ"}
          </h1>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="form-container form-narrow">
        <Input
          label="Tên dịch vụ"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          required
        />
        <div className="form-group">
          <label className="form-label">Mô tả</label>
          <textarea
            className="form-input form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
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
        <div className="form-actions">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Đang lưu..." : isCreate ? "Tạo mới" : "Cập nhật"}
          </Button>
          <Link to="/staff/manage-services" className="btn btn-secondary">
            Hủy
          </Link>
        </div>
      </form>
    </div>
  );
}
