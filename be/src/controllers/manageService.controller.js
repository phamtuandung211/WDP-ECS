import SaleStaff from "../models/SaleStaff.js";
import {
  getServiceList,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "../services/manageService.service.js";
import { ROLE_NAME } from "../constants/Role.enum.js";

export const list = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await getServiceList({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to get services",
      errors: err.data,
    });
  }
};

export const getById = async (req, res) => {
  try {
    const service = await getServiceById(req.params.id);
    return res.status(200).json(service);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to get service",
      errors: err.data,
    });
  }
};

export const create = async (req, res) => {
  try {
    const staff = await SaleStaff.findOne({ accountId: req.user.accountId });
    if (!staff) {
      return res.status(403).json({ message: "Sale staff profile not found" });
    }
    const service = await createService(req.body, staff._id);
    return res.status(201).json(service);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to create service",
      errors: err.data,
    });
  }
};

export const update = async (req, res) => {
  try {
    const service = await updateService(req.params.id, req.body);
    return res.status(200).json(service);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to update service",
      errors: err.data,
    });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await deleteService(req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to delete service",
      errors: err.data,
    });
  }
};
