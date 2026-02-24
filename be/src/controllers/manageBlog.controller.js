import SaleStaff from "../models/SaleStaff.js";
import {
  getBlogList,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
} from "../services/manageBlog.service.js";

export const list = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await getBlogList({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to get blogs",
      errors: err.data,
    });
  }
};

export const getById = async (req, res) => {
  try {
    const blog = await getBlogById(req.params.id);
    return res.status(200).json(blog);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to get blog",
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
    const blog = await createBlog(req.body, staff._id);
    return res.status(201).json(blog);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to create blog",
      errors: err.data,
    });
  }
};

export const update = async (req, res) => {
  try {
    const blog = await updateBlog(req.params.id, req.body);
    return res.status(200).json(blog);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to update blog",
      errors: err.data,
    });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await deleteBlog(req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to delete blog",
      errors: err.data,
    });
  }
};
