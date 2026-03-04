import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { medicalRecordService } from "../services";
import { Loading, Alert, Button } from "../components/UI";
import { PageHeader } from "../components/PageHeader";
import { Pagination } from "../components/Pagination";

const STATUS_LABEL = {
  PENDING_PAYMENT: "Chờ thanh toán",
  WAITING_ASSIGN: "Chờ phân công",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Hoàn thành",
  CANCELED: "Đã hủy",
};

// ─── Customer: xem lịch sử bệnh án của mình ──────────────────────────────────
function MyMedicalRecords() {
  const [result, setResult] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
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

  return (
    <div>
      {error && <Alert type="error">{error}</Alert>}

      {selected ? (
        <RecordDetail record={selected} onBack={() => setSelected(null)} />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Bác sĩ</th>
                  <th>Chẩn đoán</th>
                  <th>Triệu chứng</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {records.length ? (
                  records.map((r) => (
                    <tr key={r._id}>
                      <td>{new Date(r.createdAt).toLocaleDateString("vi-VN")}</td>
                      <td>{r.doctorId?.fullName || "—"}</td>
                      <td className="cell-desc">{r.diagnosis}</td>
                      <td className="cell-desc">{r.symptoms}</td>
                      <td>
                        <button
                          className="btn-link"
                          onClick={() => setSelected(r)}
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="cell-empty">
                      Chưa có hồ sơ bệnh án nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={metadata?.totalPages ?? 1}
            total={metadata?.totalItems}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </div>
  );
}

// ─── Staff/CS/Admin: xem tất cả hồ sơ ───────────────────────────────────────
function AllMedicalRecords() {
  const [result, setResult] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
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

  return (
    <div>
      {error && <Alert type="error">{error}</Alert>}

      {selected ? (
        <RecordDetail record={selected} onBack={() => setSelected(null)} />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Bệnh nhân</th>
                  <th>Bác sĩ</th>
                  <th>Chẩn đoán</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {records.length ? (
                  records.map((r) => (
                    <tr key={r._id}>
                      <td>{new Date(r.createdAt).toLocaleDateString("vi-VN")}</td>
                      <td>{r.customerId?.fullName || "—"}</td>
                      <td>{r.doctorId?.fullName || "—"}</td>
                      <td className="cell-desc">{r.diagnosis}</td>
                      <td>
                        <button
                          className="btn-link"
                          onClick={() => setSelected(r)}
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="cell-empty">
                      Không có hồ sơ nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={metadata?.totalPages ?? 1}
            total={metadata?.totalItems}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </div>
  );
}

// ─── Chi tiết 1 hồ sơ bệnh án ────────────────────────────────────────────────
function RecordDetail({ record, onBack }) {
  return (
    <div className="card record-detail">
      <button className="btn btn-secondary mb-3" onClick={onBack}>
        ← Quay lại
      </button>
      <h3 className="section-title">Chi tiết hồ sơ bệnh án</h3>
      <div className="detail-grid">
        <div className="detail-item">
          <span className="detail-label">Ngày khám</span>
          <span>{new Date(record.createdAt).toLocaleString("vi-VN")}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Bác sĩ</span>
          <span>{record.doctorId?.fullName || "—"}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Bệnh nhân</span>
          <span>{record.customerId?.fullName || "—"}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Triệu chứng</span>
          <span>{record.symptoms}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Chẩn đoán</span>
          <span>{record.diagnosis}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Đơn thuốc</span>
          <span>{record.prescription}</span>
        </div>
        {record.notes && (
          <div className="detail-item">
            <span className="detail-label">Ghi chú</span>
            <span>{record.notes}</span>
          </div>
        )}
        {record.aiSummary && (
          <div className="detail-item">
            <span className="detail-label">AI Summary</span>
            <span>{record.aiSummary}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function MedicalRecordsPage() {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <div className="page medical-records-page">
      <PageHeader title="Hồ sơ bệnh án" />

      {role === "CUSTOMER" && <MyMedicalRecords />}
      {(role === "SALE_STAFF" || role === "CUSTOMER_SUPPORT" || role === "ADMIN") && (
        <AllMedicalRecords />
      )}
      {role === "DOCTOR" && <AllMedicalRecords />}
      {!role && <Alert type="warning">Vui lòng đăng nhập để xem hồ sơ bệnh án.</Alert>}
    </div>
  );
}
