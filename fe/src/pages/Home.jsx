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
        setError("Khong tai duoc du lieu trang chu. Vui long thu lai sau.");
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
        label: "Bac si nhan khoa",
      },
      {
        value: `${services.length > 0 ? services.length : 12}+`,
        label: "Goi dich vu",
      },
      {
        value: `${blogs.length > 0 ? blogs.length : 98}%`,
        label: "Noi dung chuyen sau",
      },
      {
        value: "15",
        label: "Nam kinh nghiem",
      },
    ],
    [blogs.length, doctors.length, services.length],
  );

  const formatCurrency = (amount) => {
    if (amount == null || Number.isNaN(Number(amount))) return "Lien he";
    return `${Number(amount).toLocaleString("vi-VN")} VND`;
  };

  const formatDate = (value) => {
    if (!value) return "Moi cap nhat";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Moi cap nhat";
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
    if (gender === "FEMALE") return "Nu";
    if (gender === "MALE") return "Nam";
    return "Khac";
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
            <span>Trung tam mat chuyen sau</span>
          </div>
          <h1 className="vc-hero-title">
            <span>Cham soc</span>
            <em>doi mat</em>
            <strong>voi tam huyet</strong>
          </h1>
          <p className="vc-hero-desc">
            VisionCare ket hop doi ngu bac si nhan khoa va he thong quan ly lich
            kham hien dai, giup ban dat lich nhanh va theo doi ho so mat de
            dang.
          </p>
          <div className="vc-hero-buttons">
            <Link className="vc-btn vc-btn-primary" to="/appointments">
              Dat lich kham ngay
            </Link>
            <Link className="vc-btn vc-btn-outline" to="/services">
              Xem dich vu
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
              <span className="vc-floating-label">Thi luc hom nay</span>
              <strong>20/20</strong>
            </div>
            <div className="vc-floating vc-floating-bottom">
              <span className="vc-floating-label">Danh gia</span>
              <strong>4.9/5</strong>
            </div>
          </div>
        </div>
      </section>

      {error && <Alert type="error">{error}</Alert>}

      <section className="vc-section vc-services" id="services">
        <div className="vc-section-head">
          <div>
            <p className="vc-kicker">Dich vu chuyen khoa</p>
            <h2 className="vc-title">
              <span>Kham va dieu tri</span>
              <em>toan dien</em>
            </h2>
          </div>
          <p className="vc-subtitle">
            Du lieu duoc lay truc tiep tu danh sach dich vu hien tai cua he
            thong.
          </p>
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
                      alt={service.name || "Service"}
                    />
                  </div>
                ) : (
                  <div className="vc-service-icon" aria-hidden="true">
                    {getServiceIcon(index)}
                  </div>
                )}
                <h3>{service.name || "Dich vu"}</h3>
                <p className="vc-service-price">
                  {formatCurrency(service.price)}
                </p>
                <p className="vc-service-desc">
                  {stripHtml(service.description).slice(0, 120) ||
                    "Thong tin dang duoc cap nhat."}
                </p>
              </Link>
            ))
          ) : (
            <p className="vc-empty">Chua co goi dich vu nao.</p>
          )}
        </div>
      </section>

      <section className="vc-section vc-how">
        <div className="vc-how-head">
          <p className="vc-kicker">Quy trinh kham</p>
          <h2 className="vc-title vc-title-center">
            <span>Bon buoc</span>
            <em>don gian</em>
          </h2>
        </div>
        <div className="vc-step-grid">
          {[
            [
              "01",
              "Dat lich",
              "Chon bac si va khung gio phu hop tren he thong.",
            ],
            [
              "02",
              "Dang ky",
              "Check-in nhanh, thong tin luu dong bo tai khoan.",
            ],
            [
              "03",
              "Tham kham",
              "Bac si tu van va ghi nhan ket qua theo tung buoc.",
            ],
            [
              "04",
              "Nhan ket qua",
              "Theo doi lich su va huong dan dieu tri online.",
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
            <p className="vc-kicker">Doi ngu chuyen gia</p>
            <h2 className="vc-title">
              <span>Bac si</span>
              <em>nhan khoa</em>
            </h2>
          </div>
          <Link className="vc-btn vc-btn-outline" to="/doctors">
            Xem tat ca bac si
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
                      alt={doctor.fullName || "Doctor"}
                    />
                    <span>{specializations[0] || "Nhan khoa tong quat"}</span>
                  </div>
                  <div className="vc-doctor-body">
                    <h3>{doctor.fullName || "Dang cap nhat"}</h3>
                    <p>
                      {specializations.join(", ") ||
                        "Thong tin chuyen khoa dang cap nhat"}
                    </p>
                    <div className="vc-doctor-stats">
                      <div>
                        <strong>{doctor.experienceYears || 0}</strong>
                        <small>Nam KN</small>
                      </div>
                      <div>
                        <strong>{getGenderLabel(doctor.gender)}</strong>
                        <small>Gioi tinh</small>
                      </div>
                      <div>
                        <strong>4.9</strong>
                        <small>Danh gia</small>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <p className="vc-empty">Chua co du lieu bac si.</p>
          )}
        </div>
      </section>

      <section className="vc-section vc-tech">
        <div className="vc-tech-grid">
          <div>
            <p className="vc-kicker">Cong nghe tien tien</p>
            <h2 className="vc-title">
              <span>Thiet bi</span>
              <em>the he moi</em>
            </h2>
            <p className="vc-subtitle">
              Nen tang huong toi trien khai quy trinh kham toi uu voi du lieu so
              hoa va ho tro ra quyet dinh nhanh hon.
            </p>
            <div className="vc-tech-items">
              <div>
                <strong>OCT Zeiss</strong>
                <p>Chan doan hinh anh do phan giai cao.</p>
              </div>
              <div>
                <strong>SMILE Pro</strong>
                <p>Ho tro phau thuat laser it xam lan.</p>
              </div>
              <div>
                <strong>AI Screening</strong>
                <p>Canh bao nguy co benh ly som.</p>
              </div>
              <div>
                <strong>Ho so dien tu</strong>
                <p>Theo doi ket qua va lich su dieu tri.</p>
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
            <p className="vc-kicker">Kien thuc nhan khoa</p>
            <h2 className="vc-title">
              <span>Bai viet</span>
              <em>chuyen sau</em>
            </h2>
          </div>
          <Link className="vc-btn vc-btn-outline" to="/blogs">
            Xem tat ca
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
                      alt={blog.title || "Blog"}
                    />
                  ) : (
                    <span aria-hidden="true">💡</span>
                  )}
                </div>
                <div className="vc-article-body">
                  <h3>{blog.title || "Bai viet"}</h3>
                  <p>
                    {stripHtml(blog.content).slice(
                      0,
                      index === 0 ? 160 : 110,
                    ) || "Noi dung dang cap nhat."}
                  </p>
                  <small>{formatDate(blog.createdAt)}</small>
                </div>
              </Link>
            ))
          ) : (
            <p className="vc-empty">Chua co bai viet noi bat.</p>
          )}
        </div>
      </section>

      <section className="vc-section vc-guest" id="login">
        <div className="vc-guest-grid">
          <div>
            <p className="vc-kicker">Danh cho khach</p>
            <h2 className="vc-title">
              <span>Dang nhap</span>
              <em>ngay hom nay</em>
            </h2>
            <p className="vc-subtitle">
              Quan ly lich kham, xem ket qua va nhan thong bao su kien quan
              trong tren mot giao dien thong nhat.
            </p>
            <ul className="vc-guest-list">
              <li>Dat va quan ly lich hen truc tuyen</li>
              <li>Xem lich su benh an va ket qua kham</li>
              <li>Nhan thong bao lich hen theo thoi gian thuc</li>
            </ul>
          </div>
          <div className="vc-login-box">
            <h3>Chao mung tro lai</h3>
            <p>Dang nhap de tiep tuc trai nghiem he thong VisionCare.</p>
            <div className="vc-login-tabs" aria-hidden="true">
              <span className="is-active">Benh nhan</span>
              <span>Bac si</span>
              <span>Doi tac</span>
            </div>
            <Link className="vc-btn vc-btn-primary vc-login-cta" to="/login">
              Dang nhap
            </Link>
            <p className="vc-login-note">
              Chua co tai khoan? <Link to="/register">Dang ky mien phi</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
