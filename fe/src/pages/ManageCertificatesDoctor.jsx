import React, { useEffect, useState, useCallback } from "react";
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

const IMAGE_EXT_REGEX = /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i;

/* ─── Blank form ─── */
const blankForm = () => ({ name: "", issuedBy: "", issueDate: "" });

export default function ManageCertificatesDoctor() {
    /* ── list state ── */
    const [certs, setCerts] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
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
                search: debouncedSearch || undefined,
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
    }, [page, debouncedSearch, filterStatus, sortBy, order]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

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
        if (cert.status === "PENDING") {
            notify("Chứng chỉ đang ở trạng thái PENDING nên không thể cập nhật", "error");
            return;
        }

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
        if (selected?.status === "PENDING") {
            notify("Chứng chỉ đang ở trạng thái PENDING nên không thể cập nhật", "error");
            return;
        }

        if (!form.name.trim() || !form.issuedBy.trim() || !form.issueDate) {
            notify("Vui lòng điền đầy đủ thông tin", "error");
            return;
        }

        if (certFile) {
            const isImageType = certFile.type?.startsWith("image/");
            const isImageExt = IMAGE_EXT_REGEX.test(certFile.name || "");
            if (!isImageType || !isImageExt) {
                notify("Khi cập nhật chỉ được upload file ảnh (jpg, jpeg, png, webp, gif, bmp, svg)", "error");
                return;
            }
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

    const totalPages = pagination.totalPages ?? 1;

    return (
        <div className="page" style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1rem" }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <PageHeader
                backTo="/profile"
                backLabel="← Hồ sơ"
                title="Quản lý chứng chỉ"
                action={
                    <div className="ml-auto flex justify-end mb-5">
                        <button
                            className="btn btn-primary px-5 py-2 text-sm font-semibold shadow"
                            onClick={() => { setForm(blankForm()); setCertFile(null); setAddOpen(true); }}
                        >
                            + Thêm chứng chỉ
                        </button>
                    </div>
                }
            />

            {/* ── Filters ── */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex-1 min-w-[220px]">
                    <input
                        className="form-input border rounded px-3 py-2 text-sm w-full"
                        placeholder="Tìm theo tên chứng chỉ..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
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
                <select
                    className="border rounded px-3 py-2 text-sm"
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                >
                    <option value="createdAt">Sắp xếp: Ngày thêm</option>
                    <option value="name">Sắp xếp: Tên chứng chỉ</option>
                    <option value="issueDate">Sắp xếp: Ngày cấp</option>
                </select>
                <select
                    className="border rounded px-3 py-2 text-sm"
                    value={order}
                    onChange={(e) => { setOrder(e.target.value); setPage(1); }}
                >
                    <option value="desc">Mới nhất trước</option>
                    <option value="asc">Cũ nhất trước</option>
                </select>
            </div>

            {/* ── Card Grid ── */}
            {loading && !certs.length ? (
                <Loading />
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {certs.length ? (
                            certs.map((cert) => {
                                const fileUrl = getUploadFullUrl(cert.fileUrl);
                                const isImage = /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(cert.fileUrl || "");

                                return (
                                    <article
                                        key={cert._id}
                                        className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => openDetail(cert)}
                                    >
                                        <div className="h-44 bg-gray-100">
                                            {isImage ? (
                                                <img
                                                    src={fileUrl}
                                                    alt={cert.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                                    <span className="text-4xl mb-2">📄</span>
                                                    <span className="text-xs">File PDF / Document</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-semibold text-gray-800 line-clamp-2">{cert.name}</h3>
                                                <Badge status={cert.status} />
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Cấp bởi:</span> {cert.issuedBy}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Ngày cấp:</span>{" "}
                                                {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString("vi-VN") : "—"}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Ngày thêm: {cert.createdAt ? new Date(cert.createdAt).toLocaleDateString("vi-VN") : "—"}
                                            </p>
                                        </div>
                                    </article>
                                );
                            })
                        ) : (
                            <div className="col-span-full bg-white rounded-xl shadow border border-gray-100 px-4 py-10 text-center text-gray-400">
                                Chưa có chứng chỉ nào.
                            </div>
                        )}
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
                        {selected.fileUrl && (
                            <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                                {/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(selected.fileUrl) ? (
                                    <img
                                        src={getUploadFullUrl(selected.fileUrl)}
                                        alt={selected.name}
                                        className="w-full h-64 object-contain bg-white"
                                    />
                                ) : (
                                    <iframe
                                        src={getUploadFullUrl(selected.fileUrl)}
                                        title={selected.name}
                                        className="w-full h-64 bg-white"
                                    />
                                )}
                            </div>
                        )}
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
                                    Mở file ở tab mới
                                </a>
                            </div>
                        )}
                        <div className="flex gap-2 pt-3">
                            <button
                                className={`btn px-4 py-2 text-sm ${selected.status === "PENDING"
                                    ? "btn-secondary opacity-50 cursor-not-allowed"
                                    : "btn-secondary"
                                    }`}
                                onClick={() => openEdit(selected)}
                                disabled={selected.status === "PENDING"}
                                title={selected.status === "PENDING" ? "Chứng chỉ đang chờ duyệt, không thể sửa" : "Sửa chứng chỉ"}
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
                <CertForm
                    form={form}
                    setForm={setForm}
                    certFile={certFile}
                    setCertFile={setCertFile}
                    isEdit
                    currentCert={selected}
                />
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
function CertForm({ form, setForm, certFile, setCertFile, isEdit = false, currentCert = null }) {
    const [newFilePreview, setNewFilePreview] = useState(null);

    useEffect(() => {
        if (!certFile) {
            setNewFilePreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(certFile);
        setNewFilePreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [certFile]);

    const existingFileUrl = currentCert?.fileUrl ? getUploadFullUrl(currentCert.fileUrl) : null;
    const existingIsImage = IMAGE_EXT_REGEX.test(currentCert?.fileUrl || "");
    const newIsImage = certFile?.type?.startsWith("image/");

    const handleFileChange = (e) => {
        const file = e.target.files[0] || null;
        if (!file) {
            setCertFile(null);
            return;
        }

        if (isEdit) {
            const isImageType = file.type?.startsWith("image/");
            const isImageExt = IMAGE_EXT_REGEX.test(file.name || "");
            if (!isImageType || !isImageExt) {
                setCertFile(null);
                e.target.value = "";
                window.alert("Chỉ được chọn file ảnh khi cập nhật chứng chỉ (jpg, jpeg, png, webp, gif, bmp, svg).");
                return;
            }
        }

        setCertFile(file);
    };

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
                    onChange={handleFileChange}
                />
                {certFile && <p className="text-xs text-gray-500 mt-1">{certFile.name}</p>}
            </div>

            {isEdit && (
                <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                        {certFile ? "Xem trước file mới" : "File hiện tại"}
                    </p>

                    <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                        {certFile ? (
                            newIsImage ? (
                                <img
                                    src={newFilePreview}
                                    alt="preview new certificate"
                                    className="w-full h-56 object-contain bg-white"
                                />
                            ) : (
                                <div className="w-full h-40 flex items-center justify-center text-gray-500 bg-white">
                                    Đã chọn file mới: {certFile.name}
                                </div>
                            )
                        ) : existingFileUrl ? (
                            existingIsImage ? (
                                <img
                                    src={existingFileUrl}
                                    alt={currentCert?.name || "current certificate"}
                                    className="w-full h-56 object-contain bg-white"
                                />
                            ) : (
                                <iframe
                                    src={existingFileUrl}
                                    title={currentCert?.name || "current certificate"}
                                    className="w-full h-56 bg-white"
                                />
                            )
                        ) : (
                            <div className="w-full h-40 flex items-center justify-center text-gray-400 bg-white">
                                Chưa có file để xem trước
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
