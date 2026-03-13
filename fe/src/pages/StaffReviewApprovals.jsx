import React, { useEffect, useState, useCallback } from "react";
import { manageCertificateService, manageDegreeService, getUploadFullUrl } from "../services";
import { Loading } from "../components/UI";
import { PageHeader } from "../components/PageHeader";
import { Pagination } from "../components/Pagination";

/* ─── Toast ─── */
function Toast({ message, type = "success", onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
    }, [onClose]);
    const bg =
        type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-blue-600";
    return (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-lg text-white shadow-lg ${bg}`}>
            {message}
        </div>
    );
}

/* ─── Modal ─── */
function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 relative max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl"
                    onClick={onClose}
                >
                    &times;
                </button>
                <h2 className="text-xl font-semibold mb-4">{title}</h2>
                {children}
            </div>
        </div>
    );
}

/* ─── Status badge ─── */
const STATUS_COLOR = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    OUTOFDATE: "bg-gray-100 text-gray-600",
};
function Badge({ status }) {
    return (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[status] ?? "bg-gray-100 text-gray-600"}`}>
            {status}
        </span>
    );
}

const STATUS_LABEL = {
    PENDING: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    OUTOFDATE: "Hết hạn",
};

/* ══════════════════════════════════════
   Generic list panel (reused for certs & degrees)
═══════════════════════════════════════ */
function ReviewPanel({ type }) {
    const isCert = type === "certificate";

    /* ── list state ── */
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [filterStatus, setFilterStatus] = useState("PENDING");
    const [sortBy, setSortBy] = useState("createdAt");
    const [order, setOrder] = useState("desc");
    const limit = 10;

    /* ── review modal ── */
    const [reviewOpen, setReviewOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [action, setAction] = useState("APPROVED");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    /* ── toast ── */
    const [toast, setToast] = useState(null);
    const notify = (message, type2 = "success") => setToast({ message, type: type2 });

    /* ── fetch ── */
    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit,
                search: search || undefined,
                status: filterStatus || undefined,
                sortBy,
                order,
            };
            const { data } = isCert
                ? await manageCertificateService.getAllCertificates(params)
                : await manageDegreeService.getAllDegrees(params);
            setItems(data.data ?? []);
            setPagination(data.metadata ?? {});
        } catch (err) {
            notify(err.response?.data?.message || `Không tải được danh sách ${isCert ? "chứng chỉ" : "bằng cấp"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [page, search, filterStatus, sortBy, order, isCert]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    /* ── Review submit ── */
    const handleReview = async () => {
        if (!selected) return;
        setSubmitting(true);
        try {
            if (isCert) {
                await manageCertificateService.reviewCertificate(selected._id, { action, note: note || undefined });
            } else {
                await manageDegreeService.reviewDegree(selected._id, { action, note: note || undefined });
            }
            notify(`${isCert ? "Chứng chỉ" : "Bằng cấp"} đã được ${action === "APPROVED" ? "duyệt" : "từ chối"} thành công.`);
            setReviewOpen(false);
            setSelected(null);
            setNote("");
            fetchList();
        } catch (err) {
            notify(err.response?.data?.message || "Thao tác thất bại", "error");
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Sort ── */
    const toggleSort = (field) => {
        if (sortBy === field) {
            setOrder((p) => (p === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(field);
            setOrder("desc");
        }
        setPage(1);
    };
    const SortIcon = ({ field }) => {
        if (sortBy !== field) return <span className="ml-1 text-gray-300">↕</span>;
        return <span className="ml-1">{order === "asc" ? "↑" : "↓"}</span>;
    };

    const totalPages = pagination.totalPages ?? 1;

    return (
        <div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* ── Filters ── */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <form
                    className="flex gap-2 flex-1 min-w-[220px]"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setPage(1);
                        setSearch(searchInput.trim());
                    }}
                >
                    <input
                        className="form-input border rounded px-3 py-2 text-sm flex-1"
                        placeholder={`Tìm theo tên ${isCert ? "chứng chỉ" : "bằng cấp"}...`}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <button type="submit" className="btn btn-secondary text-sm px-3 py-2">Tìm</button>
                </form>
                <select
                    className="border rounded px-3 py-2 text-sm"
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                >
                    <option value="">Tất cả trạng thái</option>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>
            </div>

            {/* ── Table ── */}
            {loading && !items.length ? (
                <Loading />
            ) : (
                <>
                    <div className="bg-white rounded-xl shadow overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-4 py-3 w-10">#</th>
                                    <th
                                        className="text-left px-4 py-3 cursor-pointer select-none"
                                        onClick={() => toggleSort("name")}
                                    >
                                        {isCert ? "Tên chứng chỉ" : "Tên bằng cấp"}<SortIcon field="name" />
                                    </th>
                                    <th className="text-left px-4 py-3">Bác sĩ</th>
                                    {isCert && <th className="text-left px-4 py-3">Cấp bởi</th>}
                                    <th className="text-left px-4 py-3">Trạng thái</th>
                                    <th
                                        className="text-left px-4 py-3 cursor-pointer select-none"
                                        onClick={() => toggleSort("createdAt")}
                                    >
                                        Ngày gửi<SortIcon field="createdAt" />
                                    </th>
                                    {filterStatus !== "PENDING" && (
                                        <th className="text-left px-4 py-3">Người duyệt</th>
                                    )}
                                    <th className="text-center px-4 py-3 w-28">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length ? (
                                    items.map((item, idx) => (
                                        <tr key={item._id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-500">{(page - 1) * limit + idx + 1}</td>
                                            <td className="px-4 py-3 font-medium">{item.name}</td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {item.doctorId?.fullName || "—"}
                                            </td>
                                            {isCert && (
                                                <td className="px-4 py-3 text-gray-600">{item.issuedBy}</td>
                                            )}
                                            <td className="px-4 py-3"><Badge status={item.status} /></td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "—"}
                                            </td>
                                            {filterStatus !== "PENDING" && (
                                                <td className="px-4 py-3 text-gray-500">
                                                    {item.reviewedBy?.fullName || "—"}
                                                </td>
                                            )}
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* View detail */}
                                                    <button
                                                        title="Xem chi tiết"
                                                        className="text-blue-600 hover:text-blue-800"
                                                        onClick={() => { setSelected(item); setDetailOpen(true); }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    {/* Review (only for PENDING) */}
                                                    {item.status === "PENDING" && (
                                                        <button
                                                            title="Duyệt / Từ chối"
                                                            className="text-green-600 hover:text-green-800"
                                                            onClick={() => {
                                                                setSelected(item);
                                                                setAction("APPROVED");
                                                                setNote("");
                                                                setReviewOpen(true);
                                                            }}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isCert ? 8 : 7} className="px-4 py-8 text-center text-gray-400">
                                            Không có dữ liệu.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-4">
                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                total={pagination.totalItems}
                                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                            />
                        </div>
                    )}
                </>
            )}

            {/* ── Detail Modal ── */}
            <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Chi tiết">
                {selected && (
                    <div className="space-y-3 text-sm">
                        <div><span className="text-gray-500">Tên:</span> <strong>{selected.name}</strong></div>
                        <div><span className="text-gray-500">Bác sĩ:</span> {selected.doctorId?.fullName || "—"}</div>
                        {isCert && (
                            <>
                                <div><span className="text-gray-500">Cấp bởi:</span> {selected.issuedBy}</div>
                                <div>
                                    <span className="text-gray-500">Ngày cấp:</span>{" "}
                                    {selected.issueDate ? new Date(selected.issueDate).toLocaleDateString("vi-VN") : "—"}
                                </div>
                            </>
                        )}
                        <div><span className="text-gray-500">Trạng thái:</span> <Badge status={selected.status} /></div>
                        <div>
                            <span className="text-gray-500">Ngày gửi:</span>{" "}
                            {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("vi-VN") : "—"}
                        </div>
                        {selected.reviewedBy && (
                            <div><span className="text-gray-500">Người duyệt:</span> {selected.reviewedBy?.fullName || "—"}</div>
                        )}
                        {selected.reviewedAt && (
                            <div>
                                <span className="text-gray-500">Ngày duyệt:</span>{" "}
                                {new Date(selected.reviewedAt).toLocaleDateString("vi-VN")}
                            </div>
                        )}
                        {selected.note && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-yellow-800">
                                <span className="font-medium">Ghi chú:</span> {selected.note}
                            </div>
                        )}
                        {selected.fileUrl && (
                            <div>
                                <a
                                    href={getUploadFullUrl(selected.fileUrl)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline text-sm"
                                >
                                    📎 Xem file
                                </a>
                            </div>
                        )}
                        {selected.status === "PENDING" && (
                            <div className="pt-2">
                                <button
                                    className="btn btn-primary px-4 py-2 text-sm"
                                    onClick={() => {
                                        setDetailOpen(false);
                                        setAction("APPROVED");
                                        setNote("");
                                        setReviewOpen(true);
                                    }}
                                >
                                    ✅ Duyệt / Từ chối
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* ── Review Modal ── */}
            <Modal
                open={reviewOpen}
                onClose={() => setReviewOpen(false)}
                title={`Duyệt ${isCert ? "chứng chỉ" : "bằng cấp"}: ${selected?.name}`}
            >
                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-500 mb-2">Bác sĩ: <strong>{selected?.doctorId?.fullName}</strong></p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setAction("APPROVED")}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${action === "APPROVED"
                                ? "bg-green-600 text-white border-green-600"
                                : "bg-white text-gray-700 border-gray-300 hover:border-green-400"
                                }`}
                        >
                            ✅ Duyệt
                        </button>
                        <button
                            type="button"
                            onClick={() => setAction("REJECTED")}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${action === "REJECTED"
                                ? "bg-red-600 text-white border-red-600"
                                : "bg-white text-gray-700 border-gray-300 hover:border-red-400"
                                }`}
                        >
                            ✖️ Từ chối
                        </button>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">
                            Ghi chú {action === "REJECTED" ? "(bắt buộc khi từ chối)" : "(tùy chọn)"}
                        </label>
                        <textarea
                            className="form-input w-full border rounded px-3 py-2 text-sm"
                            rows={3}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Nhập lý do hoặc ghi chú..."
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button className="btn btn-secondary px-4 py-2 text-sm" onClick={() => setReviewOpen(false)}>
                            Hủy
                        </button>
                        <button
                            className={`px-4 py-2 text-sm rounded text-white ${action === "APPROVED" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                            onClick={handleReview}
                            disabled={submitting || (action === "REJECTED" && !note.trim())}
                        >
                            {submitting ? "Đang xử lý..." : action === "APPROVED" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

/* ══════════════════════════════════════
   Main page
═══════════════════════════════════════ */
export default function StaffReviewApprovals() {
    const [tab, setTab] = useState("certificate"); // "certificate" | "degree"

    return (
        <div className="page" style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1rem" }}>
            <PageHeader
                backTo="/staff/dashboard"
                backLabel="← Dashboard"
                title="Duyệt chứng chỉ & bằng cấp bác sĩ"
            />

            {/* Tab selector */}
            <div className="flex gap-0 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
                <button
                    onClick={() => setTab("certificate")}
                    className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${tab === "certificate"
                        ? "bg-white shadow text-blue-700"
                        : "text-gray-600 hover:text-gray-900"
                        }`}
                >
                    📜 Chứng chỉ
                </button>
                <button
                    onClick={() => setTab("degree")}
                    className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${tab === "degree"
                        ? "bg-white shadow text-blue-700"
                        : "text-gray-600 hover:text-gray-900"
                        }`}
                >
                    🎓 Bằng cấp
                </button>
            </div>

            {tab === "certificate" && <ReviewPanel key="cert" type="certificate" />}
            {tab === "degree" && <ReviewPanel key="deg" type="degree" />}
        </div>
    );
}
