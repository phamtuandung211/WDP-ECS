import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  doctorService,
  specializationService,
  degreeService,
  getUploadFullUrl,
} from "../services/index.js";

function slugify(value) {
  return (value || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

function parseGender(gender) {
  if (gender === "MALE") return "nam";
  if (gender === "FEMALE") return "nu";
  return "khac";
}

function genderLabel(gender) {
  if (gender === "nam") return "Nam";
  if (gender === "nu") return "Nữ";
  return "Khác";
}

function genderIcon(gender) {
  if (gender === "nam") return "♂";
  if (gender === "nu") return "♀";
  return "•";
}

function extractDegrees(doctor) {
  const directNames = Array.isArray(doctor?.degreeNames)
    ? doctor.degreeNames
    : [];
  const degreeObjs = Array.isArray(doctor?.degrees)
    ? doctor.degrees.map(
        (item) => item?.name || item?.fullName || item?.title || item,
      )
    : [];
  const single = [
    doctor?.degree,
    doctor?.degreeName,
    doctor?.fullDegreeName,
    doctor?.degreeTitle,
  ];

  const allDegrees = [...directNames, ...degreeObjs, ...single]
    .filter((item) => item && String(item).trim())
    .map((name) => String(name).trim())
    .filter(
      (name) => name.length > 0 && name !== "undefined" && name !== "null",
    );

  // Debug log
  if (allDegrees.length === 0 && doctor) {
    console.warn("No degrees found for doctor:", doctor.fullName, doctor);
  }

  return allDegrees;
}

function extractSpecializations(doctor) {
  if (!Array.isArray(doctor?.specializations)) return [];
  return doctor.specializations
    .map((item) => ({ id: item?._id, name: item?.name }))
    .filter((item) => item.id || item.name);
}

function resolveDoctorAvatar(doctor, fallbackAvatar) {
  const rawAvatar =
    doctor?.accountId?.avatar || doctor?.avatar || doctor?.img || "";

  if (typeof rawAvatar === "string" && rawAvatar.trim()) {
    return rawAvatar.startsWith("http")
      ? rawAvatar
      : getUploadFullUrl(rawAvatar) || fallbackAvatar;
  }

  return fallbackAvatar;
}

const DoctorListPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterSpec, setFilterSpec] = useState("");
  const [filterDegree, setFilterDegree] = useState("");
  const [filterGenders, setFilterGenders] = useState([]);
  const [sortDir, setSortDir] = useState("");
  const [page, setPage] = useState(1);

  const pageSize = 6;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [specRes, degRes, doctorRes] = await Promise.all([
          specializationService.getAllSpecializations(),
          degreeService.getAllNames(),
          doctorService.getAllDoctor({ page: 1, limit: 200 }),
        ]);

        setSpecializations(specRes.data?.data || []);
        setDegrees(degRes.data?.data || []);
        setDoctors(doctorRes.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const doctorItems = useMemo(() => {
    return (doctors || []).map((doctor, index) => {
      const specializationsOfDoctor = extractSpecializations(doctor);
      const degreesOfDoctor = extractDegrees(doctor);
      const gender = parseGender(doctor?.gender);
      const exp = Number(doctor?.experienceYears || 0);

      const dataSpec = specializationsOfDoctor
        .map((item) => item.id || slugify(item.name))
        .filter(Boolean)
        .join(" ");

      const dataDegree = degreesOfDoctor.map(slugify).filter(Boolean).join(" ");

      const fallbackAvatar =
        "https://www.shutterstock.com/image-photo/healthcare-medical-staff-concept-portrait-600nw-2281024823.jpg";

      return {
        ...doctor,
        _featured: index === 0,
        _genderValue: gender,
        _genderLabel: genderLabel(gender),
        _genderIcon: genderIcon(gender),
        _specList: specializationsOfDoctor,
        _degreeList: degreesOfDoctor,
        _dataSpec: dataSpec,
        _dataDegree: dataDegree,
        _dataGender: gender,
        _dataExp: exp,
        _avatar: resolveDoctorAvatar(doctor, fallbackAvatar),
      };
    });
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    let result = [...doctorItems].filter((item) => {
      const specOk = !filterSpec || (item._dataSpec || "").includes(filterSpec);
      const degreeOk =
        !filterDegree || (item._dataDegree || "").includes(filterDegree);
      const genderOk =
        filterGenders.length === 0 || filterGenders.includes(item._dataGender);
      return specOk && degreeOk && genderOk;
    });

    if (sortDir) {
      result.sort((a, b) =>
        sortDir === "asc" ? a._dataExp - b._dataExp : b._dataExp - a._dataExp,
      );
    }

    return result;
  }, [doctorItems, filterDegree, filterGenders, filterSpec, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [filterSpec, filterDegree, filterGenders, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const visibleDoctors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDoctors.slice(start, start + pageSize);
  }, [currentPage, filteredDoctors]);

  const toggleGender = (value) => {
    setFilterGenders((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  const resetFilters = () => {
    setFilterSpec("");
    setFilterDegree("");
    setFilterGenders([]);
    setSortDir("");
    setPage(1);
  };

  let doctorsContent = (
    <div className="vdoc-empty-state" id="empty-state">
      <div className="vdoc-empty-icon">🔍</div>
      <h3>Không tìm thấy bác sĩ</h3>
      <p>Thử thay đổi bộ lọc hoặc reset để xem tất cả bác sĩ.</p>
    </div>
  );

  if (loading) {
    doctorsContent = (
      <div className="vdoc-empty-state">
        <div className="vdoc-empty-icon">⏳</div>
        <h3>Đang tải dữ liệu...</h3>
      </div>
    );
  } else if (visibleDoctors.length) {
    doctorsContent = (
      <div className="vdoc-grid" id="doc-grid">
        {visibleDoctors.map((doctor) => (
          <article
            key={doctor._id}
            className={`vdoc-card ${doctor._featured ? "featured" : ""}`}
            data-spec={doctor._dataSpec}
            data-degree={doctor._dataDegree}
            data-gender={doctor._dataGender}
            data-exp={doctor._dataExp}
            data-name={(doctor.fullName || "").toLowerCase()}
          >
            <div className="vdoc-img">
              <img src={doctor._avatar} alt={doctor.fullName || "Doctor"} />
              <span className="vdoc-spec-badge">
                {doctor._specList[0]?.name || "Chuyên khoa"}
              </span>
              <span className="vdoc-gender">{doctor._genderIcon}</span>
            </div>

            <div className="vdoc-body">
              <h3 className="vdoc-name">
                {doctor.fullName || "Đang cập nhật"}
              </h3>

              <div className="vdoc-specs">
                {doctor._specList.length ? (
                  doctor._specList.map((spec) => (
                    <span key={spec.id || spec.name} className="vdoc-spec-tag">
                      {spec.name}
                    </span>
                  ))
                ) : (
                  <span className="vdoc-spec-tag">Đang cập nhật</span>
                )}
              </div>

              <div className="vdoc-info">
                <div className="vdoc-info-row">
                  <span className="vdoc-info-label">Năm kinh nghiệm:</span>
                  <span className="vdoc-info-val">{doctor._dataExp} năm</span>
                </div>
                <div className="vdoc-info-row">
                  <span className="vdoc-info-label">Giới tính:</span>
                  <span className="vdoc-info-val">{doctor._genderLabel}</span>
                </div>
                <div className="vdoc-info-row">
                  <span className="vdoc-info-label">Học vị:</span>
                  <span className="vdoc-info-val">
                    {doctor._degreeList[0] ||
                      doctor._specList[0]?.name ||
                      "Đang cập nhật"}
                  </span>
                </div>
              </div>

              <div className="vdoc-stars">⭐⭐⭐⭐⭐</div>

              <div className="vdoc-footer">
                <Link to="/appointments" className="vdoc-btn-book">
                  Đặt lịch khám
                </Link>
                <Link
                  to={`/doctors/${doctor._id}`}
                  className="vdoc-btn-profile"
                >
                  Xem hồ sơ
                </Link>
              </div>
            </div>
          </article>
        ))}

        {/*
              TEMPLATE: Thêm bác sĩ mới
              - Điền data-spec, data-degree, data-gender, data-exp trên vdoc-card
              - Nếu data attributes hợp lệ, filter/sort tự động hoạt động
                */}
      </div>
    );
  }

  return (
    <div className="page vdoc-page">
      <section className="vdoc-hero">
        <div className="vdoc-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <span>Bác sĩ</span>
        </div>
        <h1 className="vdoc-title">
          Đội ngũ <em>chuyên gia</em>
        </h1>
        <p className="vdoc-sub">
          Gặp gỡ đội ngũ bác sĩ nhãn khoa giàu kinh nghiệm, tận tâm và được đào
          tạo bài bản.
        </p>
      </section>

      <section className="vdoc-main-layout">
        <aside className="vdoc-filter-panel">
          <h3 className="vdoc-filter-title">Bộ lọc</h3>

          <div className="vdoc-filter-group">
            <label className="vdoc-filter-label" htmlFor="filter-spec">
              Chọn chuyên khoa
            </label>
            <select
              id="filter-spec"
              className="vdoc-filter-select"
              value={filterSpec}
              onChange={(e) => setFilterSpec(e.target.value)}
            >
              <option value="">Tất cả chuyên khoa</option>
              {specializations.map((spec) => (
                <option key={spec._id} value={spec._id}>
                  {spec.name}
                </option>
              ))}
            </select>
          </div>

          <div className="vdoc-filter-group">
            <label className="vdoc-filter-label" htmlFor="filter-degree">
              Chọn học vị
            </label>
            <select
              id="filter-degree"
              className="vdoc-filter-select"
              value={filterDegree}
              onChange={(e) => setFilterDegree(e.target.value)}
            >
              <option value="">Tất cả học vị</option>
              {degrees.map((degree) => {
                const value = slugify(degree);
                return (
                  <option key={value || degree} value={value}>
                    {degree}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="vdoc-filter-group">
            <span className="vdoc-filter-label">Giới tính</span>
            <label className="vdoc-check-item">
              <input
                type="checkbox"
                checked={filterGenders.includes("nam")}
                onChange={() => toggleGender("nam")}
              />
              <span className="vdoc-check-box" />
              <span className="vdoc-check-label">Nam</span>
            </label>
            <label className="vdoc-check-item">
              <input
                type="checkbox"
                checked={filterGenders.includes("nu")}
                onChange={() => toggleGender("nu")}
              />
              <span className="vdoc-check-box" />
              <span className="vdoc-check-label">Nữ</span>
            </label>
          </div>

          <div className="vdoc-filter-group">
            <span className="vdoc-filter-label">Sắp xếp kinh nghiệm</span>
            <div className="vdoc-sort-group">
              <button
                type="button"
                className={`vdoc-sort-btn ${sortDir === "asc" ? "active" : ""}`}
                onClick={() => setSortDir("asc")}
              >
                Tăng dần
              </button>
              <button
                type="button"
                className={`vdoc-sort-btn ${sortDir === "desc" ? "active" : ""}`}
                onClick={() => setSortDir("desc")}
              >
                Giảm dần
              </button>
            </div>
          </div>

          <button
            type="button"
            className="vdoc-btn-reset"
            onClick={resetFilters}
          >
            ↺ Reset bộ lọc
          </button>
        </aside>

        <div className="vdoc-doctors-area">
          <div className="vdoc-toolbar">
            <p className="vdoc-count">
              Hiển thị <strong>{filteredDoctors.length}</strong> bác sĩ
            </p>
          </div>

          {doctorsContent}

          <div className="vdoc-pagination-wrap">
            <p className="vdoc-page-info">
              Trang <strong>{currentPage}</strong> /{" "}
              <strong>{totalPages}</strong>
            </p>
            <div className="vdoc-pagination">
              <button
                type="button"
                className="vdoc-page-btn arrow"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Prev
              </button>
              <button type="button" className="vdoc-page-btn active">
                {currentPage}
              </button>
              <button
                type="button"
                className="vdoc-page-btn arrow"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DoctorListPage;
