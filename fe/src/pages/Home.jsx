import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  blogService,
  doctorService,
  getUploadFullUrl,
  serviceService,
} from "../services";
import { Alert, Loading } from "../components/UI";

export function Home() {
  const [services, setServices] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const toList = (response) => response?.data?.data || response?.data || [];

    const fetchHomeData = async () => {
      setLoading(true);
      setError(null);

      const [servicesRes, blogsRes, doctorsRes] = await Promise.allSettled([
        serviceService.getList({ page: 1, limit: 4 }),
        blogService.getList({ page: 1, limit: 3 }),
        doctorService.getAllDoctor({ page: 1, limit: 3 }),
      ]);

      if (!mounted) return;

      const nextServices =
        servicesRes.status === "fulfilled" ? toList(servicesRes.value) : [];
      const nextBlogs =
        blogsRes.status === "fulfilled" ? toList(blogsRes.value) : [];
      const nextDoctors =
        doctorsRes.status === "fulfilled" ? toList(doctorsRes.value) : [];

      setServices(Array.isArray(nextServices) ? nextServices.slice(0, 4) : []);
      setBlogs(Array.isArray(nextBlogs) ? nextBlogs.slice(0, 3) : []);
      setDoctors(Array.isArray(nextDoctors) ? nextDoctors.slice(0, 3) : []);

      if (
        servicesRes.status === "rejected" &&
        blogsRes.status === "rejected" &&
        doctorsRes.status === "rejected"
      ) {
        setError("Không tải được dữ liệu trang chủ. Vui lòng thử lại sau.");
      }

      setLoading(false);
    };

    fetchHomeData();

    return () => {
      mounted = false;
    };
  }, []);

  const heroStats = useMemo(
    () => [
      {
        value: `${doctors.length > 0 ? doctors.length : 80}+`,
        label: "Bác sĩ chuyên khoa",
      },
      {
        value: `${services.length > 0 ? services.length : 12}+`,
        label: "Gói dịch vụ",
      },
      {
        value: `${blogs.length > 0 ? blogs.length : 98}%`,
        label: "Nội dung chuyên sâu",
      },
      {
        value: "15",
        label: "Năm kinh nghiệm",
      },
    ],
    [blogs.length, doctors.length, services.length],
  );

  const formatCurrency = (amount) => {
    if (amount == null || Number.isNaN(Number(amount))) return "Liên hệ";
    return `${Number(amount).toLocaleString("vi-VN")} VND`;
  };

  const formatDate = (value) => {
    if (!value) return "Mới cập nhật";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Mới cập nhật";
    return date.toLocaleDateString("vi-VN");
  };

  const stripHtml = (text) => {
    if (!text || typeof text !== "string") return "";
    return text
      .replaceAll(/<[^>]*>/g, " ")
      .replaceAll(/\s+/g, " ")
      .trim();
  };

  const getServiceIcon = (index) => {
    const icons = ["👁️", "🔬", "⚡", "🩺"];
    return icons[index % icons.length];
  };

  const getGenderLabel = (gender) => {
    if (gender === "FEMALE") return "Nữ";
    if (gender === "MALE") return "Nam";
    return "Khác";
  };

  if (
    loading &&
    services.length === 0 &&
    blogs.length === 0 &&
    doctors.length === 0
  ) {
    return <Loading />;
  }

  return (
    <div className="page vc-home">
      <section className="vc-hero">
        <div className="vc-hero-left">
          <div className="vc-badge">
            <span className="vc-badge-dot" />
            <span>Trung tâm đặt lịch</span>
          </div>
          <h1 className="vc-hero-title">
            <span>Chăm sóc</span>
            <em>đôi mắt</em>
            <strong>với tâm huyết</strong>
          </h1>
          <p className="vc-hero-desc">
            VisionCare kết hợp đội ngũ bác sĩ nhãn khoa và hệ thống quản lý lịch
            khám hiện đại, giúp bạn đặt lịch nhanh và theo dõi hồ sơ mắt dễ
            dàng.
          </p>
          <div className="vc-hero-buttons">
            <Link className="vc-btn vc-btn-primary" to="/appointments">
              Đặt lịch khám ngay
            </Link>
            <Link className="vc-btn vc-btn-outline" to="/services">
              Xem dịch vụ
            </Link>
          </div>
          <div className="vc-hero-stats">
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <p className="vc-stat-value">{stat.value}</p>
                <p className="vc-stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="vc-hero-right">
          <div className="vc-eye-shell">
            <div className="vc-eye-ring" />
            <div className="vc-eye-ring" />
            <div className="vc-eye-ring" />
            <svg
              className="vc-eye-svg"
              viewBox="0 0 300 200"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="vcIris" cx="50%" cy="45%" r="50%">
                  <stop offset="0%" stopColor="#5BA3D4" />
                  <stop offset="40%" stopColor="#2D6FA3" />
                  <stop offset="100%" stopColor="#112240" />
                </radialGradient>
              </defs>
              <path
                d="M 20 100 Q 150 10 280 100 Q 150 190 20 100 Z"
                fill="#E8F2FA"
                stroke="#A8C8E8"
                strokeWidth="1.5"
              />
              <circle cx="150" cy="100" r="58" fill="url(#vcIris)" />
              <circle cx="150" cy="100" r="28" fill="#0B1829" />
              <ellipse
                cx="162"
                cy="88"
                rx="9"
                ry="6"
                fill="rgba(255,255,255,0.55)"
                transform="rotate(-20 162 88)"
              />
            </svg>
            <div className="vc-floating vc-floating-top">
              <span className="vc-floating-label">Thi lực hôm nay</span>
              <strong>20/20</strong>
            </div>
            <div className="vc-floating vc-floating-bottom">
              <span className="vc-floating-label">Đánh giá</span>
              <strong>4.9/5</strong>
            </div>
          </div>
        </div>
      </section>

      {error && <Alert type="error">{error}</Alert>}

      <section className="vc-section vc-services" id="services">
        <div className="vc-section-head">
          <div>
            <p className="vc-kicker">Dịch vụ chuyên khoa</p>
            <h2 className="vc-title">
              <span>Khám và điều trị</span>
              <em>toàn diện</em>
            </h2>
          </div>
          {/* <p className="vc-subtitle">
            Dữ liệu được lấy trực tiếp từ danh sách dịch vụ hiện tại của hệ
            thống.
          </p> */}
        </div>

        <div className="vc-service-grid">
          {services.length > 0 ? (
            services.map((service, index) => (
              <Link
                key={service._id || service.name || index}
                className="vc-service-card"
                to={service._id ? `/services/${service._id}` : "/services"}
              >
                {service.image ? (
                  <div className="vc-service-media">
                    <img
                      src={getUploadFullUrl(service.image)}
                      alt={service.name || "Dịch vụ"}
                    />
                  </div>
                ) : (
                  <div className="vc-service-icon" aria-hidden="true">
                    {getServiceIcon(index)}
                  </div>
                )}
                <h3>{service.name || "Dịch vụ"}</h3>
                <p className="vc-service-price">
                  {formatCurrency(service.price)}
                </p>
                <p className="vc-service-desc">
                  {stripHtml(service.description).slice(0, 120) ||
                    "Thông tin đang được cập nhật."}
                </p>
              </Link>
            ))
          ) : (
            <p className="vc-empty">Chưa có gói dịch vụ nào.</p>
          )}
        </div>
      </section>

      <section className="vc-section vc-how">
        <div className="vc-how-head">
          <p className="vc-kicker">Quy trình đặt lịch</p>
          <h2 className="vc-title vc-title-center">
            <span>Bốn bước</span>
            <em>đơn giản</em>
          </h2>
        </div>

        <div className="vc-step-grid">
          {[
            [
              "01",
              "Đặt lịch & chọn gói",
              "Chọn gói khám Basic hoặc Advanced và thời gian phù hợp.",
            ],
            [
              "02",
              "Thanh toán",
              "Basic: thanh toán và chờ hệ thống sắp xếp lịch. Advanced: chọn lịch và xác nhận ngay.",
            ],
            [
              "03",
              "Thăm khám",
              "Bác sĩ kiểm tra, tư vấn và ghi nhận triệu chứng, chẩn đoán.",
            ],
            [
              "04",
              "Kết quả & đánh giá",
              "Xem kết quả khám, hướng dẫn điều trị và đánh giá dịch vụ.",
            ],
          ].map(([num, title, desc]) => (
            <article key={num} className="vc-step-card">
              <div className="vc-step-num">{num}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="vc-section vc-doctors" id="doctors">
        <div className="vc-section-head">
          <div>
            <p className="vc-kicker">Đội ngũ chuyên khoa</p>
            <h2 className="vc-title">
              <span>Bác sĩ</span>
              <em>nhi khoa</em>
            </h2>
          </div>
          <Link className="vc-btn vc-btn-outline" to="/doctors">
            Xem tất cả bác sĩ
          </Link>
        </div>

        <div className="vc-doctor-grid">
          {doctors.length > 0 ? (
            doctors.map((doctor, index) => {
              const specializations =
                doctor?.specializations
                  ?.map((item) => item?.name)
                  .filter(Boolean) || [];
              return (
                <Link
                  key={doctor._id || doctor.fullName || index}
                  className="vc-doctor-card"
                  to={doctor._id ? `/doctors/${doctor._id}` : "/doctors"}
                >
                  <div className="vc-doctor-cover">
                    <img
                      src={
                        doctor.avatar ||
                        "https://www.shutterstock.com/image-photo/healthcare-medical-staff-concept-portrait-600nw-2281024823.jpg"
                      }
                      alt={doctor.fullName || "Bác sĩ"}
                    />
                    <span>{specializations[0] || "Nhãn khoa tổng quát"}</span>
                  </div>
                  <div className="vc-doctor-body">
                    <h3>{doctor.fullName || "Đang cập nhật"}</h3>
                    <p>
                      {specializations.join(", ") ||
                        "Thông tin chuyên khoa đang cập nhật"}
                    </p>
                    <div className="vc-doctor-stats">
                      <div>
                        <strong>{doctor.experienceYears || 0}</strong>
                        <small>Năm KN</small>
                      </div>
                      <div>
                        <strong>{getGenderLabel(doctor.gender)}</strong>
                        <small>Giới tính</small>
                      </div>
                      <div>
                        <strong>4.9</strong>
                        <small>Đánh giá</small>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <p className="vc-empty">Chưa công khai bác sĩ.</p>
          )}
        </div>
      </section>

      <section className="vc-section vc-tech">
        <div className="vc-tech-grid">
          <div>
            <p className="vc-kicker">Công nghệ tiên tiến</p>
            <h2 className="vc-title">
              <span>Thiết bị</span>
              <em>thế hệ mới</em>
            </h2>
            <p className="vc-subtitle">
              Nền tảng hướng tới triển khai quy trình khám tối ưu với dữ liệu số
              hóa và hỗ trợ ra quyết định nhanh hơn.
            </p>

            <div className="vc-tech-items">
              <div>
                <strong>OCT Zeiss</strong>
                <p>Chẩn đoán hình ảnh độ phân giải cao.</p>
              </div>
              <div>
                <strong>SMILE Pro</strong>
                <p>Hỗ trợ phẫu thuật laser ít xâm lấn.</p>
              </div>
              <div>
                <strong>AI Screening</strong>
                <p>Cảnh báo nguy cơ bệnh lý sớm.</p>
              </div>
              <div>
                <strong>Hồ sơ điện tử</strong>
                <p>Theo dõi kết quả và lịch sử điều trị.</p>
              </div>
            </div>
          </div>

          <div className="vc-tech-orbit" aria-hidden="true">
            <span />
            <span />
            <span />
            <div>👁️</div>
          </div>
        </div>
      </section>

      <section className="vc-section vc-articles" id="articles">
        <div className="vc-section-head">
          <div>
            <p className="vc-kicker">Kiến thức nhãn khoa</p>
            <h2 className="vc-title">
              <span>Bài viết</span>
              <em>chuyên sâu</em>
            </h2>
          </div>
          <Link className="vc-btn vc-btn-outline" to="/blogs">
            Xem tất cả
          </Link>
        </div>

        <div className="vc-article-grid">
          {blogs.length > 0 ? (
            blogs.map((blog, index) => (
              <Link
                key={blog._id || blog.title || index}
                className={`vc-article-card ${index === 0 ? "is-featured" : ""}`}
                to={blog._id ? `/blogs/${blog._id}` : "/blogs"}
              >
                <div className="vc-article-media">
                  {blog.image ? (
                    <img
                      src={getUploadFullUrl(blog.image)}
                      alt={blog.title || "Bài viết"}
                    />
                  ) : (
                    <span aria-hidden="true">💡</span>
                  )}
                </div>
                <div className="vc-article-body">
                  <h3>{blog.title || "Bài viết"}</h3>
                  <p>
                    {stripHtml(blog.content).slice(
                      0,
                      index === 0 ? 160 : 110,
                    ) || "Nội dung đang cập nhật."}
                  </p>
                  <small>{formatDate(blog.createdAt)}</small>
                </div>
              </Link>
            ))
          ) : (
            <p className="vc-empty">Chưa có bài viết nổi bật.</p>
          )}
        </div>
      </section>

      <section className="vc-section vc-guest" id="login">
        <div className="vc-guest-grid">
          <div>
            <p className="vc-kicker">Dành cho khách</p>
            <h2 className="vc-title">
              <span>Đăng nhập</span>
              <em>ngay hôm nay</em>
            </h2>
            <p className="vc-subtitle">
              Quản lý lịch khám, xem kết quả và nhận thông báo sự kiện quan
              trọng trên một giao diện thống nhất.
            </p>
            <ul className="vc-guest-list">
              <li>Đặt và quản lý lịch hẹn trực tuyến</li>
              <li>Xem lịch sử bệnh án và kết quả khám</li>
              <li>Nhận thông báo lịch hẹn theo thời gian thực</li>
            </ul>
          </div>
          <div className="vc-login-box">
            <h3>Chào mừng trở lại</h3>
            <p>Đăng nhập để tiếp tục trải nghiệm hệ thống VisionCare.</p>
            <div className="vc-login-tabs" aria-hidden="true">
              <span className="is-active">Bệnh nhân</span>
              <span>Bác sĩ</span>
              <span>Đối tác</span>
            </div>
            <Link className="vc-btn vc-btn-primary vc-login-cta" to="/login">
              Đăng nhập
            </Link>
            <p className="vc-login-note">
              Chưa có tài khoản? <Link to="/register">Đăng ký miễn phí</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
