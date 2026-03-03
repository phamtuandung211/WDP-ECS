import React, { useState } from "react";
import { Link } from "react-router-dom";
import { serviceService, getUploadFullUrl } from "../services";
import { Loading, Alert } from "../components/UI";
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

      <div className="services-grid">
        {services?.length ? (
          services.map((service) => (
            <Link
              key={service._id}
              to={`/services/${service._id}`}
              className="service-card"
            >
              {service.image ? (
                <div className="service-card-image">
                  <img
                    src={getUploadFullUrl(service.image)}
                    alt={service.name}
                  />
                </div>
              ) : (
                <div className="service-card-image service-card-image-placeholder" />
              )}
              <div className="service-card-body">
                <h3 className="service-card-title">{service.name}</h3>
                <p className="service-card-price">
                  {service.price != null
                    ? Number(service.price).toLocaleString("vi-VN") + " VNĐ"
                    : "—"}
                </p>
                <span className="service-card-cta">Xem chi tiết</span>
              </div>
            </Link>
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
