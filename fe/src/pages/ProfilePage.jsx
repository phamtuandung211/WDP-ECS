import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { profileService } from "../services";
import { Loading, Alert, Input, Button } from "../components/UI";
import { PageHeader } from "../components/PageHeader";

export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    avatar: "",
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await profileService.getMyProfile();
        setProfile(data.data);
        setForm({
          fullName: data.data.fullName || "",
          phone: data.data.phone || "",
          gender: data.data.gender || "",
          dateOfBirth: data.data.dateOfBirth
            ? data.data.dateOfBirth.slice(0, 10)
            : "",
          address: data.data.address || "",
          avatar: data.data.avatar || "",
        });
      } catch (err) {
        setError(err.response?.data?.message || "Không tải được thông tin");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = { ...form };
      if (!payload.dateOfBirth) delete payload.dateOfBirth;
      await profileService.updateMyProfile(payload);
      setSuccess("Cập nhật thành công!");
    } catch (err) {
      setError(err.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="page profile-page">
      <PageHeader title="Thông tin cá nhân" />

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="card profile-card">
        {profile?.account && (
          <div className="profile-meta">
            <p>
              <strong>Email:</strong> {profile.account.email}
            </p>
            <p>
              <strong>Role:</strong>{" "}
              <span className={`badge badge-${user?.role?.toLowerCase()}`}>
                {user?.role}
              </span>
            </p>
            <p>
              <strong>Trạng thái:</strong> {profile.account.status}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-grid">
            <Input
              label="Họ và tên"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
            />
            <Input
              label="Số điện thoại"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
            />
            <div className="form-group">
              <label className="form-label">Giới tính</label>
              <select
                name="gender"
                className="form-input"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">-- Chọn --</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
              </select>
            </div>
            <Input
              label="Ngày sinh"
              name="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={handleChange}
            />
            <Input
              label="Địa chỉ"
              name="address"
              value={form.address}
              onChange={handleChange}
            />
            <Input
              label="URL Avatar"
              name="avatar"
              value={form.avatar}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <div className="form-actions">
            <Button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
