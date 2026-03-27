import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { statisticsService, adminAccountService } from "../services";
import { Loading, Alert } from "../components/UI";
import { PageHeader } from "../components/PageHeader";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "#4361ee" }) {
  return (
    <div className="stat-card" style={{ borderTop: `4px solid ${color}` }}>
      <div className="stat-value" style={{ color }}>
        {value ?? "—"}
      </div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="stats-section-title">{children}</h3>;
}

function formatPeriodLabel(period, groupBy) {
  if (groupBy !== "day" || typeof period !== "string") {
    return period;
  }

  const datePattern = /^(\d{4})[/-](\d{2})[/-](\d{2})$/;
  const match = datePattern.exec(period);
  if (!match) {
    return period;
  }

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "BS"
  );
}

function getStatusBadgeClass(status = "") {
  const key = status.toUpperCase();
  if (key === "ACTIVE") return "badge-active";
  if (key === "INACTIVE" || key === "REJECTED") return "badge-inactive";
  if (key === "SUSPENDED") return "badge-suspended";
  if (key === "PENDING") return "badge-pending";
  return "";
}

function getRoleBadgeClass(role = "") {
  const key = role.toUpperCase();
  if (key === "ADMIN") return "badge-admin";
  if (key === "DOCTOR") return "badge-doctor";
  if (key === "CUSTOMER") return "badge-customer";
  if (key === "CUSTOMER_SUPPORT") return "badge-support";
  if (key === "SALE_STAFF") return "badge-sale";
  return "";
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
function OverviewTab({ onViewCustomerDetails }) {
  const [data, setData] = useState(null);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, customersRes] = await Promise.allSettled([
        statisticsService.getOverview(),
        statisticsService.getCustomers({ page: 1, limit: 5 }),
      ]);

      if (overviewRes.status === "rejected") {
        throw overviewRes.reason;
      }

      setData(overviewRes.value.data.data);

      if (customersRes.status === "fulfilled") {
        setTopCustomers(customersRes.value.data?.data || []);
      } else {
        setTopCustomers([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      {loading ? (
        <Loading />
      ) : error ? (
        <Alert type="error">{error}</Alert>
      ) : (
        <>
          <SectionTitle>Tài khoản</SectionTitle>
          <div className="stat-grid">
            <StatCard
              label="Tổng tài khoản"
              value={data.totalAccounts.total}
              color="#4361ee"
            />
            <StatCard
              label="Đang hoạt động"
              value={data.totalAccounts.active}
              color="#2ecc71"
            />
            <StatCard
              label="Bác sĩ"
              value={data.totalDoctors}
              color="#9b59b6"
            />
            <StatCard
              label="Khách hàng"
              value={data.totalCustomers}
              color="#3498db"
            />
          </div>

          <SectionTitle>Cuộc hẹn</SectionTitle>
          <div className="stat-grid">
            <StatCard
              label="Tổng cuộc hẹn"
              value={data.totalAppointments}
              color="#4361ee"
            />
            <StatCard
              label="Đã xác nhận"
              value={data.confirmedAppointments}
              color="#27ae60"
            />
            <StatCard
              label="Đã hủy"
              value={data.canceledCount}
              color="#e74c3c"
            />
            <StatCard
              label="Chờ thanh toán"
              value={data.pendingPaymentCount}
              color="#e67e22"
            />
            <StatCard
              label="Chờ phân công"
              value={data.waitingAssignCount}
              color="#f39c12"
            />
            <StatCard
              label="BASIC"
              value={data.basicCount ?? data.basicRevenue}
              color="#3498db"
            />
            <StatCard
              label="ADVANCED"
              value={data.advancedCount ?? data.advancedRevenue}
              color="#9b59b6"
            />
          </div>

          <SectionTitle>Doanh thu & Hồ sơ</SectionTitle>
          <div className="stat-grid">
            <StatCard
              label="Tổng doanh thu"
              value={Number(data.totalRevenue).toLocaleString("vi-VN") + " ₫"}
              color="#27ae60"
            />
            <StatCard
              label="Hồ sơ bệnh án"
              value={data.medicalRecords.total}
              color="#16a085"
            />
            <StatCard
              label="Tổng đánh giá"
              value={data.feedbacks.total}
              sub={
                data.feedbacks.avgRating
                  ? `Avg: ${data.feedbacks.avgRating} ★`
                  : null
              }
              color="#f39c12"
            />
          </div>

          <SectionTitle>Khách hàng tiềm năng (Top 5)</SectionTitle>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Khách hàng</th>
                  <th>Email</th>
                  <th>Tổng cuộc hẹn</th>
                  <th>Hoàn thành</th>
                  <th>Tỉ lệ hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.length ? (
                  topCustomers.map((customer, index) => {
                    const total = customer.totalAppointments || 0;
                    const completionRate = total
                      ? Math.round(((customer.completed || 0) / total) * 100)
                      : 0;

                    return (
                      <tr key={customer.customerId || index}>
                        <td>{index + 1}</td>
                        <td>{customer.fullName || "—"}</td>
                        <td>{customer.email || "—"}</td>
                        <td>
                          <strong>{total}</strong>
                        </td>
                        <td>{customer.completed ?? 0}</td>
                        <td>{completionRate}%</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="cell-empty">
                      Chưa có dữ liệu khách hàng tiềm năng.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 12,
            }}
          >
            <button
              className="btn btn-secondary"
              onClick={onViewCustomerDetails}
            >
              Xem chi tiết khách hàng
            </button>
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
  const revenueChartCanvasRef = useRef(null);
  const revenueChartRef = useRef(null);

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

  useEffect(() => {
    load();
  }, [filter]);

  const handleFilter = (key, val) => setFilter((f) => ({ ...f, [key]: val }));

  const total = data.reduce((s, r) => s + r.totalRevenue, 0);

  useEffect(() => {
    if (!revenueChartCanvasRef.current || !data.length) {
      if (revenueChartRef.current) {
        revenueChartRef.current.destroy();
        revenueChartRef.current = null;
      }
      return;
    }

    if (revenueChartRef.current) {
      revenueChartRef.current.destroy();
    }

    revenueChartRef.current = new Chart(revenueChartCanvasRef.current, {
      type: "bar",
      data: {
        labels: data.map((r) => formatPeriodLabel(r.period, filter.groupBy)),
        datasets: [
          {
            label: "Doanh thu (VNĐ)",
            data: data.map((r) => Number(r.totalRevenue) || 0),
            backgroundColor: "rgba(39,174,96,0.72)",
            borderColor: "#27ae60",
            borderWidth: 1.2,
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${Number(ctx.parsed.y).toLocaleString("vi-VN")} ₫`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#a09d97" },
          },
          y: {
            grid: { color: "rgba(0,0,0,0.06)" },
            ticks: { color: "#a09d97" },
          },
        },
      },
    });

    return () => {
      if (revenueChartRef.current) {
        revenueChartRef.current.destroy();
        revenueChartRef.current = null;
      }
    };
  }, [data, filter.groupBy]);

  return (
    <div>
      <DateFilter {...filter} onChange={handleFilter} />
      {loading ? (
        <Loading />
      ) : error ? (
        <Alert type="error">{error}</Alert>
      ) : (
        <>
          <div className="stat-card highlight-card">
            <span className="stat-sub">Tổng doanh thu kỳ đã chọn</span>
            <span className="stat-value" style={{ color: "#27ae60" }}>
              {total.toLocaleString("vi-VN")} ₫
            </span>
          </div>
          <div className="chart-wrap">
            <div className="chart-header">
              <span className="chart-title">Doanh thu theo kỳ (VNĐ)</span>
              <span className="chart-note">
                Nhóm theo {filter.groupBy === "month" ? "tháng" : "ngày"}
              </span>
            </div>
            <div className="chart-canvas-wrap">
              <canvas ref={revenueChartCanvasRef} />
            </div>
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
                {data.length ? (
                  data.map((r) => (
                    <tr key={r.period}>
                      <td>{formatPeriodLabel(r.period, filter.groupBy)}</td>
                      <td>{Number(r.totalRevenue).toLocaleString("vi-VN")}</td>
                      <td>{r.count}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="cell-empty">
                      Không có dữ liệu.
                    </td>
                  </tr>
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
  const statusCanvasRef = useRef(null);
  const typeCanvasRef = useRef(null);
  const statusChartRef = useRef(null);
  const typeChartRef = useRef(null);

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

  useEffect(() => {
    load();
  }, [filter]);

  const handleFilter = (key, val) => setFilter((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    if (!data.length || !statusCanvasRef.current || !typeCanvasRef.current) {
      if (statusChartRef.current) {
        statusChartRef.current.destroy();
        statusChartRef.current = null;
      }
      if (typeChartRef.current) {
        typeChartRef.current.destroy();
        typeChartRef.current = null;
      }
      return;
    }

    const labels = data.map((row) =>
      formatPeriodLabel(row.period, filter.groupBy),
    );
    const confirmed = [];
    const canceled = [];
    const pending = [];
    let basicTotal = 0;
    let advancedTotal = 0;

    data.forEach((row) => {
      const byStatus = {};
      const byType = {};
      row.breakdown.forEach((b) => {
        if (b.status) {
          byStatus[b.status] = (byStatus[b.status] || 0) + b.count;
        }
        if (b.type) {
          byType[b.type] = (byType[b.type] || 0) + b.count;
        }
      });
      confirmed.push(byStatus.CONFIRMED || 0);
      canceled.push(byStatus.CANCELED || 0);
      pending.push(byStatus.PENDING_PAYMENT || 0);
      basicTotal += byType.BASIC || 0;
      advancedTotal += byType.ADVANCED || 0;
    });

    if (statusChartRef.current) statusChartRef.current.destroy();
    if (typeChartRef.current) typeChartRef.current.destroy();

    statusChartRef.current = new Chart(statusCanvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Confirmed",
            data: confirmed,
            backgroundColor: "rgba(39,174,96,0.8)",
            borderRadius: 4,
          },
          {
            label: "Canceled",
            data: canceled,
            backgroundColor: "rgba(231,76,60,0.8)",
            borderRadius: 4,
          },
          {
            label: "Pending",
            data: pending,
            backgroundColor: "rgba(230,126,34,0.8)",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: "#a09d97" },
          },
          y: {
            stacked: true,
            grid: { color: "rgba(0,0,0,0.06)" },
            ticks: { color: "#a09d97" },
          },
        },
      },
    });

    typeChartRef.current = new Chart(typeCanvasRef.current, {
      type: "doughnut",
      data: {
        labels: ["BASIC", "ADVANCED"],
        datasets: [
          {
            data: [basicTotal, advancedTotal],
            backgroundColor: ["rgba(52,152,219,0.85)", "rgba(155,89,182,0.85)"],
            borderColor: ["#3498db", "#9b59b6"],
            borderWidth: 1.4,
            hoverOffset: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${ctx.parsed}`,
            },
          },
        },
      },
    });

    return () => {
      if (statusChartRef.current) {
        statusChartRef.current.destroy();
        statusChartRef.current = null;
      }
      if (typeChartRef.current) {
        typeChartRef.current.destroy();
        typeChartRef.current = null;
      }
    };
  }, [data, filter.groupBy]);

  return (
    <div>
      <DateFilter {...filter} onChange={handleFilter} />
      {loading ? (
        <Loading />
      ) : error ? (
        <Alert type="error">{error}</Alert>
      ) : (
        <>
          {data.length > 0 && (
            <div className="chart-grid-2">
              <div className="chart-wrap">
                <div className="chart-header">
                  <span className="chart-title">Cuộc hẹn theo trạng thái</span>
                </div>
                <div className="chart-canvas-wrap chart-canvas-wrap-tall">
                  <canvas ref={statusCanvasRef} />
                </div>
                <div className="chart-legend">
                  <span className="chart-legend-item">
                    <span className="chart-legend-dot chart-dot-confirmed" />
                    Confirmed
                  </span>
                  <span className="chart-legend-item">
                    <span className="chart-legend-dot chart-dot-canceled" />
                    Canceled
                  </span>
                  <span className="chart-legend-item">
                    <span className="chart-legend-dot chart-dot-pending" />
                    Pending
                  </span>
                </div>
              </div>

              <div className="chart-wrap">
                <div className="chart-header">
                  <span className="chart-title">Phân bổ gói dịch vụ</span>
                </div>
                <div className="chart-canvas-wrap chart-canvas-wrap-tall">
                  <canvas ref={typeCanvasRef} />
                </div>
                <div className="chart-legend">
                  <span className="chart-legend-item">
                    <span className="chart-legend-dot chart-dot-basic" />
                    BASIC
                  </span>
                  <span className="chart-legend-item">
                    <span className="chart-legend-dot chart-dot-advanced" />
                    ADVANCED
                  </span>
                </div>
              </div>
            </div>
          )}

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
                {data.length ? (
                  data.map((row) => {
                    const byStatus = {};
                    const byType = {};
                    row.breakdown.forEach((b) => {
                      if (b.status)
                        byStatus[b.status] =
                          (byStatus[b.status] || 0) + b.count;
                      if (b.type)
                        byType[b.type] = (byType[b.type] || 0) + b.count;
                    });
                    return (
                      <tr key={row.period}>
                        <td>{formatPeriodLabel(row.period, filter.groupBy)}</td>
                        <td>
                          <strong>{row.total}</strong>
                        </td>
                        <td>{byStatus.CONFIRMED ?? 0}</td>
                        <td>{byStatus.CANCELED ?? 0}</td>
                        <td>{byStatus.PENDING_PAYMENT ?? 0}</td>
                        <td>{byType.BASIC ?? 0}</td>
                        <td>{byType.ADVANCED ?? 0}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="cell-empty">
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
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
  const doctorsCanvasRef = useRef(null);
  const doctorsChartRef = useRef(null);

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

  useEffect(() => {
    load();
  }, [filter, page]);

  const handleFilter = (key, val) => {
    setPage(1);
    setFilter((f) => ({ ...f, [key]: val }));
  };

  const { data: doctors, metadata } = result;

  useEffect(() => {
    if (!doctorsCanvasRef.current || !doctors.length) {
      if (doctorsChartRef.current) {
        doctorsChartRef.current.destroy();
        doctorsChartRef.current = null;
      }
      return;
    }

    if (doctorsChartRef.current) {
      doctorsChartRef.current.destroy();
    }

    doctorsChartRef.current = new Chart(doctorsCanvasRef.current, {
      type: "bar",
      data: {
        labels: doctors.map((d) => d.fullName || "Không rõ"),
        datasets: [
          {
            label: "Tổng",
            data: doctors.map((d) => d.totalAppointments || 0),
            backgroundColor: "rgba(67,97,238,0.74)",
            borderRadius: 5,
          },
          {
            label: "Xác nhận",
            data: doctors.map((d) => d.confirmed || 0),
            backgroundColor: "rgba(39,174,96,0.74)",
            borderRadius: 5,
          },
          {
            label: "Hoàn thành",
            data: doctors.map((d) => d.completed || 0),
            backgroundColor: "rgba(52,152,219,0.74)",
            borderRadius: 5,
          },
          {
            label: "Hủy",
            data: doctors.map((d) => d.canceled || 0),
            backgroundColor: "rgba(231,76,60,0.74)",
            borderRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#a09d97" } },
          y: {
            grid: { color: "rgba(0,0,0,0.06)" },
            ticks: { color: "#a09d97" },
          },
        },
      },
    });

    return () => {
      if (doctorsChartRef.current) {
        doctorsChartRef.current.destroy();
        doctorsChartRef.current = null;
      }
    };
  }, [doctors]);

  return (
    <div>
      <DateFilter from={filter.from} to={filter.to} onChange={handleFilter} />
      {loading ? (
        <Loading />
      ) : error ? (
        <Alert type="error">{error}</Alert>
      ) : (
        <>
          {doctors.length > 0 && (
            <div className="doctor-perf-grid">
              {doctors.map((d) => {
                const total = d.totalAppointments || 0;
                const completionRate = total
                  ? Math.round(((d.completed || 0) / total) * 100)
                  : 0;
                const initials = getInitials(d.fullName);
                return (
                  <div className="doctor-perf-card" key={`card-${d.doctorId}`}>
                    <div className="doctor-perf-header">
                      <div className="doctor-avatar">{initials}</div>
                      <div>
                        <div className="doctor-name">{d.fullName || "—"}</div>
                        <div className="doctor-role">Bac si nhan khoa</div>
                      </div>
                    </div>
                    <div className="doctor-mini-stats">
                      <div className="doctor-mini-stat">
                        <div className="doctor-mini-stat-val">{total}</div>
                        <div className="doctor-mini-stat-lbl">Tong</div>
                      </div>
                      <div className="doctor-mini-stat">
                        <div
                          className="doctor-mini-stat-val"
                          style={{ color: "#27ae60" }}
                        >
                          {d.confirmed || 0}
                        </div>
                        <div className="doctor-mini-stat-lbl">Xac nhan</div>
                      </div>
                      <div className="doctor-mini-stat">
                        <div
                          className="doctor-mini-stat-val"
                          style={{ color: "#1d4ed8" }}
                        >
                          {d.completed || 0}
                        </div>
                        <div className="doctor-mini-stat-lbl">Hoan thanh</div>
                      </div>
                      <div className="doctor-mini-stat">
                        <div
                          className="doctor-mini-stat-val"
                          style={{ color: "#e74c3c" }}
                        >
                          {d.canceled || 0}
                        </div>
                        <div className="doctor-mini-stat-lbl">Da huy</div>
                      </div>
                    </div>
                    <div className="doctor-progress-label">
                      <span>Ty le hoan thanh</span>
                      <span>{completionRate}%</span>
                    </div>
                    <div className="doctor-progress-bg">
                      <div
                        className="doctor-progress-fill"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {doctors.length > 0 && (
            <div className="chart-wrap">
              <div className="chart-header">
                <span className="chart-title">So sanh hieu suat bac si</span>
              </div>
              <div className="chart-canvas-wrap">
                <canvas ref={doctorsCanvasRef} />
              </div>
              <div className="chart-legend">
                <span className="chart-legend-item">
                  <span className="chart-legend-dot chart-dot-total" />
                  Tong
                </span>
                <span className="chart-legend-item">
                  <span className="chart-legend-dot chart-dot-confirmed" />
                  Xac nhan
                </span>
                <span className="chart-legend-item">
                  <span className="chart-legend-dot chart-dot-completed" />
                  Hoan thanh
                </span>
                <span className="chart-legend-item">
                  <span className="chart-legend-dot chart-dot-canceled" />
                  Huy
                </span>
              </div>
            </div>
          )}

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
                {doctors.length ? (
                  doctors.map((d, i) => (
                    <tr key={d.doctorId}>
                      <td>{(page - 1) * limit + i + 1}</td>
                      <td>{d.fullName || "—"}</td>
                      <td>
                        <strong>{d.totalAppointments}</strong>
                      </td>
                      <td>{d.confirmed}</td>
                      <td>{d.completed}</td>
                      <td>{d.canceled}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="cell-empty">
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {metadata?.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </button>
              <span className="pagination-info">
                Trang {page}/{metadata.totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= metadata.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Customers Stats Tab ──────────────────────────────────────────────────────
function CustomersStatsTab() {
  const [result, setResult] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ from: "", to: "" });
  const limit = 10;
  const customersCanvasRef = useRef(null);
  const customersChartRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await statisticsService.getCustomers({
        from: filter.from || undefined,
        to: filter.to || undefined,
        page,
        limit,
      });
      setResult({
        data: res.data?.data || [],
        metadata: res.data?.metadata || {},
      });
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter, page]);

  const handleFilter = (key, val) => {
    setPage(1);
    setFilter((f) => ({ ...f, [key]: val }));
  };

  const { data: customers, metadata } = result;

  const totals = customers.reduce(
    (acc, c) => {
      acc.totalAppointments += c.totalAppointments || 0;
      acc.completed += c.completed || 0;
      acc.confirmed += c.confirmed || 0;
      return acc;
    },
    { totalAppointments: 0, completed: 0, confirmed: 0 },
  );

  useEffect(() => {
    if (!customersCanvasRef.current || !customers.length) {
      if (customersChartRef.current) {
        customersChartRef.current.destroy();
        customersChartRef.current = null;
      }
      return;
    }

    if (customersChartRef.current) {
      customersChartRef.current.destroy();
    }

    customersChartRef.current = new Chart(customersCanvasRef.current, {
      type: "bar",
      data: {
        labels: customers.map((c) => c.fullName || "Không rõ"),
        datasets: [
          {
            label: "Tổng cuộc hẹn",
            data: customers.map((c) => c.totalAppointments || 0),
            backgroundColor: "rgba(67,97,238,0.74)",
            borderRadius: 5,
          },
          {
            label: "Hoàn thành",
            data: customers.map((c) => c.completed || 0),
            backgroundColor: "rgba(52,152,219,0.74)",
            borderRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#a09d97" },
          },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0,0,0,0.06)" },
            ticks: { color: "#a09d97", precision: 0 },
          },
        },
      },
    });

    return () => {
      if (customersChartRef.current) {
        customersChartRef.current.destroy();
        customersChartRef.current = null;
      }
    };
  }, [customers]);

  return (
    <div>
      <DateFilter from={filter.from} to={filter.to} onChange={handleFilter} />
      {loading ? (
        <Loading />
      ) : error ? (
        <Alert type="error">{error}</Alert>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard
              label="Khách hàng trong trang"
              value={customers.length}
              color="#4361ee"
            />
            <StatCard
              label="Tổng cuộc hẹn"
              value={totals.totalAppointments}
              color="#2ecc71"
            />
            <StatCard
              label="Đã hoàn thành"
              value={totals.completed}
              color="#3498db"
            />
          </div>

          {customers.length > 0 && (
            <div className="chart-wrap">
              <div className="chart-header">
                <span className="chart-title">
                  So sánh tổng quan theo khách hàng
                </span>
              </div>
              <div className="chart-canvas-wrap">
                <canvas ref={customersCanvasRef} />
              </div>
              <div className="chart-legend">
                <span className="chart-legend-item">
                  <span className="chart-legend-dot chart-dot-total" />
                  Tông cuoc hen
                </span>
                <span className="chart-legend-item">
                  <span className="chart-legend-dot chart-dot-completed" />
                  Hoan thanh
                </span>
              </div>
            </div>
          )}

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Khách hàng</th>
                  <th>Email</th>
                  <th>Điện thoại</th>
                  <th>Tổng cuộc hẹn</th>
                  <th>Đã xác nhận</th>
                  <th>Hoàn thành</th>
                  <th>Đã hủy</th>
                  <th>Chờ thanh toán</th>
                  <th>Tỉ lệ hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {customers.length ? (
                  customers.map((c, i) => {
                    const total = c.totalAppointments || 0;
                    const completionRate = total
                      ? Math.round(((c.completed || 0) / total) * 100)
                      : 0;
                    return (
                      <tr key={c.customerId}>
                        <td>{(page - 1) * limit + i + 1}</td>
                        <td>{c.fullName || "—"}</td>
                        <td>{c.email || "—"}</td>
                        <td>{c.phone || "—"}</td>
                        <td>
                          <strong>{total}</strong>
                        </td>
                        <td>{c.confirmed ?? 0}</td>
                        <td>{c.completed ?? 0}</td>
                        <td>{c.canceled ?? 0}</td>
                        <td>{c.pendingPayment ?? 0}</td>
                        <td>{completionRate}%</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="cell-empty">
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {metadata?.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </button>
              <span className="pagination-info">
                Trang {metadata.currentPage || page}/{metadata.totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= metadata.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </button>
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

  useEffect(() => {
    load();
  }, [filter]);

  const handleFilter = (key, val) => setFilter((f) => ({ ...f, [key]: val }));
  const STAR_COLORS = [
    "",
    "#e74c3c",
    "#e67e22",
    "#f1c40f",
    "#2ecc71",
    "#27ae60",
  ];

  return (
    <div>
      <DateFilter from={filter.from} to={filter.to} onChange={handleFilter} />
      {loading ? (
        <Loading />
      ) : error ? (
        <Alert type="error">{error}</Alert>
      ) : (
        data && (
          <>
            <div className="stat-grid">
              <StatCard
                label="Tổng đánh giá"
                value={data.totalFeedbacks}
                color="#f39c12"
              />
              <StatCard
                label="Chưa review"
                value={data.unreviewedCount}
                color="#e74c3c"
              />
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
                const pct = data.totalFeedbacks
                  ? Math.round((count / data.totalFeedbacks) * 100)
                  : 0;
                return (
                  <div key={star} className="rating-bar-row">
                    <span
                      className="rating-star"
                      style={{ color: STAR_COLORS[star] }}
                    >
                      {star} ★
                    </span>
                    <div className="rating-bar-track">
                      <div
                        className="rating-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: STAR_COLORS[star],
                        }}
                      />
                    </div>
                    <span className="rating-count">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )
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
  const accountsCanvasRef = useRef(null);
  const accountsChartRef = useRef(null);

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

  useEffect(() => {
    load();
  }, [filter]);

  const handleFilter = (key, val) => setFilter((f) => ({ ...f, [key]: val }));

  const roleSummary = data.reduce(
    (acc, row) => {
      row.byRole.forEach((r) => {
        acc[r.role] = (acc[r.role] || 0) + r.count;
      });
      return acc;
    },
    { ADMIN: 0, CUSTOMER: 0, DOCTOR: 0, SALE_STAFF: 0, CUSTOMER_SUPPORT: 0 },
  );

  useEffect(() => {
    if (!accountsCanvasRef.current || !data.length) {
      if (accountsChartRef.current) {
        accountsChartRef.current.destroy();
        accountsChartRef.current = null;
      }
      return;
    }

    if (accountsChartRef.current) {
      accountsChartRef.current.destroy();
    }

    const labels = data.map((row) =>
      formatPeriodLabel(row.period, filter.groupBy),
    );
    const getRoleSeries = (role) =>
      data.map((row) => {
        const found = row.byRole.find((item) => item.role === role);
        return found?.count || 0;
      });

    accountsChartRef.current = new Chart(accountsCanvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Customer",
            data: getRoleSeries("CUSTOMER"),
            borderColor: "#3498db",
            backgroundColor: "rgba(52,152,219,0.08)",
            tension: 0.3,
            fill: true,
            pointRadius: 4,
          },
          {
            label: "Doctor",
            data: getRoleSeries("DOCTOR"),
            borderColor: "#9b59b6",
            backgroundColor: "rgba(155,89,182,0.08)",
            tension: 0.3,
            fill: true,
            pointRadius: 4,
          },
          {
            label: "Sale Staff",
            data: getRoleSeries("SALE_STAFF"),
            borderColor: "#e67e22",
            backgroundColor: "rgba(230,126,34,0.08)",
            tension: 0.3,
            fill: true,
            pointRadius: 4,
          },
          {
            label: "Support",
            data: getRoleSeries("CUSTOMER_SUPPORT"),
            borderColor: "#2ecc71",
            backgroundColor: "rgba(46,204,113,0.08)",
            tension: 0.3,
            fill: true,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#a09d97" } },
          y: {
            grid: { color: "rgba(0,0,0,0.06)" },
            ticks: { color: "#a09d97" },
          },
        },
      },
    });

    return () => {
      if (accountsChartRef.current) {
        accountsChartRef.current.destroy();
        accountsChartRef.current = null;
      }
    };
  }, [data, filter.groupBy]);

  return (
    <div>
      <DateFilter {...filter} onChange={handleFilter} />
      {loading ? (
        <Loading />
      ) : error ? (
        <Alert type="error">{error}</Alert>
      ) : (
        <>
          {data.length > 0 && (
            <div className="chart-wrap">
              <div className="chart-header">
                <span className="chart-title">Tai khoan dang ky theo ky</span>
                <span className="chart-note">
                  Nhom theo {filter.groupBy === "month" ? "thang" : "ngay"}
                </span>
              </div>
              <div className="chart-canvas-wrap">
                <canvas ref={accountsCanvasRef} />
              </div>
              <div className="chart-legend">
                <span className="chart-legend-item">
                  <span className="chart-legend-dot chart-dot-basic" />
                  Customer
                </span>
                <span className="chart-legend-item">
                  <span className="chart-legend-dot chart-dot-advanced" />
                  Doctor
                </span>
                <span className="chart-legend-item">
                  <span className="chart-legend-dot chart-dot-pending" />
                  Sale Staff
                </span>
                <span className="chart-legend-item">
                  <span className="chart-legend-dot chart-dot-confirmed" />
                  Support
                </span>
              </div>
            </div>
          )}

          <div className="accounts-stats-layout">
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
                  {data.length ? (
                    data.map((row) => {
                      const byRole = {};
                      row.byRole.forEach((r) => {
                        byRole[r.role] = r.count;
                      });
                      return (
                        <tr key={row.period}>
                          <td>
                            {formatPeriodLabel(row.period, filter.groupBy)}
                          </td>
                          <td>
                            <strong>{row.total}</strong>
                          </td>
                          <td>{byRole.CUSTOMER ?? 0}</td>
                          <td>{byRole.DOCTOR ?? 0}</td>
                          <td>{byRole.SALE_STAFF ?? 0}</td>
                          <td>{byRole.CUSTOMER_SUPPORT ?? 0}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="cell-empty">
                        Không có dữ liệu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {data.length > 0 && (
              <div className="role-summary-card">
                <h4 className="role-summary-title">Phan bo vai tro</h4>
                <div className="role-row">
                  <span className="role-row-left">
                    <span className="role-color-dot chart-dot-basic" />
                    <span className="role-row-name">Customer</span>
                  </span>
                  <span className="role-row-count">{roleSummary.CUSTOMER}</span>
                </div>
                <div className="role-row">
                  <span className="role-row-left">
                    <span className="role-color-dot chart-dot-advanced" />
                    <span className="role-row-name">Doctor</span>
                  </span>
                  <span className="role-row-count">{roleSummary.DOCTOR}</span>
                </div>
                <div className="role-row">
                  <span className="role-row-left">
                    <span className="role-color-dot chart-dot-pending" />
                    <span className="role-row-name">Sale Staff</span>
                  </span>
                  <span className="role-row-count">
                    {roleSummary.SALE_STAFF}
                  </span>
                </div>
                <div className="role-row">
                  <span className="role-row-left">
                    <span className="role-color-dot chart-dot-confirmed" />
                    <span className="role-row-name">Support</span>
                  </span>
                  <span className="role-row-count">
                    {roleSummary.CUSTOMER_SUPPORT}
                  </span>
                </div>
                <div className="role-row">
                  <span className="role-row-left">
                    <span className="role-color-dot chart-dot-dark" />
                    <span className="role-row-name">Admin</span>
                  </span>
                  <span className="role-row-count">{roleSummary.ADMIN}</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Account Manager Tab ─────────────────────────────────────────────────────
function AccountManagerTab() {
  const [result, setResult] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [createFieldErrors, setCreateFieldErrors] = useState({
    email: "",
    fullName: "",
    password: "",
  });
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    fullName: "",
    password: "",
    staffRole: "SALE_STAFF",
  });
  const [updatingId, setUpdatingId] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    role: "ALL",
    status: "ALL",
  });
  const [draft, setDraft] = useState(filters);
  const limit = 10;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAccountService.getAccounts({
        page,
        limit,
        search: filters.search || undefined,
        role: filters.role === "ALL" ? undefined : filters.role,
        status: filters.status === "ALL" ? undefined : filters.status,
      });
      setResult({
        data: res.data?.data || [],
        metadata: res.data?.metadata || {},
      });
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi tải danh sách tài khoản");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters, page]);

  const applyFilters = () => {
    setPage(1);
    setFilters(draft);
  };

  const validateCreateForm = (form) => {
    const email = form.email.trim();
    const fullName = form.fullName.trim().replaceAll(/\s+/g, " ");
    const password = form.password;
    const fieldErrors = {
      email: "",
      fullName: "",
      password: "",
    };

    if (!email) {
      fieldErrors.email = "Email là bắt buộc.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      fieldErrors.email = "Email không đúng định dạng.";
    }

    if (!fullName) {
      fieldErrors.fullName = "Họ tên là bắt buộc.";
    } else if (fullName.length < 2) {
      fieldErrors.fullName = "Họ tên phải có ít nhất 2 ký tự.";
    }

    if (!password) {
      fieldErrors.password = "Mật khẩu là bắt buộc.";
    } else if (password.length < 6) {
      fieldErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    const hasError = Object.values(fieldErrors).some(Boolean);
    return {
      hasError,
      fieldErrors,
      normalized: {
        email,
        fullName,
        password,
        staffRole: form.staffRole,
      },
    };
  };

  const handleCreateFormChange = (key, value) => {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
    setCreateFieldErrors((prev) => ({ ...prev, [key]: "" }));
    if (createSuccess) setCreateSuccess("");
  };

  const createAccount = async (e) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");

    const { hasError, fieldErrors, normalized } =
      validateCreateForm(createForm);
    setCreateFieldErrors(fieldErrors);

    if (hasError) {
      setCreateError("Vui lòng kiểm tra lại thông tin tài khoản mới.");
      return;
    }

    setCreating(true);
    try {
      await adminAccountService.createStaffAccount(normalized);
      setCreateSuccess("Tạo tài khoản thành công.");
      setCreateFieldErrors({ email: "", fullName: "", password: "" });
      setCreateForm((prev) => ({
        ...prev,
        email: "",
        fullName: "",
        password: "",
      }));

      if (page === 1) {
        load();
      } else {
        setPage(1);
      }
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      const firstFieldError =
        apiErrors && typeof apiErrors === "object"
          ? Object.values(apiErrors)[0]
          : "";
      setCreateError(
        firstFieldError ||
          err.response?.data?.message ||
          "Không thể tạo tài khoản mới",
      );
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (accountId, status) => {
    setUpdatingId(accountId);
    try {
      await adminAccountService.updateStatus(accountId, status);
      setResult((prev) => ({
        ...prev,
        data: prev.data.map((acc) =>
          acc._id === accountId ? { ...acc, status } : acc,
        ),
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Không thể cập nhật trạng thái");
    } finally {
      setUpdatingId("");
    }
  };

  const { data, metadata } = result;

  return (
    <div>
      <form className="filter-bar stats-filter" onSubmit={createAccount}>
        <label className="form-label" htmlFor="new-account-email">
          Email mới
        </label>
        <input
          id="new-account-email"
          className="form-input"
          type="email"
          value={createForm.email}
          placeholder="staff@example.com"
          autoComplete="email"
          required
          onChange={(e) => handleCreateFormChange("email", e.target.value)}
        />
        {createFieldErrors.email && (
          <span className="stat-sub" style={{ color: "#c0392b" }}>
            {createFieldErrors.email}
          </span>
        )}
        <label className="form-label" htmlFor="new-account-full-name">
          Họ tên
        </label>
        <input
          id="new-account-full-name"
          className="form-input"
          type="text"
          value={createForm.fullName}
          placeholder="Nguyễn Văn A"
          autoComplete="name"
          minLength={2}
          required
          onChange={(e) => handleCreateFormChange("fullName", e.target.value)}
        />
        {createFieldErrors.fullName && (
          <span className="stat-sub" style={{ color: "#c0392b" }}>
            {createFieldErrors.fullName}
          </span>
        )}
        <label className="form-label" htmlFor="new-account-password">
          Mật khẩu
        </label>
        <input
          id="new-account-password"
          className="form-input"
          type="password"
          value={createForm.password}
          placeholder="Tối thiểu 6 ký tự"
          autoComplete="new-password"
          minLength={6}
          required
          onChange={(e) => handleCreateFormChange("password", e.target.value)}
        />
        {createFieldErrors.password && (
          <span className="stat-sub" style={{ color: "#c0392b" }}>
            {createFieldErrors.password}
          </span>
        )}
        <label className="form-label" htmlFor="new-account-role">
          Vai trò staff
        </label>
        <select
          id="new-account-role"
          className="form-input"
          value={createForm.staffRole}
          onChange={(e) => handleCreateFormChange("staffRole", e.target.value)}
        >
          <option value="SALE_STAFF">SALE_STAFF</option>
          <option value="CUSTOMER_SUPPORT">CUSTOMER_SUPPORT</option>
          <option value="DOCTOR">DOCTOR</option>
        </select>
        <button className="btn btn-primary" type="submit" disabled={creating}>
          {creating ? "Đang tạo..." : "Thêm tài khoản"}
        </button>
      </form>

      {createError && <Alert type="error">{createError}</Alert>}
      {createSuccess && <Alert type="success">{createSuccess}</Alert>}

      <div className="filter-bar stats-filter">
        <label className="form-label" htmlFor="account-search-input">
          Tìm email
        </label>
        <input
          id="account-search-input"
          className="form-input"
          type="text"
          value={draft.search}
          placeholder="Nhập email"
          onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
        />
        <label className="form-label" htmlFor="account-role-select">
          Vai trò
        </label>
        <select
          id="account-role-select"
          className="form-input"
          value={draft.role}
          onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
        >
          <option value="ALL">Tất cả</option>
          <option value="ADMIN">ADMIN</option>
          <option value="SALE_STAFF">SALE_STAFF</option>
          <option value="CUSTOMER_SUPPORT">CUSTOMER_SUPPORT</option>
          <option value="DOCTOR">DOCTOR</option>
          <option value="CUSTOMER">CUSTOMER</option>
        </select>
        <label className="form-label" htmlFor="account-status-select">
          Trạng thái
        </label>
        <select
          id="account-status-select"
          className="form-input"
          value={draft.status}
          onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
        >
          <option value="ALL">Tất cả</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="PENDING">PENDING</option>
          <option value="REJECTED">REJECTED</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>
        <button className="btn btn-primary" onClick={applyFilters}>
          Lọc
        </button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Email</th>
                  <th>Họ tên</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Verified</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {data.length ? (
                  data.map((acc, i) => (
                    <tr key={acc._id}>
                      <td>{(page - 1) * limit + i + 1}</td>
                      <td>{acc.email}</td>
                      <td>{acc.fullName || "—"}</td>
                      <td>
                        <span
                          className={`badge ${getRoleBadgeClass(
                            acc.role?.name,
                          )}`.trim()}
                        >
                          {acc.role?.name || "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${getStatusBadgeClass(acc.status)}`.trim()}
                        >
                          {acc.status}
                        </span>
                      </td>
                      <td>{acc.isVerified ? "Yes" : "No"}</td>
                      <td>
                        {acc.createdAt
                          ? new Date(acc.createdAt).toLocaleDateString("vi-VN")
                          : "—"}
                      </td>
                      <td>
                        <div className="action-group">
                          {acc.status !== "ACTIVE" && (
                            <button
                              className="btn btn-secondary"
                              disabled={updatingId === acc._id}
                              onClick={() => updateStatus(acc._id, "ACTIVE")}
                            >
                              Kích hoạt
                            </button>
                          )}
                          {acc.status !== "SUSPENDED" && (
                            <button
                              className="btn btn-secondary"
                              disabled={updatingId === acc._id}
                              onClick={() => updateStatus(acc._id, "SUSPENDED")}
                            >
                              Tạm khóa
                            </button>
                          )}
                          {acc.status !== "INACTIVE" && (
                            <button
                              className="btn btn-danger"
                              disabled={updatingId === acc._id}
                              onClick={() => updateStatus(acc._id, "INACTIVE")}
                            >
                              Vô hiệu
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="cell-empty">
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {metadata?.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </button>
              <span className="pagination-info">
                Trang {metadata.currentPage || page}/{metadata.totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= metadata.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </button>
            </div>
          )}
        </>
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
  { id: "customers", label: "Khách hàng" },
  { id: "feedbacks", label: "Đánh giá" },
  { id: "accounts", label: "Tài khoản" },
  { id: "account-manager", label: "QL tài khoản" },
];

export function AdminStatisticsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="page statistics-page">
      <PageHeader
        title="📊 Thống kê — Admin Dashboard"
        action={<span className="header-pill">Admin</span>}
      />

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
        {activeTab === "overview" && (
          <OverviewTab
            onViewCustomerDetails={() => setActiveTab("customers")}
          />
        )}
        {activeTab === "revenue" && <RevenueTab />}
        {activeTab === "appointments" && <AppointmentsStatsTab />}
        {activeTab === "doctors" && <DoctorsStatsTab />}
        {activeTab === "customers" && <CustomersStatsTab />}
        {activeTab === "feedbacks" && <FeedbackStatsTab />}
        {activeTab === "accounts" && <AccountsStatsTab />}
        {activeTab === "account-manager" && <AccountManagerTab />}
      </div>
    </div>
  );
}
