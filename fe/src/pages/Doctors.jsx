import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/UI";
import { doctors as mockDoctors } from "../mockData";

// Trang danh sách bác sĩ public với dữ liệu cứng
export function Doctors() {
  const [search, setSearch] = useState("");
  const list = mockDoctors.filter((d) =>
    d.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6">Danh sách bác sĩ</h2>
      <input
        type="text"
        placeholder="Tìm kiếm bác sĩ..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 border border-gray-300 rounded px-3 py-2"
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {list.map((doc) => (
          <Card key={doc.id} className="p-4">
            <h3 className="text-xl font-semibold mb-2">{doc.fullName}</h3>
            <p className="text-gray-600 mb-2">
              {doc.specializations.join(", ")}
            </p>
            <Link
              to={`/doctors/${doc.id}`}
              className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Xem chi tiết
            </Link>
          </Card>
        ))}
        {list.length === 0 && <p>Không tìm thấy bác sĩ nào.</p>}
      </div>
    </div>
  );
}
