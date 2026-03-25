import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { Alert } from "./UI";

function validateAddress(value) {
  if (!value?.trim()) return null;
  const cleaned = value.trim();
  if (cleaned.length < 8) return "Địa chỉ quá ngắn (ít nhất 8 ký tự)";
  if (!/[A-Za-zÀ-ỹ]/.test(cleaned)) return "Địa chỉ không hợp lệ";
  return null;
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

export function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { register, googleLogin, loading } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (v) => /^\S+@\S+\.\S+$/.test(v);

  const getPasswordStrength = (value) => {
    if (!value) return { label: "", level: 0 };
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    if (score <= 1) return { label: "Yếu", level: 1 };
    if (score <= 3) return { label: "Trung bình", level: 2 };
    return { label: "Mạnh", level: 3 };
  };

  const getInputStateClass = (value, error) => {
    if (error) return "is-error";
    if (value && String(value).trim()) return "is-valid";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError("");
    setSuccessMessage("");

    const errors = {};
    if (!email || !validateEmail(email)) errors.email = "Invalid email";
    if (!password || password.length < 6)
      errors.password = "Password must be at least 6 characters";
    if (!fullName || fullName.trim().length < 2)
      errors.fullName = "Invalid full name";
    if (!phone || phone.trim().length < 8) errors.phone = "Invalid phone";
    if (gender && !["MALE", "FEMALE"].includes(gender))
      errors.gender = "Gender must be MALE or FEMALE";
    const dobError = validateDateOfBirth(dateOfBirth);
    if (dobError) errors.dateOfBirth = dobError;
    const addressError = validateAddress(address);
    if (addressError) errors.address = addressError;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      const payload = {
        email,
        password,
        fullName,
        phone,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined,
        address: address || undefined,
      };
      const data = await register(payload);
      if (data?.otp) {
        setSuccessMessage(`Registration successful. OTP (dev): ${data.otp}`);
      }
      // Redirect to verify page to enter OTP
      navigate(`/verify?email=${encodeURIComponent(email)}`);
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.errors) {
        setFieldErrors(resp.errors || {});
      }
      setGeneralError(resp?.message || "Registration failed");
    }
  };

  const passwordStrength = getPasswordStrength(password);
  const addressError = validateAddress(address);
  const showAddressMap = Boolean(address?.trim()) && !addressError;
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(address.trim())}&output=embed`;
  const addressFieldError = fieldErrors.address || addressError;
  let addressDescribedBy;
  if (addressFieldError) {
    addressDescribedBy = "register-address-error";
  } else if (showAddressMap) {
    addressDescribedBy = "register-address-map-hint";
  }

  const handleAddressChange = (e) => {
    const nextValue = e.target.value;
    setAddress(nextValue);
    setFieldErrors((prev) => {
      if (!prev.address) return prev;
      const next = { ...prev };
      delete next.address;
      return next;
    });
  };

  const handleAddressBlur = () => {
    const err = validateAddress(address);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) next.address = err;
      else delete next.address;
      return next;
    });
  };

  return (
    <div className="page register-page ecs-reg-page">
      <section className="ecs-reg-shell" aria-labelledby="register-title">
        <div className="ecs-reg-visual" aria-hidden="true">
          <div className="ecs-reg-visual-badge">👁 ECS - Eye Care System</div>
          <h2 className="ecs-reg-visual-title">
            Đăng ký tài khoản chăm sóc mắt
          </h2>
          <p className="ecs-reg-visual-subtitle">
            Chăm sóc thị lực của bạn mỗi ngày
          </p>
          <div className="ecs-reg-visual-card">
            <p className="ecs-reg-visual-card-title">
              Tại sao nên tạo tài khoản?
            </p>
            <ul className="ecs-reg-visual-list">
              <li>Đặt lịch khám nhanh chỉ trong vài bước</li>
              <li>Lưu lịch sử khám và nhận nhắc lịch tự động</li>
              <li>Trao đổi trực tiếp với chuyên gia nhãn khoa</li>
            </ul>
          </div>
        </div>

        <div className="ecs-reg-card">
          <h1 id="register-title" className="ecs-reg-title">
            Tạo tài khoản
          </h1>
          <p className="ecs-reg-subtitle">
            Bắt đầu hành trình theo dõi sức khỏe thị lực cùng EyesCare.
          </p>

          {generalError && <Alert type="error">{generalError}</Alert>}
          {successMessage && <Alert type="success">{successMessage}</Alert>}

          <form className="ecs-reg-form" onSubmit={handleSubmit} noValidate>
            <div className="ecs-reg-field">
              <label className="ecs-reg-label" htmlFor="register-email">
                Email
              </label>
              <div className="ecs-reg-input-wrap">
                <span className="ecs-reg-icon" aria-hidden="true">
                  ✉
                </span>
                <input
                  id="register-email"
                  className={`ecs-reg-input ${getInputStateClass(email, fieldErrors.email)}`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? "register-email-error" : undefined
                  }
                  required
                />
              </div>
              {fieldErrors.email && (
                <span className="ecs-reg-error" id="register-email-error">
                  {fieldErrors.email}
                </span>
              )}
            </div>

            <div className="ecs-reg-field">
              <label className="ecs-reg-label" htmlFor="register-password">
                Password
              </label>
              <div className="ecs-reg-input-wrap ecs-reg-input-wrap-password">
                <span className="ecs-reg-icon" aria-hidden="true">
                  🔒
                </span>
                <input
                  id="register-password"
                  className={`ecs-reg-input ${getInputStateClass(password, fieldErrors.password)}`}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password ? "register-password-error" : undefined
                  }
                  required
                />
                <button
                  type="button"
                  className="ecs-reg-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
              {fieldErrors.password && (
                <span className="ecs-reg-error" id="register-password-error">
                  {fieldErrors.password}
                </span>
              )}
              {password && (
                <div className="ecs-reg-strength" aria-live="polite">
                  <div className="ecs-reg-strength-bars">
                    <span
                      className={passwordStrength.level >= 1 ? "active" : ""}
                    />
                    <span
                      className={passwordStrength.level >= 2 ? "active" : ""}
                    />
                    <span
                      className={passwordStrength.level >= 3 ? "active" : ""}
                    />
                  </div>
                  <span className="ecs-reg-strength-label">
                    Độ mạnh: {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            <div className="ecs-reg-field">
              <label className="ecs-reg-label" htmlFor="register-fullName">
                Full Name
              </label>
              <div className="ecs-reg-input-wrap">
                <span className="ecs-reg-icon" aria-hidden="true">
                  👤
                </span>
                <input
                  id="register-fullName"
                  className={`ecs-reg-input ${getInputStateClass(fullName, fieldErrors.fullName)}`}
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  aria-describedby={
                    fieldErrors.fullName ? "register-fullName-error" : undefined
                  }
                  required
                />
              </div>
              {fieldErrors.fullName && (
                <span className="ecs-reg-error" id="register-fullName-error">
                  {fieldErrors.fullName}
                </span>
              )}
            </div>

            <div className="ecs-reg-grid-2">
              <div className="ecs-reg-field">
                <label className="ecs-reg-label" htmlFor="register-phone">
                  Phone Number
                </label>
                <div className="ecs-reg-input-wrap">
                  <span className="ecs-reg-icon" aria-hidden="true">
                    ☎
                  </span>
                  <input
                    id="register-phone"
                    className={`ecs-reg-input ${getInputStateClass(phone, fieldErrors.phone)}`}
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={
                      fieldErrors.phone ? "register-phone-error" : undefined
                    }
                    required
                  />
                </div>
                {fieldErrors.phone && (
                  <span className="ecs-reg-error" id="register-phone-error">
                    {fieldErrors.phone}
                  </span>
                )}
              </div>

              <div className="ecs-reg-field">
                <label className="ecs-reg-label" htmlFor="register-gender">
                  Gender
                </label>
                <div className="ecs-reg-input-wrap">
                  <span className="ecs-reg-icon" aria-hidden="true">
                    ⚧
                  </span>
                  <select
                    id="register-gender"
                    className={`ecs-reg-input ${getInputStateClass(gender, fieldErrors.gender)}`}
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    aria-invalid={Boolean(fieldErrors.gender)}
                    aria-describedby={
                      fieldErrors.gender ? "register-gender-error" : undefined
                    }
                  >
                    <option value="">-- Select --</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                {fieldErrors.gender && (
                  <span className="ecs-reg-error" id="register-gender-error">
                    {fieldErrors.gender}
                  </span>
                )}
              </div>
            </div>

            <div className="ecs-reg-field">
              <label className="ecs-reg-label" htmlFor="register-dateOfBirth">
                Date of Birth
              </label>
              <div className="ecs-reg-input-wrap">
                <span className="ecs-reg-icon" aria-hidden="true">
                  📅
                </span>
                <input
                  id="register-dateOfBirth"
                  className={`ecs-reg-input ${getInputStateClass(dateOfBirth, fieldErrors.dateOfBirth)}`}
                  type="date"
                  value={dateOfBirth}
                  max={getAdultMaxDate()}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.dateOfBirth)}
                  aria-describedby={
                    fieldErrors.dateOfBirth ? "register-date-error" : undefined
                  }
                />
              </div>
              {fieldErrors.dateOfBirth && (
                <span className="ecs-reg-error" id="register-date-error">
                  {fieldErrors.dateOfBirth}
                </span>
              )}
            </div>

            <div className="ecs-reg-field">
              <label className="ecs-reg-label" htmlFor="register-address">
                Address
              </label>
              <div className="ecs-reg-input-wrap ecs-reg-textarea-wrap">
                <span className="ecs-reg-icon" aria-hidden="true">
                  📍
                </span>
                <textarea
                  id="register-address"
                  className={`ecs-reg-input ecs-reg-textarea ${getInputStateClass(address, addressFieldError)}`}
                  value={address}
                  onChange={handleAddressChange}
                  onBlur={handleAddressBlur}
                  aria-invalid={Boolean(addressFieldError)}
                  aria-describedby={addressDescribedBy}
                  rows={3}
                />
              </div>
              {addressFieldError && (
                <span className="ecs-reg-error" id="register-address-error">
                  {addressFieldError}
                </span>
              )}
              {showAddressMap && (
                <div className="ecs-reg-map-wrap">
                  <p
                    className="ecs-reg-map-hint"
                    id="register-address-map-hint"
                  >
                    Vị trí xem trước theo địa chỉ bạn nhập
                  </p>
                  <iframe
                    className="ecs-reg-map"
                    src={mapEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Address map preview"
                  />
                </div>
              )}
            </div>

            <button type="submit" className="ecs-reg-submit" disabled={loading}>
              {loading ? (
                <span className="ecs-reg-submit-loading">
                  <span className="ecs-reg-spinner" aria-hidden="true" />
                  <span>Registering...</span>
                </span>
              ) : (
                "Register"
              )}
            </button>
          </form>

          <div className="ecs-reg-divider" role="separator" aria-label="Hoặc">
            <span>or</span>
          </div>

          <div className="ecs-reg-google-wrap">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  await googleLogin(credentialResponse.credential);
                  navigate("/");
                } catch (err) {
                  setGeneralError(
                    err.response?.data?.message || "Google registration failed",
                  );
                }
              }}
              onError={() => setGeneralError("Google sign-up failed")}
              text="signup_with"
              width="100%"
            />
          </div>

          <p className="ecs-reg-footer">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
