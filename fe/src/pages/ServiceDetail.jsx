import React from "react";
import { Link, useParams } from "react-router-dom";
import { services as mockServices } from "../mockData";
import { Card } from "../components/UI";

export function ServiceDetail() {
  const { id } = useParams();
  const service = mockServices.find((s) => s.id === id);
  if (!service) return <p className="p-4">Dịch vụ không tồn tại.</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-2">{service.name}</h1>
        <p className="mb-4 text-gray-700">{service.description}</p>
        <p className="font-bold mb-4">
          Giá: {service.price.toLocaleString("vi-VN")} VNĐ
        </p>
        <Link
          to="/services"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Quay lại danh sách
        </Link>
      </Card>
    </div>
  );
}
