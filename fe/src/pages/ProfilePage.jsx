import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  profileService,
  UploadService,
  doctorProfileService,
  specializationService,
  getUploadFullUrl,
} from "../services";
import { Loading, Alert, Button } from "../components/UI";

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?background=4361ee&color=fff&size=200";

const ROLE_LABEL = {
  ADMIN: "Quản trị viên",
  DOCTOR: "Bác sĩ",
  CUSTOMER: "Khách hàng",
  SALE_STAFF: "Nhân viên kinh doanh",
  CUSTOMER_SUPPORT: "Hỗ trợ khách hàng",
};

const STATUS_CONFIG = {
  ACTIVE: { label: "Hoạt động", color: "#22863a", bg: "#dafbe1" },
  INACTIVE: { label: "Không hoạt động", color: "#e36209", bg: "#fffbdd" },
  PENDING: { label: "Chờ duyệt", color: "#0366d6", bg: "#dbeafe" },
  BANNED: { label: "Bị khoá", color: "#d73a49", bg: "#ffeef0" },
};

function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl leading-none"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 text-sm w-48 shrink-0">{label}</span>
      <span className="text-gray-900 font-medium">{value ?? "—"}</span>
    </div>
  );
}

function getAdultMaxDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0];
}

function getAge(birthDate) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age;
}

