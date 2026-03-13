import React, { useEffect, useState, useCallback } from "react";
import { degreeService, getUploadFullUrl } from "../services";
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

export default function ManageDegreesDoctor() {
    /* ── list state ── */
    const [degrees, setDegrees] = useState([]);
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
    const [formName, setFormName] = useState("");
    const [degreeFile, setDegreeFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    /* ── degree name suggestions ── */
    const [degreeNames, setDegreeNames] = useState([]);

    /* ── toast ── */
    const [toast, setToast] = useState(null);
    const notify = (message, type = "success") => setToast({ message, type });

    /* ── fetch list ── */
    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await degreeService.getMyDegrees({
                page,
                limit,
                search: search || undefined,
                status: filterStatus || undefined,
                sortBy,
                order,
            });
            setDegrees(data.data ?? []);
            setPagination(data.metadata ?? {});
        } catch (err) {
            notify(err.response?.data?.message || "Không tải được danh sách bằng cấp", "error");
        } finally {
            setLoading(false);
        }
    }, [page, search, filterStatus, sortBy, order]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    /* ── fetch name suggestions ── */
    useEffect(() => {
        degreeService.getAllNames().then(({ data }) => {
            setDegreeNames(data.data ?? []);
        }).catch(() => { });
    }, []);

    /* ── Add ── */
    const handleAdd = async () => {
        if (!formName.trim() || !degreeFile) {
            notify("Vui lòng nhập tên bằng cấp và chọn file", "error");
            return;
        }
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("name", formName.trim());
            fd.append("file", degreeFile);
            await degreeService.addDegree(fd);
            notify("Thêm bằng cấp thành công. Đang chờ duyệt.");
            setAddOpen(false);
            setFormName("");
            setDegreeFile(null);
            fetchList();
        } catch (err) {
            notify(err.response?.data?.message || "Thêm bằng cấp thất bại", "error");
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Open detail ── */
    const openDetail = async (degree) => {
        try {
            const { data } = await degreeService.getDegreeDetail(degree._id);
            setSelected(data.data ?? degree);
        } catch {
            setSelected(degree);
        }
        setDetailOpen(true);
    };

    /* ── Open edit ── */
    const openEdit = (degree) => {
        setSelected(degree);
        setFormName(degree.name || "");
        setDegreeFile(null);
        setDetailOpen(false);
        setEditOpen(true);
    };

    /* ── Edit ── */
    const handleEdit = async () => {
        if (!formName.trim()) {
            notify("Vui lòng nhập tên bằng cấp", "error");
            return;
        }
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("name", formName.trim());
            if (degreeFile) fd.append("file", degreeFile);
            await degreeService.updateDegree(selected._id, fd);
            notify("Cập nhật bằng cấp thành công. Đang chờ duyệt.");
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
            await degreeService.deleteDegree(selected._id);
            notify("Đã xóa bằng cấp.");
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
                title="Quản lý bằng cấp"
                action={
                    <button
                        className="btn btn-primary px-4 py-2 text-sm"
                        onClick={() => { setFormName(""); setDegreeFile(null); setAddOpen(true); }}
                    >
                        + Thêm bằng cấp
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
                        placeholder="Tìm theo tên bằng cấp..."
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
            {loading && !degrees.length ? (
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
                                        Tên bằng cấp<SortIcon field="name" />
                                    </th>
                                    <th className="text-left px-4 py-3">Trạng thái</th>
                                    <th
                                        className="text-left px-4 py-3 cursor-pointer select-none"
                                        onClick={() => toggleSort("createdAt")}
                                    >
                                        Ngày thêm<SortIcon field="createdAt" />
                                    </th>
                                    <th className="text-left px-4 py-3">Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody>
                                {degrees.length ? (
                                    degrees.map((deg, idx) => (
                                        <tr
                                            key={deg._id}
                                            className="border-b hover:bg-gray-50 cursor-pointer"
                                            onClick={() => openDetail(deg)}
                                        >
                                            <td className="px-4 py-3 text-gray-500">{(page - 1) * limit + idx + 1}</td>
                                            <td className="px-4 py-3 font-medium text-blue-700 hover:underline">{deg.name}</td>
                                            <td className="px-4 py-3"><Badge status={deg.status} /></td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {deg.createdAt ? new Date(deg.createdAt).toLocaleDateString("vi-VN") : "—"}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">{deg.note || "—"}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                            Chưa có bằng cấp nào.
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
            <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Thêm bằng cấp mới">
                <DegreeForm
                    name={formName}
                    setName={setFormName}
                    file={degreeFile}
                    setFile={setDegreeFile}
                    suggestions={degreeNames}
                />
                <div className="flex justify-end gap-2 pt-3">
                    <button className="btn btn-secondary px-4 py-2 text-sm" onClick={() => setAddOpen(false)}>Hủy</button>
                    <button className="btn btn-primary px-4 py-2 text-sm" onClick={handleAdd} disabled={submitting}>
                        {submitting ? "Đang lưu..." : "Thêm"}
                    </button>
                </div>
            </Modal>

            {/* ── Detail Modal ── */}
            <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Chi tiết bằng cấp">
                {selected && (
                    <div className="space-y-3 text-sm">
                        <div><span className="text-gray-500">Tên:</span> <strong>{selected.name}</strong></div>
                        <div><span className="text-gray-500">Trạng thái:</span> <Badge status={selected.status} /></div>
                        <div><span className="text-gray-500">Ngày thêm:</span>{" "}
                            {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("vi-VN") : "—"}
                        </div>
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
                                    📎 Xem file bằng cấp
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
            <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Cập nhật bằng cấp">
                <DegreeForm
                    name={formName}
                    setName={setFormName}
                    file={degreeFile}
                    setFile={setDegreeFile}
                    suggestions={degreeNames}
                    isEdit
                />
                <div className="flex justify-end gap-2 pt-3">
                    <button className="btn btn-secondary px-4 py-2 text-sm" onClick={() => setEditOpen(false)}>Hủy</button>
                    <button className="btn btn-primary px-4 py-2 text-sm" onClick={handleEdit} disabled={submitting}>
                        {submitting ? "Đang lưu..." : "Cập nhật"}
                    </button>
                </div>
            </Modal>

            {/* ── Delete Modal ── */}
            <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Xác nhận xóa">
                <p className="text-sm text-gray-700 mb-4">
                    Bạn có chắc muốn xóa bằng cấp <strong>{selected?.name}</strong>?
                    Hành động này sẽ chuyển trạng thái thành <em>OUTOFDATE</em>.
                </p>
                <div className="flex justify-end gap-2">
                    <button className="btn btn-secondary px-4 py-2 text-sm" onClick={() => setDeleteOpen(false)}>Hủy</button>
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

/* ─── Degree form fields ─── */
function DegreeForm({ name, setName, file, setFile, suggestions, isEdit = false }) {
    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm text-gray-600 mb-1">Tên bằng cấp *</label>
                <input
                    className="form-input w-full border rounded px-3 py-2 text-sm"
                    list="degree-names"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Tiến sĩ Y khoa, Bác sĩ nội trú..."
                />
                {suggestions.length > 0 && (
                    <datalist id="degree-names">
                        {suggestions.map((n) => <option key={n} value={n} />)}
                    </datalist>
                )}
            </div>
            <div>
                <label className="block text-sm text-gray-600 mb-1">
                    File bằng cấp {isEdit ? "(để trống nếu không thay đổi)" : "*"}
                </label>
                <input
                    type="file"
                    accept="image/*,.pdf"
                    className="text-sm"
                    onChange={(e) => setFile(e.target.files[0] || null)}
                />
                {file && <p className="text-xs text-gray-500 mt-1">{file.name}</p>}
            </div>
        </div>
    );
}
