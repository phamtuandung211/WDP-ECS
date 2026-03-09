import React, { useEffect, useState, useCallback } from "react";
import { specializationService } from "../services";
import { Loading, Alert } from "../components/UI";
import { PageHeader } from "../components/PageHeader";
import { Pagination } from "../components/Pagination";

/* ───────── tiny toast helper ───────── */
function Toast({ message, type = "success", onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
    }, [onClose]);

    const bg =
        type === "success"
            ? "bg-green-600"
            : type === "error"
                ? "bg-red-600"
                : "bg-blue-600";

    return (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-lg text-white shadow-lg ${bg}`}>
            {message}
        </div>
    );
}

/* ───────── modal wrapper ───────── */
function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl leading-none"
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

/* ═══════════════════════════════════════════
   Main page
   ═══════════════════════════════════════════ */
export function ManageSpecializations() {
    /* ── list state ── */
    const [specializations, setSpecializations] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");

    /* ── modal state ── */
    const [createOpen, setCreateOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [updateOpen, setUpdateOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selected, setSelected] = useState(null);

    /* ── form state ── */
    const [formName, setFormName] = useState("");
    const [submitting, setSubmitting] = useState(false);

    /* ── toast ── */
    const [toast, setToast] = useState(null);
    const notify = (message, type = "success") => setToast({ message, type });

    const limit = 10;

    /* ── fetch ── */
    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await specializationService.getAllSpecializations({
                page,
                limit,
                search: search || undefined,
                sortBy,
                sortOrder,
            });
            setSpecializations(data.data ?? []);
            setPagination(data.pagination ?? {});
        } catch {
            notify("Không tải được danh sách chuyên khoa", "error");
        } finally {
            setLoading(false);
        }
    }, [page, search, sortBy, sortOrder]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    /* ── handlers ── */
    const handleCreate = async () => {
        if (!formName.trim()) return;
        setSubmitting(true);
        try {
            await specializationService.createSpecialization({ name: formName.trim() });
            notify("Tạo chuyên khoa thành công!");
            setCreateOpen(false);
            setFormName("");
            fetchList();
        } catch (err) {
            notify(err.response?.data?.message || "Tạo chuyên khoa thất bại", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!formName.trim() || !selected) return;
        setSubmitting(true);
        try {
            await specializationService.updateSpecialization(selected._id, {
                name: formName.trim(),
            });
            notify("Cập nhật chuyên khoa thành công!");
            setUpdateOpen(false);
            setFormName("");
            setSelected(null);
            fetchList();
        } catch (err) {
            notify(err.response?.data?.message || "Cập nhật chuyên khoa thất bại", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selected) return;
        setSubmitting(true);
        try {
            await specializationService.deleteSpecialization(selected._id);
            notify("Xóa chuyên khoa thành công!");
            setDeleteOpen(false);
            setSelected(null);
            fetchList();
        } catch (err) {
            notify(err.response?.data?.message || "Xóa chuyên khoa thất bại", "error");
        } finally {
            setSubmitting(false);
        }
    };

    /* ── open modals ── */
    const openDetail = async (spec) => {
        try {
            const { data } = await specializationService.getById(spec._id);
            setSelected(data.data ?? spec);
        } catch {
            setSelected(spec);
        }
        setDetailOpen(true);
    };

    const openUpdate = (spec) => {
        setSelected(spec);
        setFormName(spec.name);
        setUpdateOpen(true);
    };

    const openDelete = (spec) => {
        setSelected(spec);
        setDeleteOpen(true);
    };

    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }
        setPage(1);
    };

    const SortIcon = ({ field }) => {
        if (sortBy !== field) return <span className="ml-1 text-gray-300">↕</span>;
        return <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>;
    };

    const totalPages = pagination.totalPages ?? 1;

    if (loading && specializations.length === 0) return <Loading />;

    return (
        <div className="page manage-specialization-page">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <PageHeader
                backTo="/staff/dashboard"
                backLabel="← Dashboard"
                title="Quản lý chuyên khoa"
                action={
                    <button
                        className="btn btn-primary px-4 py-2    text-sm"
                        onClick={() => {
                            setFormName("");
                            setCreateOpen(true);
                        }}
                    >
                        + Tạo chuyên khoa
                    </button>
                }
            />

            {/* ── Search & Sort bar ── */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <form
                    className="search-form flex-1 min-w-[200px]"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setPage(1);
                        setSearch(e.target.search?.value?.trim() ?? "");
                    }}
                >
                    <input
                        type="text"
                        name="search"
                        className="form-input search-input"
                        placeholder="Tìm theo tên chuyên khoa..."
                        defaultValue={search}
                    />
                    <button type="submit" className="btn btn-secondary">
                        Tìm kiếm
                    </button>
                </form>
            </div>

            {/* ── Table ── */}
            <div className="table-wrap">
                <table className="data-table w-full">
                    <thead>
                        <tr>
                            <th className="text-left">#</th>
                            <th className="text-left cursor-pointer select-none" onClick={() => toggleSort("name")}>
                                Tên chuyên khoa<SortIcon field="name" />
                            </th>
                            <th className="text-left cursor-pointer select-none" onClick={() => toggleSort("createdAt")}>
                                Ngày tạo<SortIcon field="createdAt" />
                            </th>
                            <th className="text-center w-[120px]">Chức năng</th>
                        </tr>
                    </thead>
                    <tbody>
                        {specializations.length ? (
                            specializations.map((spec, idx) => (
                                <tr key={spec._id}>
                                    <td>{(page - 1) * limit + idx + 1}</td>
                                    <td>{spec.name}</td>
                                    <td>
                                        {spec.createdAt
                                            ? new Date(spec.createdAt).toLocaleDateString("vi-VN")
                                            : "—"}
                                    </td>
                                    <td>
                                        <div className="flex items-center justify-center gap-3">
                                            {/* View detail */}
                                            <button
                                                title="Xem chi tiết"
                                                className="text-blue-600 hover:text-blue-800"
                                                onClick={() => openDetail(spec)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            {/* Update */}
                                            <button
                                                title="Cập nhật"
                                                className="text-yellow-600 hover:text-yellow-800"
                                                onClick={() => openUpdate(spec)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            {/* Delete */}
                                            <button
                                                title="Xóa"
                                                className="text-red-600 hover:text-red-800"
                                                onClick={() => openDelete(spec)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="cell-empty text-center py-6">
                                    Chưa có chuyên khoa nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Pagination ── */}
            <Pagination
                page={page}
                totalPages={totalPages}
                total={pagination.totalItems}
                onPrev={() => setPage((p) => p - 1)}
                onNext={() => setPage((p) => p + 1)}
            />

            {/* ═══════ CREATE MODAL ═══════ */}
            <Modal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Tạo chuyên khoa mới"
            >
                <div className="space-y-4">
                    <div>
                        <label className="form-label block mb-1">Tên chuyên khoa</label>
                        <input
                            className="form-input w-full"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="Nhập tên chuyên khoa..."
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setCreateOpen(false)}
                            disabled={submitting}
                        >
                            Hủy
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleCreate}
                            disabled={submitting || !formName.trim()}
                        >
                            {submitting ? "Đang tạo..." : "Tạo"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ═══════ DETAIL MODAL ═══════ */}
            <Modal
                open={detailOpen}
                onClose={() => {
                    setDetailOpen(false);
                    setSelected(null);
                }}
                title="Chi tiết chuyên khoa"
            >
                {selected && (
                    <div className="space-y-3 text-sm">
                        <div>
                            <span className="font-semibold text-gray-600">ID: </span>
                            <span>{selected._id}</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-600">Tên: </span>
                            <span>{selected.name}</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-600">Người tạo: </span>
                            <span>
                                {selected.createdBy?.fullName ?? selected.createdBy ?? "—"}
                            </span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-600">Ngày tạo: </span>
                            <span>
                                {selected.createdAt
                                    ? new Date(selected.createdAt).toLocaleString("vi-VN")
                                    : "—"}
                            </span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-600">Cập nhật lần cuối: </span>
                            <span>
                                {selected.updatedAt
                                    ? new Date(selected.updatedAt).toLocaleString("vi-VN")
                                    : "—"}
                            </span>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setDetailOpen(false);
                                    setSelected(null);
                                }}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ═══════ UPDATE MODAL ═══════ */}
            <Modal
                open={updateOpen}
                onClose={() => {
                    setUpdateOpen(false);
                    setFormName("");
                    setSelected(null);
                }}
                title="Cập nhật chuyên khoa"
            >
                <div className="space-y-4">
                    <div>
                        <label className="form-label block mb-1">Tên chuyên khoa</label>
                        <input
                            className="form-input w-full"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="Nhập tên chuyên khoa..."
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setUpdateOpen(false);
                                setFormName("");
                                setSelected(null);
                            }}
                            disabled={submitting}
                        >
                            Hủy
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleUpdate}
                            disabled={submitting || !formName.trim()}
                        >
                            {submitting ? "Đang cập nhật..." : "Cập nhật"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ═══════ DELETE CONFIRM MODAL ═══════ */}
            <Modal
                open={deleteOpen}
                onClose={() => {
                    setDeleteOpen(false);
                    setSelected(null);
                }}
                title="Xác nhận xóa"
            >
                <div className="space-y-4">
                    <p className="text-gray-700">
                        Bạn có chắc chắn muốn xóa chuyên khoa{" "}
                        <strong>"{selected?.name}"</strong> không?
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setDeleteOpen(false);
                                setSelected(null);
                            }}
                            disabled={submitting}
                        >
                            Hủy
                        </button>
                        <button
                            className="btn btn-primary bg-red-600 hover:bg-red-700"
                            onClick={handleDelete}
                            disabled={submitting}
                        >
                            {submitting ? "Đang xóa..." : "Xóa"}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default ManageSpecializations;
