import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { ROLE_NAME } from "../constants/role";

function getLandingPathByRole(role) {
  switch (role) {
    case ROLE_NAME.SALE_STAFF:
      return "/staff/dashboard";
    case ROLE_NAME.ADMIN:
      return "/admin/statistics";
    case ROLE_NAME.DOCTOR:
      return "/appointments";
    default:
      return "/";
  }
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { login, googleLogin, loading, error } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (value) => /^\S+@\S+\.\S+$/.test(value);

  const getInputStateClass = (value, fieldName) => {
    if (fieldErrors[fieldName]) return "is-error";
    if (!value) return "";

    if (fieldName === "email") {
      return validateEmail(value) ? "is-valid" : "is-error";
    }
    if (fieldName === "password") {
      return value.length >= 6 ? "is-valid" : "is-error";
    }
    return "";
  };
  const emailStateClass = getInputStateClass(email, "email");
  const passwordStateClass = getInputStateClass(password, "password");

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    setFieldErrors((prev) => {
      const next = { ...prev };
      if (!value || validateEmail(value)) {
        delete next.email;
      } else if (prev.email) {
        next.email = "Email không hợp lệ";
      }
      if (next.form) delete next.form;
      return next;
    });
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    setFieldErrors((prev) => {
      const next = { ...prev };
      if (!value || value.length >= 6) {
        delete next.password;
      } else if (prev.password) {
        next.password = "Mật khẩu tối thiểu 6 ký tự";
      }
      if (next.form) delete next.form;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!email || !validateEmail(email)) {
      errors.email = "Email không hợp lệ";
    }
    if (!password || password.length < 6) {
      errors.password = "Mật khẩu tối thiểu 6 ký tự";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setFieldErrors({});
      const user = await login(email, password, rememberMe);
      navigate(getLandingPathByRole(user?.role));
    } catch (err) {
      const message =
        err.response?.data?.message || error || "Đăng nhập thất bại";
      const lowered = message.toLowerCase();
      const next = {};

      if (lowered.includes("email")) {
        next.email = message;
      } else if (lowered.includes("password") || lowered.includes("mật khẩu")) {
        next.password = message;
      } else {
        // Most auth failures are credential-related, show near password field.
        next.password = message;
      }

      setFieldErrors((prev) => ({ ...prev, ...next }));
      console.error("Login error:", err);
    }
  };

  return (
    <div className="page login-page ecs-reg-page ecs-login-page">
      <section className="ecs-reg-shell" aria-labelledby="login-title">
        <div className="ecs-reg-visual ecs-login-visual" aria-hidden="true">
          <div className="ecs-reg-visual-badge">👁 ECS - Eye Care System</div>
          <h2 className="ecs-reg-visual-title">Đăng nhập hệ thống EyesCare</h2>
          <p className="ecs-reg-visual-subtitle">
            Đăng nhập để tiếp tục đặt lịch khám mắt
          </p>
          <div className="ecs-reg-visual-card">
            <p className="ecs-reg-visual-card-title">Quyền lợi khi đăng nhập</p>
            <ul className="ecs-reg-visual-list">
              <li>Quản lý lịch hẹn nhanh chóng và chính xác</li>
              <li>Theo dõi hồ sơ khám mắt mọi lúc mọi nơi</li>
              <li>Nhận hỗ trợ trực tuyến từ đội ngũ chuyên môn</li>
            </ul>
          </div>
        </div>

        <div className="ecs-reg-card ecs-login-card">
          <h1 id="login-title" className="ecs-reg-title">
            Chào mừng bạn quay lại 👁️
          </h1>
          <p className="ecs-reg-subtitle">
            Đăng nhập để tiếp tục trải nghiệm dịch vụ.
          </p>

          <form className="ecs-reg-form" onSubmit={handleSubmit} noValidate>
            <div className="ecs-reg-field">
              <label className="ecs-reg-label" htmlFor="login-email">
                Email
              </label>
              <div className="ecs-reg-input-wrap">
                <span className="ecs-reg-icon" aria-hidden="true">
                  ✉
                </span>
                <input
                  id="login-email"
                  className={`ecs-reg-input ${emailStateClass}`}
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? "login-email-error" : undefined
                  }
                  required
                />
              </div>
              {fieldErrors.email && (
                <span className="ecs-reg-error" id="login-email-error">
                  {fieldErrors.email}
                </span>
              )}
            </div>

            <div className="ecs-reg-field">
              <label className="ecs-reg-label" htmlFor="login-password">
                Password
              </label>
              <div className="ecs-reg-input-wrap ecs-reg-input-wrap-password">
                <span className="ecs-reg-icon" aria-hidden="true">
                  🔒
                </span>
                <input
                  id="login-password"
                  className={`ecs-reg-input ${passwordStateClass}`}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password ? "login-password-error" : undefined
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
                <span className="ecs-reg-error" id="login-password-error">
                  {fieldErrors.password}
                </span>
              )}
            </div>

            <div className="ecs-login-row">
              <label className="ecs-login-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <span className="ecs-login-note">Bảo mật theo phiên</span>
            </div>

            <button type="submit" className="ecs-reg-submit" disabled={loading}>
              {loading ? (
                <span className="ecs-reg-submit-loading">
                  <span className="ecs-reg-spinner" aria-hidden="true" />
                  <span>Logging in...</span>
                </span>
              ) : (
                "Login"
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
                  const user = await googleLogin(
                    credentialResponse.credential,
                    rememberMe,
                  );
                  navigate(getLandingPathByRole(user?.role));
                } catch (err) {
                  console.error("Google login error:", err);
                }
              }}
              onError={() => console.error("Google Login Failed")}
              text="signin_with"
              width="100%"
            />
          </div>

          <p className="ecs-reg-footer">
            Don&apos;t have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
