import Service from "../models/Service.js";

export const getServiceList = async ({ page = 1, limit = 10, search }) => {
  const skip = (Math.max(1, page) - 1) * Math.max(1, Math.min(limit, 100));
  const safeLimit = Math.max(1, Math.min(limit, 100));

  const query = {};
  if (search && search.trim()) {
    query.$or = [
      { name: { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Service.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    Service.countDocuments(query),
  ]);

  return {
    data: items,
    metadata: {
      total,
      page: Math.max(1, page),
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
};

export const getServiceById = async (id) => {
  const service = await Service.findById(id).lean();
  if (!service) {
    const err = new Error("Service not found");
    err.status = 404;
    throw err;
  }
  return service;
};

export const createService = async (payload, createdByStaffId = null) => {
  const { name, description, price } = payload;

  if (!name || !name.trim()) {
    const err = new Error("Validation failed");
    err.status = 400;
    err.data = { name: "Name is required" };
    throw err;
  }
  if (!description || !description.trim()) {
    const err = new Error("Validation failed");
    err.status = 400;
    err.data = { description: "Description is required" };
    throw err;
  }
  if (price == null || typeof price !== "number" || price < 0) {
    const err = new Error("Validation failed");
    err.status = 400;
    err.data = { price: "Price must be a non-negative number" };
    throw err;
  }

  const service = new Service({
    name: name.trim(),
    description: description.trim(),
    price: Number(price),
    createdBy: createdByStaffId || undefined,
  });
  await service.save();
  return service.toObject();
};

export const updateService = async (id, payload) => {
  const service = await Service.findById(id);
  if (!service) {
    const err = new Error("Service not found");
    err.status = 404;
    throw err;
  }

  const { name, description, price } = payload;
  if (name !== undefined) service.name = name.trim();
  if (description !== undefined) service.description = description.trim();
  if (price !== undefined) {
    const num = Number(price);
    if (Number.isNaN(num) || num < 0) {
      const err = new Error("Validation failed");
      err.status = 400;
      err.data = { price: "Price must be a non-negative number" };
      throw err;
    }
    service.price = num;
  }

  await service.save();
  return service.toObject();
};

export const deleteService = async (id) => {
  const service = await Service.findByIdAndDelete(id);
  if (!service) {
    const err = new Error("Service not found");
    err.status = 404;
    throw err;
  }
  return { message: "Service deleted successfully" };
};
