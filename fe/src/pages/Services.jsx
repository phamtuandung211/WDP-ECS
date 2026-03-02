import React, { useState } from "react";
import { Link } from "react-router-dom";
import { services as mockServices } from "../mockData";
import { SearchForm } from "../components/SearchForm";
import { Pagination } from "../components/Pagination";

export function Services() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const perPage = 6;
  const filtered = mockServices.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">Gói dịch vụ</h1>
      <p className="mb-4 text-gray-600">
        Xem các gói dịch vụ chăm sóc mắt của chúng tôi.
      </p>

      <SearchForm
        placeholder="Tìm theo tên hoặc mô tả..."
        defaultValue={search}
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(e.target.search?.value?.trim() ?? "");
        }}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {paged.length ? (
          paged.map((service) => (
            <div
              key={service.id}
              className="border border-gray-200 rounded p-4 bg-white"
            >
              <h3 className="text-xl font-semibold mb-1">{service.name}</h3>
              <p className="mb-2 text-gray-600">{service.description}</p>
              <p className="font-bold mb-2">
                {service.price.toLocaleString("vi-VN")} VNĐ
              </p>
              <Link
                to={`/services/${service.id}`}
                className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Xem chi tiết
              </Link>
            </div>
          ))
        ) : (
          <p>Chưa có gói dịch vụ nào.</p>
        )}
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />
    </div>
  );
}