function validateDateOfBirth(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Ngày sinh không hợp lệ";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dob = new Date(d);
  dob.setHours(0, 0, 0, 0);

  if (dob >= today) return "Ngày sinh phải là ngày trong quá khứ";
  if (getAge(dob) < 18) return "Tuổi phải lớn hơn hoặc bằng 18";

  return null;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const isDoctor = user?.role === "DOCTOR";
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
    experienceYears: "",
    specializations: [],
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [allSpecializations, setAllSpecializations] = useState([]);
  const [updateOpen, setUpdateOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordModalError, setPasswordModalError] = useState(null);
  const [passwordModalSuccess, setPasswordModalSuccess] = useState(null);
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (isDoctor) {
          const { data } = await doctorProfileService.getMyProfile();
          const d = data.data ?? data;
          setProfile(d);
          setForm({
            fullName: d.fullName || "",
            phone: d.phone || "",
            gender: d.gender || "",
            dateOfBirth: d.dateOfBirth ? d.dateOfBirth.slice(0, 10) : "",
            address: d.address || "",
            experienceYears: d.experienceYears ?? 1,
            specializations: (d.specializations || []).map((item) =>
              typeof item === "object" ? item._id : item,
            ),
          });
          const nextAvatar = getUploadFullUrl(d.avatar || d.img);
          if (nextAvatar) setAvatarPreview(nextAvatar);
        } else {
          const { data } = await profileService.getMyProfile();
          const d = data.data;
          setProfile(d);
          setForm({
            fullName: d.fullName || "",
            phone: d.phone || "",
            gender: d.gender || "",
            dateOfBirth: d.dateOfBirth ? d.dateOfBirth.slice(0, 10) : "",
            address: d.address || "",
            experienceYears: "",
            specializations: [],
          });
          if (d.avatar) setAvatarPreview(d.avatar);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Không tải được thông tin");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isDoctor]);

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess(null);
    }, 1500);

    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (changePasswordOpen) {
      setPasswordModalError(null);
      setPasswordModalSuccess(null);
    }
  }, [changePasswordOpen]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordModalError(null);
    setPasswordModalSuccess(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordModalError("Mật khẩu xác nhận không khớp");
      return;
    }
    setSaving(true);
    try {
      // Giả sử bạn có authService.changePassword hoặc profileService.changePassword
      await profileService.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordModalSuccess("Đổi mật khẩu thành công!");
      setTimeout(() => {
        setChangePasswordOpen(false);
        setPasswordForm({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordModalError(null);
        setPasswordModalSuccess(null);
      }, 1500);
    } catch (err) {
      setPasswordModalError(
        err.response?.data?.message || "Đổi mật khẩu thất bại",
      );
    } finally {
      setSaving(false);
    }
  };

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

  const toggleSpecialization = (id) => {
    setForm((current) => {
      const selected = current.specializations || [];
      return {
        ...current,
        specializations: selected.includes(id)
          ? selected.filter((item) => item !== id)
          : [...selected, id],
      };
    });
  };

  const openDoctorUpdate = async () => {
    setError(null);
    setSuccess(null);
    try {
      const { data } = await specializationService.getAllSpecializations({
        limit: 100,
      });
      setAllSpecializations(data.data ?? []);
    } catch {
      setAllSpecializations([]);
    }
    setUpdateOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const dobError = validateDateOfBirth(form.dateOfBirth);
    if (dobError) {
      setSaving(false);
      setError(dobError);
      return;
    }

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
      setError(
        err.response?.data?.message || err.message || "Cập nhật thất bại",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDoctorUpdate = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const dobError = validateDateOfBirth(form.dateOfBirth);
    if (dobError) {
      setSaving(false);
      setError(dobError);
      return;
    }

    try {
      const payload = new FormData();
      payload.append("fullName", form.fullName || "");
      payload.append("phone", form.phone || "");
      payload.append("gender", form.gender || "");
      payload.append("dateOfBirth", form.dateOfBirth || "");
      payload.append("address", form.address || "");
      payload.append("experienceYears", String(form.experienceYears ?? ""));
      (form.specializations || []).forEach((id) => {
        payload.append("specializations", id);
      });
      if (avatarFile) {
        payload.append("file", avatarFile);
      }

      const { data } = await doctorProfileService.updateMyProfile(payload);
      const updatedDoctor = data.data ?? data;
      const nextAvatar = getUploadFullUrl(
        updatedDoctor.avatar || updatedDoctor.img,
      );

      setProfile(updatedDoctor);
      setAvatarFile(null);
      setAvatarPreview(nextAvatar || null);
      updateUser({
        fullName: updatedDoctor.fullName,
        ...(nextAvatar && { avatar: nextAvatar }),
      });
      setSuccess("Cập nhật hồ sơ bác sĩ thành công!");
      setUpdateOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Cập nhật thất bại");
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

  if (isDoctor) {
    const specsText = (profile?.specializations || [])
      .map((item) => (typeof item === "object" ? item.name : item))
      .join(", ");

    return (
      <div className="page profile-page-v2">
        <div className="pv2-title-row">
          <div>
            <h1 className="pv2-heading">Hồ sơ bác sĩ</h1>
            <p className="pv2-subheading">
              Quản lý thông tin cá nhân và hồ sơ chuyên môn của bạn
            </p>
          </div>
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <div className="pv2-layout">
          <aside className="pv2-sidebar">
            <div className="pv2-card pv2-avatar-card">
              <div className="pv2-avatar-wrap">
                <img
                  src={displayAvatar}
                  alt="Avatar"
                  className="pv2-avatar-img"
                  onError={(e) => {
                    e.currentTarget.src = `${DEFAULT_AVATAR}&name=${encodeURIComponent(
                      form.fullName || "Doctor",
                    )}`;
                  }}
                />
              </div>
              <div className="pv2-avatar-info">
                <p className="pv2-avatar-name">{profile?.fullName || "—"}</p>
                <span className={`badge badge-${user?.role?.toLowerCase()}`}>
                  {roleLabel}
                </span>
              </div>
              <div className="pv2-avatar-hint">
                <span className="pv2-avatar-hint-icon">🩺</span>
                <span>{specsText || "Chưa có chuyên khoa"}</span>
              </div>
              <div className="pv2-avatar-hint">
                <span className="pv2-avatar-hint-icon">⏳</span>
                <span>{profile?.experienceYears ?? 0} năm kinh nghiệm</span>
              </div>
            </div>

            <div className="pv2-card pv2-info-card">
              <h3 className="pv2-info-card-title">Thông tin nhanh</h3>
              <ul className="pv2-info-list">
                <li className="pv2-info-item">
                  <span className="pv2-info-icon">📞</span>
                  <div>
                    <p className="pv2-info-label">Số điện thoại</p>
                    <p className="pv2-info-value">{profile?.phone || "—"}</p>
                  </div>
                </li>
                <li className="pv2-info-item">
                  <span className="pv2-info-icon">⚧</span>
                  <div>
                    <p className="pv2-info-label">Giới tính</p>
                    <p className="pv2-info-value">
                      {profile?.gender === "MALE"
                        ? "Nam"
                        : profile?.gender === "FEMALE"
                          ? "Nữ"
                          : "—"}
                    </p>
                  </div>
                </li>
                <li className="pv2-info-item">
                  <span className="pv2-info-icon">🎂</span>
                  <div>
                    <p className="pv2-info-label">Ngày sinh</p>
                    <p className="pv2-info-value">
                      {profile?.dateOfBirth
                        ? new Date(profile.dateOfBirth).toLocaleDateString(
                            "vi-VN",
                          )
                        : "—"}
                    </p>
                  </div>
                </li>
                <li className="pv2-info-item">
                  <span className="pv2-info-icon">📍</span>
                  <div>
                    <p className="pv2-info-label">Địa chỉ</p>
                    <p className="pv2-info-value">{profile?.address || "—"}</p>
                  </div>
                </li>
              </ul>
            </div>
          </aside>

          <main className="pv2-main">
            <div className="pv2-card">
              <div className="pv2-form-header">
                <h2 className="pv2-form-title">Thông tin hồ sơ</h2>
                <p className="pv2-form-desc">
                  Hồ sơ chuyên môn, bằng cấp và chứng chỉ của bạn đã được gộp
                  vào cùng một màn hình.
                </p>
              </div>

              <div className="mb-4">
                <InfoRow label="Họ và tên" value={profile?.fullName} />
                <InfoRow label="Số điện thoại" value={profile?.phone} />
                <InfoRow
                  label="Giới tính"
                  value={
                    profile?.gender === "MALE"
                      ? "Nam"
                      : profile?.gender === "FEMALE"
                        ? "Nữ"
                        : "—"
                  }
                />
                <InfoRow
                  label="Ngày sinh"
                  value={
                    profile?.dateOfBirth
                      ? new Date(profile.dateOfBirth).toLocaleDateString(
                          "vi-VN",
                        )
                      : "—"
                  }
                />
                <InfoRow label="Địa chỉ" value={profile?.address} />
                <InfoRow
                  label="Kinh nghiệm"
                  value={
                    profile?.experienceYears != null
                      ? `${profile.experienceYears} năm`
                      : "—"
                  }
                />
                <InfoRow label="Chuyên khoa" value={specsText || "—"} />
              </div>

              {profile?.degrees?.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Bằng cấp đã duyệt
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.degrees.map((degree) => (
                      <span
                        key={degree._id}
                        className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {degree.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile?.certificates?.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Chứng chỉ đã duyệt
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.certificates.map((certificate) => (
                      <span
                        key={certificate._id}
                        className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {certificate.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  className="btn-primary"
                  onClick={openDoctorUpdate}
                >
                  ✏️ Cập nhật thông tin
                </Button>
                <button
                  type="button"
                  className="btn btn-secondary px-5 py-2"
                  onClick={() => navigate("/doctor/certificates")}
                >
                  📜 Quản lý chứng chỉ
                </button>
                <button
                  type="button"
                  className="btn btn-secondary px-5 py-2"
                  onClick={() => navigate("/doctor/degrees")}
                >
                  🎓 Quản lý bằng cấp
                </button>
              </div>
            </div>
          </main>
        </div>

        <Modal
          open={updateOpen}
          onClose={() => setUpdateOpen(false)}
          title="Cập nhật hồ sơ bác sĩ"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                <img
                  src={displayAvatar}
                  alt="avatar preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <label className="cursor-pointer text-sm text-blue-600 hover:underline">
                Thay đổi ảnh đại diện
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Họ và tên *
              </label>
              <input
                className="form-input w-full border rounded px-3 py-2 text-sm"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Số điện thoại *
              </label>
              <input
                className="form-input w-full border rounded px-3 py-2 text-sm"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Giới tính
              </label>
              <select
                className="form-input w-full border rounded px-3 py-2 text-sm"
                name="gender"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">-- chọn --</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Ngày sinh
              </label>
              <input
                type="date"
                className="form-input w-full border rounded px-3 py-2 text-sm"
                name="dateOfBirth"
                value={form.dateOfBirth}
                max={getAdultMaxDate()}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Địa chỉ
              </label>
              <input
                className="form-input w-full border rounded px-3 py-2 text-sm"
                name="address"
                value={form.address}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Số năm kinh nghiệm
              </label>
              <input
                type="number"
                min="0"
                className="form-input w-full border rounded px-3 py-2 text-sm"
                name="experienceYears"
                value={form.experienceYears}
                onChange={handleChange}
              />
            </div>
            {allSpecializations.length > 0 && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Chuyên khoa
                </label>
                <div className="flex flex-wrap gap-2 border rounded p-2 max-h-36 overflow-y-auto">
                  {allSpecializations.map((item) => {
                    const selected = (form.specializations || []).includes(
                      item._id,
                    );
                    return (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => toggleSpecialization(item._id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          selected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                        }`}
                      >
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn btn-secondary px-4 py-2 text-sm"
                onClick={() => setUpdateOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary px-4 py-2 text-sm"
                onClick={handleDoctorUpdate}
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

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
          {/* Avatar Card — chỉ hiển thị dữ liệu đã lưu, đổi khi bấm Lưu */}
          <div className="pv2-card pv2-avatar-card">
            <div className="pv2-avatar-wrap">
              <img
                src={displayAvatar}
                alt="Avatar"
                className="pv2-avatar-img"
                onError={(e) => {
                  e.currentTarget.src = `${DEFAULT_AVATAR}&name=${encodeURIComponent(
                    profile?.fullName || "User",
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
              <p className="pv2-avatar-name">{profile?.fullName || "—"}</p>
              <span className={`badge badge-${user?.role?.toLowerCase()}`}>
                {roleLabel}
              </span>
            </div>
            {avatarFile && (
              <div className="pv2-avatar-hint">
                <span className="pv2-avatar-hint-icon">📎</span>
                <span>{avatarFile.name} — bấm Lưu để cập nhật</span>
              </div>
            )}
          </div>

          {/* Account Info Card */}
          {profile?.account && (
            <div className="pv2-card pv2-info-card">
              <h3 className="pv2-info-card-title">Thông tin tài khoản</h3>

              {/* Avatar và tên đã lưu — chỉ đổi khi bấm Lưu */}
              <div className="pv2-account-avatar-wrap">
                <img
                  src={displayAvatar}
                  alt="Ảnh đại diện"
                  className="pv2-account-avatar"
                  onError={(e) => {
                    e.currentTarget.src = `${DEFAULT_AVATAR}&name=${encodeURIComponent(
                      profile?.fullName || "User",
                    )}`;
                  }}
                />
                <div className="pv2-account-avatar-meta">
                  <p className="pv2-account-avatar-name">
                    {profile?.fullName || "—"}
                  </p>
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
                        {new Date(profile.account.createdAt).toLocaleDateString(
                          "vi-VN",
                        )}
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
                    max={getAdultMaxDate()}
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

              <div className="pv2-form-footer flex items-center justify-between">
                {user?.role === "CUSTOMER" ? (
                  <button
                    type="button"
                    className="text-blue-600 hover:underline text-sm font-medium"
                    onClick={() => setChangePasswordOpen(true)}
                  >
                    🔒 Đổi mật khẩu?
                  </button>
                ) : (
                  <span />
                )}

                <Button
                  type="submit"
                  className="btn-primary pv2-save-btn"
                  disabled={saving}
                >
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
      {user?.role === "CUSTOMER" && (
        <Modal
          open={changePasswordOpen}
          onClose={() => setChangePasswordOpen(false)}
          title="Đổi mật khẩu tài khoản"
        >
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordModalError && (
              <div className="bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-red-700">
                {passwordModalError}
              </div>
            )}
            {passwordModalSuccess && (
              <div className="bg-green-50 border border-green-200 rounded px-3 py-2 text-sm text-green-700">
                {passwordModalSuccess}
              </div>
            )}
            <div className="form-group">
              <label className="block text-sm text-gray-600 mb-1">
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                className="form-input w-full border rounded px-3 py-2 text-sm"
                required
                value={passwordForm.oldPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    oldPassword: e.target.value,
                  })
                }
              />
            </div>
            <div className="form-group">
              <label className="block text-sm text-gray-600 mb-1">
                Mật khẩu mới
              </label>
              <input
                type="password"
                className="form-input w-full border rounded px-3 py-2 text-sm"
                required
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
              />
            </div>
            <div className="form-group">
              <label className="block text-sm text-gray-600 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                className="form-input w-full border rounded px-3 py-2 text-sm"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                onClick={() => setChangePasswordOpen(false)}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                disabled={saving}
              >
                {saving ? "Đang xử lý..." : "Cập nhật mật khẩu"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
