import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doctorService } from "../services/index.js";
import DoctorCard from "../components/doctor/DoctorCard.jsx";
import { useAuth } from "../context/AuthContext";
import { ROLE_NAME } from "../constants/role";

const DoctorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [relatedDoctors, setRelatedDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchDoctor();
  }, [id]);

  const fetchDoctor = async () => {
    try {
      setLoading(true);
      const res = await doctorService.getDoctorById(id);
      setDoctor(res.data.data);

      const relatedRes = await doctorService.getRelatedDoctor(id);
      setRelatedDoctors(relatedRes.data.data.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const itemsPerPage = 4;

  const total = relatedDoctors.length;

  const visibleDoctors = relatedDoctors.slice(
    currentIndex,
    currentIndex + itemsPerPage,
  );

  const handleNext = () => {
    if (currentIndex + itemsPerPage < total) {
      setCurrentIndex(currentIndex + itemsPerPage);
    }
  };

  const handlePrev = () => {
    if (currentIndex - itemsPerPage >= 0) {
      setCurrentIndex(currentIndex - itemsPerPage);
    }
  };

  const handleBookAppointment = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role === ROLE_NAME.CUSTOMER) {
      navigate("/appointments");
      return;
    }

    alert("Chức năng đặt lịch chỉ dành cho tài khoản khách hàng");
  };

  if (loading) return <div className="p-20 text-center">Đang tải...</div>;
  if (!doctor)
    return <div className="p-20 text-center">Không tìm thấy bác sĩ</div>;

  return (
    <div className="bg-gray-100 min-h-screen py-12">
      <div className="container mx-auto px-6">
        {/* ============ PROFILE SECTION ============ */}
        <div className="bg-white rounded-3xl shadow-lg p-10 flex flex-col md:flex-row gap-10">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-56 h-56 rounded-full overflow-hidden shadow-lg">
              <img
                src="https://www.shutterstock.com/image-photo/healthcare-medical-staff-concept-portrait-600nw-2281024823.jpg"
                alt={doctor?.fullName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-800">
              {doctor?.fullName}
            </h2>

            <p className="text-blue-600 mt-2 font-medium">
              {doctor?.specializations?.map((s) => s.name).join(", ")}
            </p>

            <div className="mt-4 space-y-2 text-gray-600">
              <p>
                <strong>Kinh nghiệm:</strong> {doctor?.experienceYears} năm
              </p>
              <p>
                <strong>Giới tính:</strong>{" "}
                {doctor?.gender === "MALE" ? "Nam" : "Nữ"}
              </p>
              <p>
                <strong>Ngày sinh:</strong>{" "}
                {doctor?.dateOfBirth
                  ? new Date(doctor.dateOfBirth).toLocaleDateString()
                  : "N/A"}
              </p>
              <p>
                <strong>Địa chỉ:</strong> {doctor?.address}
              </p>
              <p>
                <strong>Điện thoại:</strong> {doctor?.phone}
              </p>
            </div>

            <button
              type="button"
              onClick={handleBookAppointment}
              className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition"
            >
              Đặt lịch khám
            </button>
          </div>
        </div>

        {/* ============ DEGREE SECTION ============ */}
        <div className="mt-12 bg-white rounded-3xl shadow-lg p-8">
          <h3 className="text-xl font-bold mb-6">Học vị</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {doctor.degrees?.map((deg) => (
              <div key={deg._id} className="border p-4 rounded-xl shadow-sm">
                <h4 className="font-semibold">{deg?.name}</h4>
                <p className="text-gray-500 text-sm">
                  {new Date(deg?.createdAt).toLocaleDateString()}
                </p>
                <a
                  href={deg?.fileUrl}
                  target="_blank"
                  className="text-blue-600 text-sm mt-2 inline-block"
                >
                  Xem chứng chỉ
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* ============ CERTIFICATE SECTION ============ */}
        <div className="mt-12 bg-white rounded-3xl shadow-lg p-8">
          <h3 className="text-xl font-bold mb-6">Chứng chỉ</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {doctor.certificates?.map((cer) => (
              <div key={cer?._id} className="border p-4 rounded-xl shadow-sm">
                <h4 className="font-semibold">{cer?.name}</h4>
                <p className="text-gray-500 text-sm">
                  Cấp bởi: {cer?.issuedBy}
                </p>
                <p className="text-gray-500 text-sm">
                  Ngày cấp:{" "}
                  {cer?.issueDate
                    ? new Date(cer.issueDate).toLocaleDateString()
                    : "N/A"}
                </p>
                <a
                  href={cer?.fileUrl}
                  target="_blank"
                  className="text-blue-600 text-sm mt-2 inline-block"
                >
                  Xem file
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* ============ RELATED DOCTORS ============ */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold mb-8 text-center">
            Bác sĩ cùng chuyên khoa
          </h3>

          {total === 0 ? (
            <div className="text-center text-gray-500">
              Không có bác sĩ cùng chuyên khoa
            </div>
          ) : (
            <div className="relative">
              {/* Nút trái */}
              {currentIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="absolute -left-6 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition"
                >
                  ◀
                </button>
              )}

              {/* 4 Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {visibleDoctors.map((doc) => (
                  <DoctorCard
                    key={doc._id}
                    doctor={doc}
                    onBookClick={handleBookAppointment}
                  />
                ))}
              </div>

              {/* Nút phải */}
              {currentIndex + itemsPerPage < total && (
                <button
                  onClick={handleNext}
                  className="absolute -right-6 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition"
                >
                  ▶
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDetailPage;
