import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { appointmentService, doctorService } from "../services";
import { Loading, Alert } from "../components/UI";

const STATUS_COLORS = {
  WAITING_ASSIGN: "#F4C0D1",
  PENDING_PAYMENT: "#FAC775",
  CONFIRMED: "#B5D4F4",
  COMPLETED: "#D3D1C7",
  CANCELED: "#b91c1c",
};

const STATUS_TEXT_COLORS = {
  WAITING_ASSIGN: "#72243E",
  PENDING_PAYMENT: "#633806",
  CONFIRMED: "#0C447C",
  COMPLETED: "#444441",
  CANCELED: "#e5e7eb",
};

const STATUS_LABELS = {
  WAITING_ASSIGN: "Chờ phân công",
  PENDING_PAYMENT: "Chờ thanh toán",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Đã hoàn thành",
  CANCELED: "Đã hủy",
};

export function StaffApprovalHistory() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Fetch doctors list on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await doctorService.getList({ limit: 100 });
        setDoctors(res.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      }
    };
    fetchDoctors();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit,
      };
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterType !== "all") params.type = filterType;
      if (filterDoctor) params.doctorId = filterDoctor;
      if (filterCustomer) params.customerSearch = filterCustomer;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const response = await appointmentService.getMyApprovalHistory(params);
      const data = response.data;

      setApprovals(data?.data || []);

      // Calculate total pages from metadata
      if (data?.metadata) {
        const total = Math.ceil(data.metadata.totalItems / limit);
        setTotalPages(total);
      }
    } catch (err) {
      console.error("Failed to fetch approval history:", err);
      setError(
        err.response?.data?.message || "Failed to load approval history",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchApprovals();
  }, [
    user,
    page,
    filterStatus,
    filterType,
    filterDoctor,
    filterCustomer,
    fromDate,
    toDate,
  ]);

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAppointmentDate = (appointment) => {
    const startTime = appointment.slotId?.startTime;
    if (!startTime) return "N/A";
    return new Date(startTime).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleResetFilters = () => {
    setFilterStatus("all");
    setFilterType("all");
    setFilterDoctor("");
    setFilterCustomer("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  if (!user) {
    return <Alert type="warning">Please log in to view approval history</Alert>;
  }

  return (
    <div className="page approval-history-page max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Lịch sử duyệt lịch hẹn</h2>
      {/* <p className="text-sm text-gray-600 mb-4">
        Luu y: lich hen ADVANCED khong qua buoc sale staff duyet, vi vay lich su
        nay chu yeu la BASIC.
      </p> */}

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3">
          <div>
            <label
              htmlFor="customer-filter"
              className="block text-xs font-medium mb-1"
            >
              Khách hàng
            </label>
            <input
              id="customer-filter"
              type="text"
              placeholder="Tìm tên/email"
              value={filterCustomer}
              onChange={(e) => {
                setFilterCustomer(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label
              htmlFor="doctor-filter"
              className="block text-xs font-medium mb-1"
            >
              Bác sĩ
            </label>
            <select
              id="doctor-filter"
              value={filterDoctor}
              onChange={(e) => {
                setFilterDoctor(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
            >
              <option value="">Tất cả bác sĩ</option>
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* <div>
            <label htmlFor="type-filter" className="block text-xs font-medium mb-1">
              Loại
            </label>
            <select
              id="type-filter"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
            >
              <option value="all">Tất cả loại</option>
              <option value="BASIC">Basic</option>
            </select>
          </div> */}

          <div>
            <label
              htmlFor="status-filter"
              className="block text-xs font-medium mb-1"
            >
              Trạng thái
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
            >
              <option value="all">Tất cả</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="WAITING_ASSIGN">Chờ phân công</option>
              <option value="PENDING_PAYMENT">Chờ thanh toán</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELED">Hủy</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="from-date"
              className="block text-xs font-medium mb-1"
            >
              Từ ngày
            </label>
            <input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label htmlFor="to-date" className="block text-xs font-medium mb-1">
              Đến ngày
            </label>
            <input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">&nbsp;</label>
            <button
              onClick={handleResetFilters}
              className="w-full px-2 py-1 text-sm bg-gray-400 text-white rounded-md hover:bg-gray-500 transition font-medium"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <Loading />
      ) : approvals.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Không có lịch sử duyệt nào</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-sm">
                  Mã lịch
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm">
                  Khách hàng
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm">
                  Bác sĩ
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center text-sm">
                  Loại
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm">
                  Ngày lịch
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center text-sm">
                  Trạng thái
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm">
                  Duyệt lúc
                </th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((apt) => (
                <tr key={apt._id} className="hover:bg-gray-50 text-sm">
                  <td className="border border-gray-300 px-3 py-2 font-mono">
                    {apt._id?.slice(0, 8)}...
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <div>
                      <p className="font-medium">
                        {apt.customerId?.fullName || "N/A"}
                      </p>
                      <p className="text-xs text-gray-600">
                        {apt.customerId?.accountId?.email || ""}
                      </p>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {apt.doctorId?.fullName || "Chưa phân công"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs font-medium">
                      {apt.type === "BASIC" ? "Basic" : "Advanced"}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs">
                    {formatAppointmentDate(apt)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <span
                      style={{
                        background: STATUS_COLORS[apt.status] || "#eee",
                        color: STATUS_TEXT_COLORS[apt.status] || "#333",
                        padding: "3px 6px",
                        borderRadius: "3px",
                        fontSize: "11px",
                        fontWeight: "500",
                        display: "inline-block",
                      }}
                    >
                      {STATUS_LABELS[apt.status] || apt.status}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs">
                    {formatDate(apt.approvedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {approvals.length > 0 && (
        <div className="mt-6 flex justify-center items-center gap-3">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm bg-gray-300 text-black rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed transition"
          >
            ← Trước
          </button>

          <span className="text-sm font-medium">
            Trang {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 text-sm bg-gray-300 text-black rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed transition"
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}
