import React from "react";
import { Link } from "react-router-dom";
import { doctors, services } from "../mockData";

export function Home() {
  const featuredDoctors = doctors.slice(0, 3);
  const featuredServices = services.slice(0, 3);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="bg-green-600 text-white py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">
            Nền tảng đặt lịch khám mắt
          </h1>
          <p className="text-lg mb-2">
            Kết nối bạn với các bác sĩ nhãn khoa hàng đầu và dịch vụ chuyên
            nghiệp.
          </p>
          <p className="text-lg">
            Đặt lịch nhanh chóng, an toàn và tiện lợi ngay tại nhà.
          </p>
        </div>
      </section>

      {/* Doctors preview */}
      <section className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Bác sĩ tiêu biểu</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {featuredDoctors.map((doc) => (
            <div key={doc.id} className="border rounded p-4 bg-white">
              <h3 className="text-xl font-semibold mb-1">{doc.fullName}</h3>
              <p className="text-gray-600">{doc.specializations.join(", ")}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link
            to="/doctors"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Xem tất cả bác sĩ
          </Link>
        </div>
      </section>

      {/* Services preview */}
      <section className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Dịch vụ nổi bật</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {featuredServices.map((s) => (
            <div key={s.id} className="border rounded p-4 bg-white">
              <h3 className="text-xl font-semibold mb-1">{s.name}</h3>
              <p className="text-gray-600">{s.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link
            to="/services"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Xem thêm dịch vụ
          </Link>
        </div>
      </section>
    </div>
  );
}
