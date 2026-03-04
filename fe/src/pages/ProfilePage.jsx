import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { profileService, UploadService } from "../services";
import { Loading, Alert, Input, Button } from "../components/UI";

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=4361ee&color=fff&size=200";

const ROLE_LABEL = {
  ADMIN: "Quản trị viên",
  DOCTOR: "Bác sĩ",
  CUSTOMER: "Khách hàng",
  SALE_STAFF: "Nhân viên kinh doanh",
  CUSTOMER_SUPPORT: "Hỗ trợ khách hàng",
};

const STATUS_CONFIG = {
  ACTIVE:   { label: "Hoạt động",    color: "#22863a", bg: "#dafbe1" },
  INACTIVE: { label: "Không hoạt động", color: "#e36209", bg: "#fffbdd" },
  PENDING:  { label: "Chờ duyệt",    color: "#0366d6", bg: "#dbeafe" },
  BANNED:   { label: "Bị khoá",      color: "#d73a49", bg: "#ffeef0" },
};

export function ProfilePage() {
  const { user, updateUser } = useAuth();
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
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await profileService.getMyProfile();
        const d = data.data;
        setProfile(d);
        setForm({
          fullName: d.fullName || "",
          phone: d.phone || "",
          gender: d.gender || "",
          dateOfBirth: d.dateOfBirth ? d.dateOfBirth.slice(0, 10) : "",
          address: d.address || "",
        });
        if (d.avatar) setAvatarPreview(d.avatar);
      } catch (err) {
        setError(err.response?.data?.message || "Không tải được thông tin");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Chỉ chấp nhận file ảnh (jpg, png, webp)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh không được vượt quá 5MB");
      return;
    }
    setError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      let avatarUrl = null;

      if (avatarFile) {
        avatarUrl = await UploadService.uploadImage(avatarFile);
        if (!avatarUrl) throw new Error("Upload ảnh thất bại");
      }

      const payload = {
        fullName: form.fullName,
        phone: form.phone,
        ...(form.gender && { gender: form.gender }),
        ...(form.dateOfBirth && { dateOfBirth: form.dateOfBirth }),
        ...(form.address && { address: form.address }),
        ...(avatarUrl && { avatar: avatarUrl }),
      };

      const { data } = await profileService.updateMyProfile(payload);
      const updatedAvatar = data.data?.avatar;
      if (updatedAvatar) {
        setAvatarPreview(updatedAvatar);
        updateUser({ avatar: updatedAvatar, fullName: form.fullName });
      } else {
        updateUser({ fullName: form.fullName });
      }
      setAvatarFile(null);
      setSuccess("Cập nhật thông tin thành công!");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  const displayAvatar =
    avatarPreview ||
    `${DEFAULT_AVATAR}&name=${encodeURIComponent(form.fullName || "User")}`;

  const statusCfg = STATUS_CONFIG[profile?.account?.status] || {};
  const roleLabel = ROLE_LABEL[user?.role] || user?.role;

  return (
    <div className="page profile-page-v2">
      {/* ── Page Title ── */}
      <div className="pv2-title-row">
        <div>
          <h1 className="pv2-heading">Thông tin cá nhân</h1>
          <p className="pv2-subheading">Quản lý thông tin hồ sơ của bạn</p>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="pv2-layout">
        {/* ── Left Column: Avatar + Account Info ── */}
        <aside className="pv2-sidebar">
          {/* Avatar Card */}
          <div className="pv2-card pv2-avatar-card">
            <div className="pv2-avatar-wrap">
              <img
                src={displayAvatar}
                alt="Avatar"
                className="pv2-avatar-img"
                onError={(e) => {
                  e.currentTarget.src = `${DEFAULT_AVATAR}&name=${encodeURIComponent(
                    form.fullName || "User"
                  )}`;
                }}
              />
              <button
                type="button"
                className="pv2-avatar-overlay"
                onClick={() => fileInputRef.current?.click()}
                title="Thay đổi ảnh đại diện"
              >
                <span className="pv2-avatar-overlay-icon">📷</span>
                <span className="pv2-avatar-overlay-text">Thay ảnh</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
            <div className="pv2-avatar-info">
              <p className="pv2-avatar-name">{form.fullName || "—"}</p>
              <span className={`badge badge-${user?.role?.toLowerCase()}`}>
                {roleLabel}
              </span>
            </div>
            {avatarFile && (
              <div className="pv2-avatar-hint">
                <span className="pv2-avatar-hint-icon">📎</span>
                <span>{avatarFile.name}</span>
              </div>
            )}
          </div>

          {/* Account Info Card */}
          {profile?.account && (
            <div className="pv2-card pv2-info-card">
              <h3 className="pv2-info-card-title">Thông tin tài khoản</h3>

              {/* Avatar hiển thị trong thông tin cá nhân */}
              <div className="pv2-account-avatar-wrap">
                <img
                  src={displayAvatar}
                  alt="Ảnh đại diện"
                  className="pv2-account-avatar"
                  onError={(e) => {
                    e.currentTarget.src = `${DEFAULT_AVATAR}&name=${encodeURIComponent(
                      form.fullName || "User"
                    )}`;
                  }}
                />
                <div className="pv2-account-avatar-meta">
                  <p className="pv2-account-avatar-name">{form.fullName || "—"}</p>
                  <span className={`badge badge-${user?.role?.toLowerCase()}`}>
                    {roleLabel}
                  </span>
                </div>
              </div>

              <ul className="pv2-info-list">
                <li className="pv2-info-item">
                  <span className="pv2-info-icon">✉️</span>
                  <div>
                    <p className="pv2-info-label">Email</p>
                    <p className="pv2-info-value">{profile.account.email}</p>
                  </div>
                </li>
                <li className="pv2-info-item">
                  <span className="pv2-info-icon">🔰</span>
                  <div>
                    <p className="pv2-info-label">Vai trò</p>
                    <p className="pv2-info-value">{roleLabel}</p>
                  </div>
                </li>
                <li className="pv2-info-item">
                  <span className="pv2-info-icon">📋</span>
                  <div>
                    <p className="pv2-info-label">Trạng thái</p>
                    <span
                      className="pv2-status-badge"
                      style={{
                        color: statusCfg.color,
                        background: statusCfg.bg,
                      }}
                    >
                      {statusCfg.label || profile.account.status}
                    </span>
                  </div>
                </li>
                {profile.account.createdAt && (
                  <li className="pv2-info-item">
                    <span className="pv2-info-icon">🗓️</span>
                    <div>
                      <p className="pv2-info-label">Ngày tham gia</p>
                      <p className="pv2-info-value">
                        {new Date(profile.account.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          )}
        </aside>

        {/* ── Right Column: Edit Form ── */}
        <main className="pv2-main">
          <div className="pv2-card">
            <div className="pv2-form-header">
              <h2 className="pv2-form-title">Chỉnh sửa thông tin</h2>
              <p className="pv2-form-desc">
                Cập nhật thông tin cá nhân của bạn tại đây
              </p>
            </div>

            <form onSubmit={handleSubmit} className="pv2-form">
              {/* Row 1 */}
              <div className="pv2-form-row">
                <div className="form-group">
                  <label className="form-label">
                    Họ và tên <span className="pv2-required">*</span>
                  </label>
                  <input
                    className="form-input"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Số điện thoại <span className="pv2-required">*</span>
                  </label>
                  <input
                    className="form-input"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                    required
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="pv2-form-row">
                <div className="form-group">
                  <label className="form-label">Giới tính</label>
                  <select
                    name="gender"
                    className="form-input"
                    value={form.gender}
                    onChange={handleChange}
                  >
                    <option value="">-- Chọn giới tính --</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày sinh</label>
                  <input
                    className="form-input"
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Row 3 – full width */}
              <div className="form-group">
                <label className="form-label">Địa chỉ</label>
                <input
                  className="form-input"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ"
                />
              </div>

              <div className="pv2-form-footer">
                <Button type="submit" className="btn-primary pv2-save-btn" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="pv2-spinner" />
                      Đang lưu...
                    </>
                  ) : (
                    "💾  Lưu thay đổi"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
