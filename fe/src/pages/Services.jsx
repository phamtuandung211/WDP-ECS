import React, { useEffect, useState } from "react";
import { serviceService } from "../services";
import { Loading, Alert } from "../components/UI";

export function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await serviceService.getAll();
        setServices(data);
      } catch (err) {
        setError("Failed to load services");
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  if (loading) return <Loading />;
  if (error) return <Alert type="error">{error}</Alert>;

  return (
    <div className="page services-page">
      <h2>Our Services</h2>
      <div className="services-grid">
        {services.map((service) => (
          <div key={service.id} className="service-card">
            <h3>{service.name}</h3>
            <p>{service.description}</p>
            <p className="price">${service.price}</p>
            <button>Book Now</button>
          </div>
        ))}
      </div>
    </div>
  );
}
