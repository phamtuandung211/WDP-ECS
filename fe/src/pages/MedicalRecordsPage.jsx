import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { medicalRecordService } from "../services";
import { Loading, Alert } from "../components/UI";
import "./MedicalRecordsPage.css";

// ─── Helper: Get initials from name ───────────────────────────────────
function getInitials(fullName) {
  if (!fullName) return "—";
  return fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Helper: Get diagnosis tag color ──────────────────────────────────
function getDiagnosisTagClass(diagnosis) {
  const lower = (diagnosis || "").toLowerCase();
  if (lower.includes("flu") || lower.includes("cảm")) return "tag-blue";
  if (lower.includes("covid")) return "tag-teal";
  if (lower.includes("fever") || lower.includes("sốt")) return "tag-amber";
  if (lower.includes("critical")) return "tag-red";
  return "tag-blue";
}

// ─── Helper: Get date badge info ──────────────────────────────────────
function getDateBadge(createdAt) {
  const recordDate = new Date(createdAt);
  const now = new Date();
  const daysAgo = Math.floor((now - recordDate) / (1000 * 60 * 60 * 24));

  if (daysAgo === 0) return { text: "Hôm nay", isNew: true };
  if (daysAgo === 1) return { text: "Hôm qua", isNew: true };
  if (daysAgo < 7) return { text: `${daysAgo} ngày trước`, isNew: true };
  return { text: `${daysAgo} ngày trước`, isNew: false };
}

// ─── Stats Component ──────────────────────────────────────────────────
function RecordsStats({ records }) {
  const totalVisits = records.length;
  const doctors = [...new Set(records.map((r) => r.doctorId?.fullName))].filter(
    Boolean,
  ).length;
  const lastVisit = records[0]
    ? new Date(records[0].createdAt).toLocaleDateString("vi-VN")
    : "—";

  return (
    <div className="stats">
      <div className="stat-card">
        <div className="stat-label">Tổng lần khám</div>
        <div className="stat-value">{totalVisits}</div>
        <div className="stat-note">Tháng 3 · 2026</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Bác sĩ điều trị</div>
        <div className="stat-value">{doctors}</div>
        <div className="stat-note">Các bác sĩ khác nhau</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Lần khám gần nhất</div>
        <div className="stat-value">{lastVisit}</div>
        <div className="stat-note">Cập nhật gần đây</div>
      </div>
    </div>
  );
}

// ─── Customer: xem lịch sử bệnh án của mình ──────────────────────────────────
function MyMedicalRecords() {
  const [result, setResult] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 10;
  const { data: records, metadata } = result;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await medicalRecordService.getMy({ page, limit });
        setResult(data);
      } catch (err) {
        setError(err.response?.data?.message || "Không tải được hồ sơ bệnh án");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page]);

  if (loading && !records.length) return <Loading />;

  const filteredRecords = records.filter(
    (r) =>
      r.doctorId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.symptoms?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div>
      {error && <Alert type="error">{error}</Alert>}

      {selected ? (
        <RecordDetail record={selected} onBack={() => setSelected(null)} />
      ) : (
        <>
          {records.length > 0 && <RecordsStats records={records} />}

          <div className="toolbar">
            <div className="search-wrap">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="search-input"
                type="text"
                placeholder="Tìm theo ngày, bác sĩ, chẩn đoán..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-card">
            <div className="table-head">
              <div className="th">Ngày khám</div>
              <div className="th">Bác sĩ</div>
              <div className="th">Chẩn đoán</div>
              <div className="th">Triệu chứng</div>
              <div className="th"></div>
            </div>

            {filteredRecords.length > 0 ? (
              filteredRecords.map((r) => {
                const badge = getDateBadge(r.createdAt);
                return (
                  <div key={r._id} className="record-row">
                    <div className="cell-date">
                      <div className="date-day">
                        {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                      <span
                        className={`date-badge ${badge.isNew ? "" : "old"}`}
                      >
                        {badge.text}
                      </span>
                    </div>
                    <div className="cell-doctor">
                      <div className="doctor-avatar">
                        {getInitials(r.doctorId?.fullName)}
                      </div>
                      <div>
                        <div className="doctor-name">
                          {r.doctorId?.fullName || "—"}
                        </div>
                        <div className="doctor-role">Bác sĩ</div>
                      </div>
                    </div>
                    <div className="cell-diagnosis">
                      <span
                        className={`diagnosis-tag ${getDiagnosisTagClass(
                          r.diagnosis,
                        )}`}
                      >
                        {r.diagnosis || "—"}
                      </span>
                    </div>
                    <div className="cell-symptom">{r.symptoms || "—"}</div>
                    <div className="cell-action">
                      <button
                        className="btn-detail"
                        onClick={() => setSelected(r)}
                      >
                        Chi tiết
                        <svg viewBox="0 0 24 24">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <svg viewBox="0 0 24 24">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                </svg>
                <p>
                  {searchTerm
                    ? "Không tìm thấy hồ sơ phù hợp"
                    : "Chưa có hồ sơ bệnh án nào"}
                </p>
              </div>
            )}

            {records.length > 0 && (
              <div className="pagination">
                <div className="page-info">
                  Hiển thị {Math.min((page - 1) * limit + 1, records.length)}–
                  {Math.min(page * limit, records.length)} trong{" "}
                  {metadata?.totalItems || 0} hồ sơ
                </div>
                <div className="page-btns">
                  <button
                    className="page-btn"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                  >
                    <svg viewBox="0 0 24 24">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button className="page-btn active">{page}</button>
                  <button
                    className="page-btn"
                    onClick={() =>
                      setPage((p) => Math.min(p + 1, metadata?.totalPages || 1))
                    }
                    disabled={page === (metadata?.totalPages || 1)}
                  >
                    <svg viewBox="0 0 24 24">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Staff/CS/Admin/Doctor: xem tất cả hồ sơ ──────────────────────────
function AllMedicalRecords() {
  const [result, setResult] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 10;
  const { data: records, metadata } = result;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await medicalRecordService.getAll({ page, limit });
        setResult(data);
      } catch (err) {
        setError(err.response?.data?.message || "Không tải được danh sách");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page]);

  if (loading && !records.length) return <Loading />;

  const filteredRecords = records.filter(
    (r) =>
      r.customerId?.fullName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      r.doctorId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div>
      {error && <Alert type="error">{error}</Alert>}

      {selected ? (
        <RecordDetail record={selected} onBack={() => setSelected(null)} />
      ) : (
        <>
          {records.length > 0 && <RecordsStats records={records} />}

          <div className="toolbar">
            <div className="search-wrap">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="search-input"
                type="text"
                placeholder="Tìm theo bệnh nhân, bác sĩ, chẩn đoán..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-card">
            <div className="table-head">
              <div className="th">Ngày khám</div>
              <div className="th">Bệnh nhân</div>
              <div className="th">Bác sĩ</div>
              <div className="th">Chẩn đoán</div>
              <div className="th"></div>
            </div>

            {filteredRecords.length > 0 ? (
              filteredRecords.map((r) => {
                const badge = getDateBadge(r.createdAt);
                return (
                  <div key={r._id} className="record-row">
                    <div className="cell-date">
                      <div className="date-day">
                        {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                      <span
                        className={`date-badge ${badge.isNew ? "" : "old"}`}
                      >
                        {badge.text}
                      </span>
                    </div>
                    <div className="cell-doctor">
                      <div className="doctor-avatar">
                        {getInitials(r.customerId?.fullName)}
                      </div>
                      <div>
                        <div className="doctor-name">
                          {r.customerId?.fullName || "—"}
                        </div>
                        <div className="doctor-role">Bệnh nhân</div>
                      </div>
                    </div>
                    <div className="cell-doctor">
                      <div className="doctor-avatar">
                        {getInitials(r.doctorId?.fullName)}
                      </div>
                      <div>
                        <div className="doctor-name">
                          {r.doctorId?.fullName || "—"}
                        </div>
                        <div className="doctor-role">Bác sĩ</div>
                      </div>
                    </div>
                    <div className="cell-diagnosis">
                      <span
                        className={`diagnosis-tag ${getDiagnosisTagClass(
                          r.diagnosis,
                        )}`}
                      >
                        {r.diagnosis || "—"}
                      </span>
                    </div>
                    <div className="cell-action">
                      <button
                        className="btn-detail"
                        onClick={() => setSelected(r)}
                      >
                        Chi tiết
                        <svg viewBox="0 0 24 24">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <svg viewBox="0 0 24 24">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                </svg>
                <p>
                  {searchTerm
                    ? "Không tìm thấy hồ sơ phù hợp"
                    : "Không có hồ sơ nào"}
                </p>
              </div>
            )}

            {records.length > 0 && (
              <div className="pagination">
                <div className="page-info">
                  Hiển thị {Math.min((page - 1) * limit + 1, records.length)}–
                  {Math.min(page * limit, records.length)} trong{" "}
                  {metadata?.totalItems || 0} hồ sơ
                </div>
                <div className="page-btns">
                  <button
                    className="page-btn"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                  >
                    <svg viewBox="0 0 24 24">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button className="page-btn active">{page}</button>
                  <button
                    className="page-btn"
                    onClick={() =>
                      setPage((p) => Math.min(p + 1, metadata?.totalPages || 1))
                    }
                    disabled={page === (metadata?.totalPages || 1)}
                  >
                    <svg viewBox="0 0 24 24">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Chi tiết 1 hồ sơ bệnh án ────────────────────────────────────────────────
function RecordDetail({ record, onBack }) {
  const { user } = useAuth();
  const recordDate = new Date(record.createdAt);
  const dateStr = recordDate.toLocaleDateString("vi-VN");
  const timeStr = recordDate.toLocaleTimeString("vi-VN");

  // Nếu customerId không có fullName nhưng user hiện tại là customer của record này, dùng tên user
  const patientName =
    record.customerId?.fullName ||
    (user?.role === "CUSTOMER" ? user?.fullName : "—");

  return (
    <div className="page-detail">
      <button className="back-link" onClick={onBack}>
        <svg viewBox="0 0 24 24">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Quay lại
      </button>

      <div className="page-title ">Chi tiết hồ sơ bệnh án</div>

      {/* CARD 1: THÔNG TIN CHUNG */}
      <div className="detail-card">
        <div className="card-header">
          <div className="card-header-icon">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="card-header-title">Thông tin chung</div>
        </div>

        <div className="field-row">
          <div className="field-label">Ngày khám</div>
          <div className="field-datetime">
            <div className="field-date">{dateStr}</div>
            <div className="field-time">{timeStr}</div>
          </div>
        </div>

        <div className="field-row">
          <div className="field-label">Bác sĩ</div>
          <div className="field-value">
            <div className="doctor-inline">
              <div className="doctor-avatar">
                {getInitials(record.doctorId?.fullName)}
              </div>
              {record.doctorId?.fullName || "—"}
            </div>
          </div>
        </div>

        <div className="field-row">
          <div className="field-label">Bệnh nhân</div>
          <div className={`field-value ${patientName === "—" ? "muted" : ""}`}>
            {patientName}
          </div>
        </div>
      </div>

      {/* CARD 2: KẾT QUẢ KHÁM */}
      <div className="detail-card">
        <div className="card-header">
          <div className="card-header-icon">
            <svg viewBox="0 0 24 24">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div className="card-header-title">Kết quả khám</div>
        </div>

        <div className="field-row">
          <div className="field-label">Triệu chứng</div>
          <div className={`field-value ${!record.symptoms ? "muted" : ""}`}>
            {record.symptoms || "—"}
          </div>
        </div>

        <div className="field-row">
          <div className="field-label">Chẩn đoán</div>
          <div className="field-value">
            {record.diagnosis ? (
              <span className="tag">{record.diagnosis}</span>
            ) : (
              <span className="muted">—</span>
            )}
          </div>
        </div>
      </div>

      {/* CARD 3: ĐƠN THUỐC */}
      {record.prescription && (
        <div className="detail-card">
          <div className="card-header">
            <div className="card-header-icon">
              <svg viewBox="0 0 24 24">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <div className="card-header-title">Đơn thuốc</div>
          </div>

          <div className="field-row">
            <div className="field-label">Thuốc</div>
            <div className="field-value">
              <div className="rx-list">
                <div className="rx-item">
                  <div className="rx-dot"></div>
                  <div>
                    <div className="rx-name">{record.prescription}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CARD 4: GHI CHÚ */}
      {record.notes && (
        <div className="detail-card">
          <div className="card-header">
            <div className="card-header-icon">
              <svg viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div className="card-header-title">Ghi chú</div>
          </div>

          <div className="field-row">
            <div className="field-label">Ghi chú</div>
            <div className="field-value">
              <div className="text-block">{record.notes}</div>
            </div>
          </div>
        </div>
      )}

      {/* CARD 5: AI SUMMARY */}
      {record.aiSummary && (
        <div className="detail-card">
          <div className="card-header">
            <div className="card-header-icon">
              <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="12" y1="8" x2="12" y2="16" />
              </svg>
            </div>
            <div className="card-header-title">AI Summary</div>
          </div>

          <div className="field-row">
            <div className="field-label">Tóm tắt</div>
            <div className="field-value">
              <div className="text-block">{record.aiSummary}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function MedicalRecordsPage() {
  const { user } = useAuth();
  const role = user?.role;

  if (!role) {
    return (
      <div className="page medical-records-page">
        <div className="mr-header">
          <div className="mr-header-brand">
            <div className="mr-header-icon">
              <svg viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="9" y1="16" x2="13" y2="16" />
              </svg>
            </div>
            <div>
              <div className="mr-header-title">Hồ sơ bệnh án</div>
              <div className="mr-header-sub">Quản lý lịch sử khám bệnh</div>
            </div>
          </div>
        </div>
        <Alert type="warning">Vui lòng đăng nhập để xem hồ sơ bệnh án.</Alert>
      </div>
    );
  }

  return (
    <div className="page medical-records-page">
      <div className="mr-header">
        <div className="mr-header-brand">
          <div className="mr-header-icon">
            <svg viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="13" y2="16" />
            </svg>
          </div>
          <div>
            <div className="mr-header-title">Hồ sơ bệnh án</div>
            <div className="mr-header-sub">Quản lý lịch sử khám bệnh</div>
          </div>
        </div>
      </div>

      {role === "CUSTOMER" && <MyMedicalRecords />}
      {(role === "SALE_STAFF" ||
        role === "CUSTOMER_SUPPORT" ||
        role === "ADMIN" ||
        role === "DOCTOR") && <AllMedicalRecords />}
    </div>
  );
}
