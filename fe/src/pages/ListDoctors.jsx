import { useEffect, useState } from "react";
import DoctorCard from "../components/doctor/DoctorCard.jsx";
import {
    doctorService,
    specializationService,
    degreeService,
} from "../services/index.js";

const DoctorListPage = () => {
    const [doctors, setDoctors] = useState([]);
    const [specializations, setSpecializations] = useState([]);
    const [degrees, setDegrees] = useState([]);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({
        search: "",
        specialization: "",
        degree: "",
        sortByExperience: "",
        page: 1,
        limit: 8,
    });

    const [metadata, setMetadata] = useState({
        totalPages: 1,
    });

    // ================= FETCH FILTER DATA =================
    useEffect(() => {
        fetchFilterData();
    }, []);

    const fetchFilterData = async () => {
        try {
            const [specRes, degRes] = await Promise.all([
                specializationService.getAll(),
                degreeService.getAllNames(),
            ]);

            setSpecializations(specRes.data.data);
            setDegrees(degRes.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    // ================= FETCH DOCTORS =================
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchDoctors();
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [filters]);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const res = await doctorService.getAllDoctor(filters);
            setDoctors(res.data.data);
            setMetadata(res.data.metadata);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // ================= HANDLERS =================
    const handleChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            page: 1,
        }));
    };

    const handleReset = () => {
        setFilters({
            search: "",
            specialization: "",
            degree: "",
            sortByExperience: "",
            page: 1,
            limit: 8,
        });
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > metadata.totalPages) return;
        setFilters((prev) => ({ ...prev, page: newPage }));
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Banner */}
            <div className="w-full bg-blue-600 py-16">
                <div className="container mx-auto px-6">
                    <h1 className="text-3xl font-bold text-white uppercase">
                        Đội ngũ chuyên gia
                    </h1>
                </div>
            </div>

            {/* Filter Section */}
            <div className="container mx-auto px-6 mt-8">
                <div className="bg-white shadow-lg rounded-xl p-6 flex flex-wrap gap-4 items-center">

                    <input
                        type="text"
                        placeholder="Tìm theo tên bác sĩ..."
                        className="border p-2 rounded w-60"
                        value={filters.search}
                        onChange={(e) => handleChange("search", e.target.value)}
                    />

                    <select
                        className="border p-2 rounded w-48"
                        value={filters.specialization}
                        onChange={(e) => handleChange("specialization", e.target.value)}
                    >
                        <option value="">Chọn chuyên khoa</option>
                        {specializations.map((spec) => (
                            <option key={spec._id} value={spec._id}>
                                {spec.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="border p-2 rounded w-48"
                        value={filters.degree}
                        onChange={(e) => handleChange("degree", e.target.value)}
                    >
                        <option value="">Chọn học vị</option>
                        {degrees.map((deg, index) => (
                            <option key={index} value={deg}>
                                {deg}
                            </option>
                        ))}
                    </select>

                    <select
                        className="border p-2 rounded w-48"
                        value={filters.sortByExperience}
                        onChange={(e) =>
                            handleChange("sortByExperience", e.target.value)
                        }
                    >
                        <option value="">Sắp xếp kinh nghiệm</option>
                        <option value="asc">Tăng dần</option>
                        <option value="desc">Giảm dần</option>
                    </select>

                    <button
                        onClick={handleReset}
                        className="bg-gray-400 text-white px-4 py-2 rounded"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Doctor Grid */}
            <div className="container mx-auto px-6 py-12">
                {loading ? (
                    <div className="text-center text-lg font-semibold">
                        Đang tải dữ liệu...
                    </div>
                ) : (
                    <>
                        {doctors.length === 0 ? (
                            <div className="text-center text-gray-500 text-lg py-20">
                                Không tìm thấy bác sĩ phù hợp với bộ lọc.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {doctors.map((doctor) => (
                                    <DoctorCard key={doctor._id} doctor={doctor} />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        <div className="flex justify-center items-center gap-4 mt-10">
                            <button
                                disabled={filters.page === 1}
                                onClick={() => handlePageChange(filters.page - 1)}
                                className="px-4 py-2 border rounded disabled:opacity-50"
                            >
                                Prev
                            </button>

                            <span>
                                Trang {filters.page} / {metadata.totalPages ? metadata.totalPages : 1}
                            </span>

                            <button
                                disabled={filters.page === metadata.totalPages}
                                onClick={() => handlePageChange(filters.page + 1)}
                                className="px-4 py-2 border rounded disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DoctorListPage;