import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { certificateService, getUploadFullUrl } from "../services";
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

/* ─── Blank form ─── */
const blankForm = () => ({ name: "", issuedBy: "", issueDate: "" });

export default function ManageCertificatesDoctor() {
    const navigate = useNavigate();

    /* ── list state ── */
    const [certs, setCerts] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [order, setOrder] = useState("desc");
    const limit = 10;

    /* ── modal state ── */
    const [addOpen, setAddOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selected, setSelected] = useState(null);

    /* ── form state ── */
    const [form, setForm] = useState(blankForm());
    const [certFile, setCertFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    /* ── toast ── */
    const [toast, setToast] = useState(null);
    const notify = (message, type = "success") => setToast({ message, type });

    /* ── fetch ── */
    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await certificateService.getMyCertificates({
                page,
                limit,
                search: search || undefined,
                status: filterStatus || undefined,
                sortBy,
                order,
            });
            setCerts(data.data ?? []);
            setPagination(data.metadata ?? {});
        } catch (err) {
            notify(err.response?.data?.message || "Không tải được danh sách chứng chỉ", "error");
        } finally {
            setLoading(false);
        }
    }, [page, search, filterStatus, sortBy, order]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    /* ── Add ── */
    const handleAdd = async () => {
        if (!form.name.trim() || !form.issuedBy.trim() || !form.issueDate || !certFile) {
            notify("Vui lòng điền đầy đủ thông tin và chọn file", "error");
            return;
        }
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("name", form.name.trim());
            fd.append("issuedBy", form.issuedBy.trim());
            fd.append("issueDate", form.issueDate);
            fd.append("file", certFile);
            await certificateService.addCertificate(fd);
            notify("Thêm chứng chỉ thành công. Đang chờ duyệt.");
            setAddOpen(false);
            setForm(blankForm());
            setCertFile(null);
            fetchList();
        } catch (err) {
            notify(err.response?.data?.message || "Thêm chứng chỉ thất bại", "error");
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Open detail ── */
    const openDetail = async (cert) => {
        try {
            const { data } = await certificateService.getCertificateDetail(cert._id);
            setSelected(data.data ?? cert);
        } catch {
            setSelected(cert);
        }
        setDetailOpen(true);
    };

    /* ── Open edit ── */
    const openEdit = (cert) => {
        setSelected(cert);
        setForm({
            name: cert.name || "",
            issuedBy: cert.issuedBy || "",
            issueDate: cert.issueDate ? cert.issueDate.slice(0, 10) : "",
        });
        setCertFile(null);
        setDetailOpen(false);
        setEditOpen(true);
    };

    /* ── Edit ── */
    const handleEdit = async () => {
        if (!form.name.trim() || !form.issuedBy.trim() || !form.issueDate) {
            notify("Vui lòng điền đầy đủ thông tin", "error");
            return;
        }
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("name", form.name.trim());
            fd.append("issuedBy", form.issuedBy.trim());
            fd.append("issueDate", form.issueDate);
            if (certFile) fd.append("file", certFile);
            await certificateService.updateCertificate(selected._id, fd);
            notify("Cập nhật chứng chỉ thành công. Đang chờ duyệt.");
            setEditOpen(false);
            setSelected(null);
            fetchList();
        } catch (err) {
            notify(err.response?.data?.message || "Cập nhật thất bại", "error");
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Delete ── */
    const handleDelete = async () => {
        if (!selected) return;
        setSubmitting(true);
        try {
            await certificateService.deleteCertificate(selected._id);
            notify("Đã xóa chứng chỉ.");
            setDeleteOpen(false);
            setSelected(null);
            fetchList();
        } catch (err) {
            notify(err.response?.data?.message || "Xóa thất bại", "error");
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
        <div className="page" style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1rem" }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <PageHeader
                backTo="/profile"
                backLabel="← Hồ sơ"
                title="Quản lý chứng chỉ"
                action={
                    <button
                        className="btn btn-primary px-4 py-2 text-sm"
                        onClick={() => { setForm(blankForm()); setCertFile(null); setAddOpen(true); }}
                    >
                        + Thêm chứng chỉ
                    </button>
                }
            />

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
                        placeholder="Tìm theo tên chứng chỉ..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <button type="submit" className="btn btn-secondary text-sm px-3 py-2">
                        Tìm
                    </button>
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
            {loading && !certs.length ? (
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
                                        Tên chứng chỉ<SortIcon field="name" />
                                    </th>
                                    <th className="text-left px-4 py-3">Cấp bởi</th>
                                    <th
                                        className="text-left px-4 py-3 cursor-pointer select-none"
                                        onClick={() => toggleSort("issueDate")}
                                    >
                                        Ngày cấp<SortIcon field="issueDate" />
                                    </th>
                                    <th className="text-left px-4 py-3">Trạng thái</th>
                                    <th
                                        className="text-left px-4 py-3 cursor-pointer select-none"
                                        onClick={() => toggleSort("createdAt")}
                                    >
                                        Ngày thêm<SortIcon field="createdAt" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {certs.length ? (
                                    certs.map((cert, idx) => (
                                        <tr
                                            key={cert._id}
                                            className="border-b hover:bg-gray-50 cursor-pointer"
                                            onClick={() => openDetail(cert)}
                                        >
                                            <td className="px-4 py-3 text-gray-500">{(page - 1) * limit + idx + 1}</td>
                                            <td className="px-4 py-3 font-medium text-blue-700 hover:underline">{cert.name}</td>
                                            <td className="px-4 py-3 text-gray-600">{cert.issuedBy}</td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString("vi-VN") : "—"}
                                            </td>
                                            <td className="px-4 py-3"><Badge status={cert.status} /></td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {cert.createdAt ? new Date(cert.createdAt).toLocaleDateString("vi-VN") : "—"}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                                            Chưa có chứng chỉ nào.
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

            {/* ── Add Modal ── */}
            <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Thêm chứng chỉ mới">
                <CertForm form={form} setForm={setForm} certFile={certFile} setCertFile={setCertFile} />
                <div className="flex justify-end gap-2 pt-3">
                    <button className="btn btn-secondary px-4 py-2 text-sm" onClick={() => setAddOpen(false)}>
                        Hủy
                    </button>
                    <button className="btn btn-primary px-4 py-2 text-sm" onClick={handleAdd} disabled={submitting}>
                        {submitting ? "Đang lưu..." : "Thêm"}
                    </button>
                </div>
            </Modal>

            {/* ── Detail Modal ── */}
            <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Chi tiết chứng chỉ">
                {selected && (
                    <div className="space-y-3 text-sm">
                        <div><span className="text-gray-500">Tên:</span> <strong>{selected.name}</strong></div>
                        <div><span className="text-gray-500">Cấp bởi:</span> {selected.issuedBy}</div>
                        <div><span className="text-gray-500">Ngày cấp:</span>{" "}
                            {selected.issueDate ? new Date(selected.issueDate).toLocaleDateString("vi-VN") : "—"}
                        </div>
                        <div><span className="text-gray-500">Trạng thái:</span> <Badge status={selected.status} /></div>
                        {selected.note && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-yellow-800">
                                <span className="font-medium">Ghi chú từ reviewer:</span> {selected.note}
                            </div>
                        )}
                        {selected.reviewedBy && (
                            <div><span className="text-gray-500">Người duyệt:</span> {selected.reviewedBy?.fullName || "—"}</div>
                        )}
                        {selected.reviewedAt && (
                            <div><span className="text-gray-500">Ngày duyệt:</span>{" "}
                                {new Date(selected.reviewedAt).toLocaleDateString("vi-VN")}
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
                                    📎 Xem file chứng chỉ
                                </a>
                            </div>
                        )}
                        <div className="flex gap-2 pt-3">
                            <button
                                className="btn btn-secondary px-4 py-2 text-sm"
                                onClick={() => openEdit(selected)}
                            >
                                ✏️ Sửa
                            </button>
                            <button
                                className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
                                onClick={() => { setDetailOpen(false); setDeleteOpen(true); }}
                            >
                                🗑️ Xóa
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── Edit Modal ── */}
            <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Cập nhật chứng chỉ">
                <CertForm form={form} setForm={setForm} certFile={certFile} setCertFile={setCertFile} isEdit />
                <div className="flex justify-end gap-2 pt-3">
                    <button className="btn btn-secondary px-4 py-2 text-sm" onClick={() => setEditOpen(false)}>
                        Hủy
                    </button>
                    <button className="btn btn-primary px-4 py-2 text-sm" onClick={handleEdit} disabled={submitting}>
                        {submitting ? "Đang lưu..." : "Cập nhật"}
                    </button>
                </div>
            </Modal>

            {/* ── Delete Modal ── */}
            <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Xác nhận xóa">
                <p className="text-sm text-gray-700 mb-4">
                    Bạn có chắc muốn xóa chứng chỉ <strong>{selected?.name}</strong>?
                    Hành động này sẽ chuyển trạng thái thành <em>OUTOFDATE</em>.
                </p>
                <div className="flex justify-end gap-2">
                    <button className="btn btn-secondary px-4 py-2 text-sm" onClick={() => setDeleteOpen(false)}>
                        Hủy
                    </button>
                    <button
                        className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
                        onClick={handleDelete}
                        disabled={submitting}
                    >
                        {submitting ? "Đang xóa..." : "Xóa"}
                    </button>
                </div>
            </Modal>
        </div>
    );
}

/* ─── Cert form fields (shared between Add and Edit) ─── */
function CertForm({ form, setForm, certFile, setCertFile, isEdit = false }) {
    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm text-gray-600 mb-1">Tên chứng chỉ *</label>
                <input
                    className="form-input w-full border rounded px-3 py-2 text-sm"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
            </div>
            <div>
                <label className="block text-sm text-gray-600 mb-1">Cấp bởi *</label>
                <input
                    className="form-input w-full border rounded px-3 py-2 text-sm"
                    value={form.issuedBy}
                    onChange={(e) => setForm((p) => ({ ...p, issuedBy: e.target.value }))}
                />
            </div>
            <div>
                <label className="block text-sm text-gray-600 mb-1">Ngày cấp *</label>
                <input
                    type="date"
                    className="form-input w-full border rounded px-3 py-2 text-sm"
                    value={form.issueDate}
                    onChange={(e) => setForm((p) => ({ ...p, issueDate: e.target.value }))}
                />
            </div>
            <div>
                <label className="block text-sm text-gray-600 mb-1">
                    File chứng chỉ {isEdit ? "(để trống nếu không thay đổi)" : "*"}
                </label>
                <input
                    type="file"
                    accept="image/*,.pdf"
                    className="text-sm"
                    onChange={(e) => setCertFile(e.target.files[0] || null)}
                />
                {certFile && <p className="text-xs text-gray-500 mt-1">{certFile.name}</p>}
            </div>
        </div>
    );
}
