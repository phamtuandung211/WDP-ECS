import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { serviceService, getUploadFullUrl } from "../services";
import { Loading, Alert } from "../components/UI";
import { Pagination } from "../components/Pagination";

const CATEGORY_LABELS = {
  all: "Tất cả",
  kham: "Khám & tầm soát",
  dieutri: "Điều trị",
  phauthu: "Phẫu thuật",
  treem: "Trẻ em",
};

function normalizeText(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "");
}

function detectCategories(service) {
  const text = normalizeText(
    `${service?.name || ""} ${service?.description || ""}`,
  );
  const tags = [];

  if (/(tre em|nhi|nhi khoa|pediatric|child)/.test(text)) tags.push("treem");
  if (/(laser|phau thuat|mo|lasik|smile)/.test(text)) tags.push("phauthu");
  if (/(dieu tri|kho mat|glaucoma|vong mac|retina|thuoc)/.test(text))
    tags.push("dieutri");
  if (/(kham|tam soat|tong quat|do khuc xa|chan doan|screen)/.test(text))
    tags.push("kham");

  if (!tags.length) tags.push("kham");
  return [...new Set(tags)];
}

function categoryVisual(primary) {
  const byCategory = {
    treem: {
      icon: "🧒",
      gradient: "linear-gradient(135deg, #D4EDF8, #85C2E8)",
    },
    dieutri: {
      icon: "💧",
      gradient: "linear-gradient(135deg, #C8E0F4, #6AADD4)",
    },
    phauthu: {
      icon: "⚡",
      gradient: "linear-gradient(135deg, #B8D4F0, #4A90C4)",
    },
    kham: { icon: "👁️", gradient: "linear-gradient(135deg, #E0EEF8, #A8C8E8)" },
  };
  return byCategory[primary] || byCategory.kham;
}

function estimateDuration(categories) {
  if (categories.includes("phauthu")) return "60 phút";
  if (categories.includes("dieutri")) return "45-60 phút";
  if (categories.includes("treem")) return "30-45 phút";
  return "20-40 phút";
}

export function Services() {
  const [result, setResult] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const limit = 9;
  const { data: services, metadata } = result;

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await serviceService.getList({
          page,
          limit,
          search: search || undefined,
        });
        setResult(data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Không tải được danh sách dịch vụ",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [page, search]);

  const totalPages = metadata?.totalPages ?? 1;

  const servicesWithMeta = useMemo(
    () =>
      (services || []).map((service, index) => {
        const categories = detectCategories(service);
        const primaryCategory = categories[0] || "kham";
        return {
          ...service,
          _isFeatured: index === 0,
          _categories: categories,
          _dataCat: categories.join(" "),
          _duration: estimateDuration(categories),
          _visual: categoryVisual(primaryCategory),
          _primaryCategory: primaryCategory,
        };
      }),
    [services],
  );

  const categoryCounts = useMemo(() => {
    const base = {
      all: servicesWithMeta.length,
      kham: 0,
      dieutri: 0,
      phauthu: 0,
      treem: 0,
    };
    servicesWithMeta.forEach((service) => {
      service._categories.forEach((cat) => {
        if (cat in base) base[cat] += 1;
      });
    });
    return base;
  }, [servicesWithMeta]);

  const filteredServices = useMemo(() => {
    if (activeCategory === "all") return servicesWithMeta;
    return servicesWithMeta.filter((service) =>
      service._categories.includes(activeCategory),
    );
  }, [activeCategory, servicesWithMeta]);

  const formatCurrency = (amount) => {
    if (amount == null || Number.isNaN(Number(amount))) return "Liên hệ";
    return `${Number(amount).toLocaleString("vi-VN")} VND`;
  };

  const stripHtml = (value) =>
    (value || "")
      .replaceAll(/<[^>]*>/g, " ")
      .replaceAll(/\s+/g, " ")
      .trim();

  if (loading && !services?.length) return <Loading />;

  return (
    <div className="page vsvc-page">
      <section className="vsvc-hero">
        <div className="vsvc-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <span>Dịch vụ</span>
        </div>
        <h1 className="vsvc-title">
          Dịch vụ <em>khám mắt</em>
        </h1>
        <p className="vsvc-sub">
          Chúng tôi cung cấp đầy đủ các dịch vụ nhãn khoa từ cơ bản đến chuyên
          sâu, ứng dụng công nghệ tiên tiến nhất.
        </p>

        <form
          className="vsvc-search"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(e.target.search?.value?.trim() ?? "");
          }}
        >
          <input
            type="text"
            name="search"
            placeholder="Tìm theo tên hoặc mô tả..."
            defaultValue={search}
          />
          <button type="submit">Tìm kiếm</button>
        </form>
      </section>

      <section className="vsvc-filter-bar">
        <span className="vsvc-filter-label">Lọc theo:</span>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            type="button"
            key={key}
            className={`vsvc-chip ${activeCategory === key ? "active" : ""}`}
            onClick={() => setActiveCategory(key)}
          >
            {label} ({categoryCounts[key] || 0})
          </button>
        ))}
        <span className="vsvc-filter-count">
          {filteredServices.length} dịch vụ
        </span>
      </section>

      {error && <Alert type="error">{error}</Alert>}

      <section className="vsvc-main-wrap">
        <div className="vsvc-grid" id="svc-grid">
          {filteredServices.length ? (
            filteredServices.map((service) => (
              <Link
                key={service._id}
                to={`/services/${service._id}`}
                className={`vsvc-card ${service._isFeatured ? "featured" : ""}`}
                data-cat={service._dataCat}
              >
                <div
                  className="vsvc-thumb"
                  style={{ background: service._visual.gradient }}
                >
                  {service.image ? (
                    <img
                      src={getUploadFullUrl(service.image)}
                      alt={service.name}
                    />
                  ) : (
                    <span className="vsvc-thumb-icon" aria-hidden="true">
                      {service._visual.icon}
                    </span>
                  )}

                  <span
                    className={`vsvc-badge ${service._isFeatured ? "popular" : ""}`}
                  >
                    {CATEGORY_LABELS[service._primaryCategory] || "Dịch vụ"}
                  </span>
                </div>

                <div className="vsvc-body">
                  <h3 className="vsvc-name">{service.name}</h3>
                  <p className="vsvc-desc">
                    {stripHtml(service.description).slice(
                      0,
                      service._isFeatured ? 220 : 140,
                    ) || "Thông tin đang được cập nhật."}
                  </p>
                  <div className="vsvc-meta">
                    <span className="vsvc-duration">{service._duration}</span>
                  </div>
                  <div className="vsvc-footer">
                    <div className="vsvc-price">
                      <span className="vsvc-price-num">
                        {formatCurrency(service.price)}
                      </span>
                      <span className="vsvc-price-unit">/ lượt khám</span>
                    </div>
                    <span className="vsvc-btn-detail">Xem chi tiết</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="vsvc-empty-state">
              <div className="empty-icon">🔎</div>
              <h3>Không tìm thấy dịch vụ phù hợp</h3>
              <p>
                Hãy thử đổi bộ lọc hoặc từ khóa tìm kiếm để xem thêm kết quả.
              </p>
            </div>
          )}
        </div>

        {/*
          TEMPLATE: Them card moi
          - Dung data-cat="kham dieutri phauthu treem" tren vsvc-card
          - Them class featured neu card can chiem 2 cot
          - Cap nhat badge + thumb theo danh muc
        */}

        <Pagination
          page={page}
          totalPages={totalPages}
          total={metadata?.total}
          onPrev={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      </section>
    </div>
  );
}
