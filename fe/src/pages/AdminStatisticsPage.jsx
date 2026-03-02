import React, { useEffect, useState } from "react";
import { statisticsService } from "../services";
import { Loading, Alert } from "../components/UI";
import { PageHeader } from "../components/PageHeader";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "#4361ee" }) {
  return (
    <div className="stat-card" style={{ borderTop: `4px solid ${color}` }}>
      <div className="stat-value" style={{ color }}>{value ?? "—"}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="stats-section-title">{children}</h3>;
}

function DateFilter({ from, to, groupBy, onChange }) {
  return (
    <div className="filter-bar stats-filter">
      <label className="form-label">Từ ngày</label>
      <input
        className="form-input"
        type="date"
        value={from}
        onChange={(e) => onChange("from", e.target.value)}
      />
      <label className="form-label">Đến ngày</label>
      <input
        className="form-input"
        type="date"
        value={to}
        onChange={(e) => onChange("to", e.target.value)}
      />
      {groupBy !== undefined && (
        <>
          <label className="form-label">Nhóm theo</label>
          <select
            className="form-input"
            value={groupBy}
            onChange={(e) => onChange("groupBy", e.target.value)}
          >
            <option value="month">Tháng</option>
            <option value="day">Ngày</option>
          </select>
        </>
      )}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ from: "", to: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await statisticsService.getOverview({
        from: filter.from || undefined,
        to: filter.to || undefined,
      });
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const handleFilter = (key, val) => setFilter((f) => ({ ...f, [key]: val }));

  return (
    <div>
      <DateFilter from={filter.from} to={filter.to} onChange={handleFilter} />
      {loading ? <Loading /> : error ? <Alert type="error">{error}</Alert> : (
        <>
          <SectionTitle>Tài khoản</SectionTitle>
          <div className="stat-grid">
            <StatCard label="Tổng tài khoản" value={data.accounts.total} color="#4361ee" />
            <StatCard label="Đang hoạt động" value={data.accounts.active} color="#2ecc71" />
            <StatCard label="Bác sĩ" value={data.accounts.doctors} color="#9b59b6" />
            <StatCard label="Khách hàng" value={data.accounts.customers} color="#3498db" />
          </div>

          <SectionTitle>Cuộc hẹn</SectionTitle>
          <div className="stat-grid">
            <StatCard label="Tổng cuộc hẹn" value={data.appointments.total} color="#4361ee" />
            <StatCard label="Đã xác nhận" value={data.appointments.byStatus?.CONFIRMED ?? 0} color="#27ae60" />
            <StatCard label="Đã hủy" value={data.appointments.byStatus?.CANCELED ?? 0} color="#e74c3c" />
            <StatCard label="Chờ thanh toán" value={data.appointments.byStatus?.PENDING_PAYMENT ?? 0} color="#e67e22" />
            <StatCard label="BASIC" value={data.appointments.byType?.BASIC ?? 0} color="#3498db" />
            <StatCard label="ADVANCED" value={data.appointments.byType?.ADVANCED ?? 0} color="#9b59b6" />
          </div>

          <SectionTitle>Doanh thu & Hồ sơ</SectionTitle>
          <div className="stat-grid">
            <StatCard
              label="Tổng doanh thu"
              value={Number(data.revenue.total).toLocaleString("vi-VN") + " ₫"}
              color="#27ae60"
            />
            <StatCard label="Hồ sơ bệnh án" value={data.medicalRecords.total} color="#16a085" />
            <StatCard
              label="Tổng đánh giá"
              value={data.feedbacks.total}
              sub={data.feedbacks.avgRating ? `Avg: ${data.feedbacks.avgRating} ★` : null}
              color="#f39c12"
            />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Revenue Tab ──────────────────────────────────────────────────────────────
function RevenueTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ from: "", to: "", groupBy: "month" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await statisticsService.getRevenue({
        from: filter.from || undefined,
        to: filter.to || undefined,
        groupBy: filter.groupBy,
      });
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const handleFilter = (key, val) => setFilter((f) => ({ ...f, [key]: val }));

  const total = data.reduce((s, r) => s + r.totalRevenue, 0);

  return (
    <div>
      <DateFilter {...filter} onChange={handleFilter} />
      {loading ? <Loading /> : error ? <Alert type="error">{error}</Alert> : (
        <>
          <div className="stat-card highlight-card">
            <span className="stat-sub">Tổng doanh thu kỳ đã chọn</span>
            <span className="stat-value" style={{ color: "#27ae60" }}>
              {total.toLocaleString("vi-VN")} ₫
            </span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kỳ</th>
                  <th>Doanh thu (VNĐ)</th>
                  <th>Số giao dịch</th>
                </tr>
              </thead>
              <tbody>
                {data.length ? data.map((r) => (
                  <tr key={r.period}>
                    <td>{r.period}</td>
                    <td>{Number(r.totalRevenue).toLocaleString("vi-VN")}</td>
                    <td>{r.count}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="cell-empty">Không có dữ liệu.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Appointments Stats Tab ───────────────────────────────────────────────────
function AppointmentsStatsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ from: "", to: "", groupBy: "month" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await statisticsService.getAppointments({
        from: filter.from || undefined,
        to: filter.to || undefined,
        groupBy: filter.groupBy,
      });
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const handleFilter = (key, val) => setFilter((f) => ({ ...f, [key]: val }));

  return (
    <div>
      <DateFilter {...filter} onChange={handleFilter} />
      {loading ? <Loading /> : error ? <Alert type="error">{error}</Alert> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kỳ</th>
                <th>Tổng</th>
                <th>CONFIRMED</th>
                <th>CANCELED</th>
                <th>PENDING</th>
                <th>BASIC</th>
                <th>ADVANCED</th>
              </tr>
            </thead>
            <tbody>
              {data.length ? data.map((row) => {
                const byStatus = {};
                const byType = {};
                row.breakdown.forEach((b) => {
                  if (b.status) byStatus[b.status] = (byStatus[b.status] || 0) + b.count;
                  if (b.type) byType[b.type] = (byType[b.type] || 0) + b.count;
                });
                return (
                  <tr key={row.period}>
                    <td>{row.period}</td>
                    <td><strong>{row.total}</strong></td>
                    <td>{byStatus.CONFIRMED ?? 0}</td>
                    <td>{byStatus.CANCELED ?? 0}</td>
                    <td>{byStatus.PENDING_PAYMENT ?? 0}</td>
                    <td>{byType.BASIC ?? 0}</td>
                    <td>{byType.ADVANCED ?? 0}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} className="cell-empty">Không có dữ liệu.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Doctors Stats Tab ────────────────────────────────────────────────────────
function DoctorsStatsTab() {
  const [result, setResult] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ from: "", to: "" });
  const limit = 10;

  const load = async () => {
    setLoading(true);
    try {
      const res = await statisticsService.getDoctors({
        from: filter.from || undefined,
        to: filter.to || undefined,
        page,
        limit,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter, page]);

  const handleFilter = (key, val) => { setPage(1); setFilter((f) => ({ ...f, [key]: val })); };
  const { data: doctors, metadata } = result;

  return (
    <div>
      <DateFilter from={filter.from} to={filter.to} onChange={handleFilter} />
      {loading ? <Loading /> : error ? <Alert type="error">{error}</Alert> : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Bác sĩ</th>
                  <th>Tổng cuộc hẹn</th>
                  <th>Đã xác nhận</th>
                  <th>Hoàn thành</th>
                  <th>Đã hủy</th>
                </tr>
              </thead>
              <tbody>
                {doctors.length ? doctors.map((d, i) => (
                  <tr key={d.doctorId}>
                    <td>{(page - 1) * limit + i + 1}</td>
                    <td>{d.fullName || "—"}</td>
                    <td><strong>{d.totalAppointments}</strong></td>
                    <td>{d.confirmed}</td>
                    <td>{d.completed}</td>
                    <td>{d.canceled}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="cell-empty">Không có dữ liệu.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {metadata?.totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</button>
              <span className="pagination-info">Trang {page}/{metadata.totalPages}</span>
              <button className="btn btn-secondary" disabled={page >= metadata.totalPages} onClick={() => setPage(p => p + 1)}>Sau</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Feedbacks Stats Tab ──────────────────────────────────────────────────────
function FeedbackStatsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ from: "", to: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await statisticsService.getFeedbacks({
        from: filter.from || undefined,
        to: filter.to || undefined,
      });
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const handleFilter = (key, val) => setFilter((f) => ({ ...f, [key]: val }));
  const STAR_COLORS = ["", "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#27ae60"];

  return (
    <div>
      <DateFilter from={filter.from} to={filter.to} onChange={handleFilter} />
      {loading ? <Loading /> : error ? <Alert type="error">{error}</Alert> : data && (
        <>
          <div className="stat-grid">
            <StatCard label="Tổng đánh giá" value={data.totalFeedbacks} color="#f39c12" />
            <StatCard label="Chưa review" value={data.unreviewedCount} color="#e74c3c" />
            <StatCard
              label="Rating trung bình"
              value={data.avgRating ? `${data.avgRating} ★` : "—"}
              color="#27ae60"
            />
          </div>
          <SectionTitle>Phân bổ số sao</SectionTitle>
          <div className="rating-distribution">
            {[5, 4, 3, 2, 1].map((star) => {
              const item = data.distribution.find((d) => d.point === star);
              const count = item?.count ?? 0;
              const pct = data.totalFeedbacks ? Math.round((count / data.totalFeedbacks) * 100) : 0;
              return (
                <div key={star} className="rating-bar-row">
                  <span className="rating-star" style={{ color: STAR_COLORS[star] }}>
                    {star} ★
                  </span>
                  <div className="rating-bar-track">
                    <div
                      className="rating-bar-fill"
                      style={{ width: `${pct}%`, background: STAR_COLORS[star] }}
                    />
                  </div>
                  <span className="rating-count">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Accounts Stats Tab ───────────────────────────────────────────────────────
function AccountsStatsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ from: "", to: "", groupBy: "month" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await statisticsService.getAccounts({
        from: filter.from || undefined,
        to: filter.to || undefined,
        groupBy: filter.groupBy,
      });
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const handleFilter = (key, val) => setFilter((f) => ({ ...f, [key]: val }));

  return (
    <div>
      <DateFilter {...filter} onChange={handleFilter} />
      {loading ? <Loading /> : error ? <Alert type="error">{error}</Alert> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kỳ</th>
                <th>Tổng</th>
                <th>CUSTOMER</th>
                <th>DOCTOR</th>
                <th>SALE_STAFF</th>
                <th>CUSTOMER_SUPPORT</th>
              </tr>
            </thead>
            <tbody>
              {data.length ? data.map((row) => {
                const byRole = {};
                row.byRole.forEach((r) => { byRole[r.role] = r.count; });
                return (
                  <tr key={row.period}>
                    <td>{row.period}</td>
                    <td><strong>{row.total}</strong></td>
                    <td>{byRole.CUSTOMER ?? 0}</td>
                    <td>{byRole.DOCTOR ?? 0}</td>
                    <td>{byRole.SALE_STAFF ?? 0}</td>
                    <td>{byRole.CUSTOMER_SUPPORT ?? 0}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} className="cell-empty">Không có dữ liệu.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Tổng quan" },
  { id: "revenue", label: "Doanh thu" },
  { id: "appointments", label: "Cuộc hẹn" },
  { id: "doctors", label: "Bác sĩ" },
  { id: "feedbacks", label: "Đánh giá" },
  { id: "accounts", label: "Tài khoản" },
];

export function AdminStatisticsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="page statistics-page">
      <PageHeader title="📊 Thống kê — Admin Dashboard" />

      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${activeTab === t.id ? "tab-btn-active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "revenue" && <RevenueTab />}
        {activeTab === "appointments" && <AppointmentsStatsTab />}
        {activeTab === "doctors" && <DoctorsStatsTab />}
        {activeTab === "feedbacks" && <FeedbackStatsTab />}
        {activeTab === "accounts" && <AccountsStatsTab />}
      </div>
    </div>
  );
}
