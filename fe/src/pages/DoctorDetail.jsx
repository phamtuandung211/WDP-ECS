import React from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "../components/UI";
import { doctors as mockDoctors } from "../mockData";

// Trang chi tiết thông tin bác sĩ (sử dụng dữ liệu cứng)
export function DoctorDetail() {
  const { id } = useParams();
  const doctor = mockDoctors.find((d) => d.id === id);
  if (!doctor) return <p className="p-4">Bác sĩ không tồn tại.</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-2">{doctor.fullName}</h2>
        <p className="mb-1">
          <strong>Chuyên môn:</strong> {doctor.specializations.join(", ")}
        </p>
        <p className="mb-1">
          <strong>Kinh nghiệm:</strong> {doctor.experienceYears} năm
        </p>
        <p className="mt-4 text-gray-700">{doctor.bio}</p>
        <Link
          to="/doctors"
          className="inline-block mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Quay lại danh sách
        </Link>
      </Card>
    </div>
  );
}
