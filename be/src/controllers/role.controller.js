import Role from "../models/Role.js";
import { ROLE_NAME } from "../constants/Role.enum.js";

/**
 * Get all roles
 * @route GET /api/roles
 */
export const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.json({
      message: "Roles fetched successfully",
      data: roles,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch roles" });
  }
};

/**
 * Get role by ID
 * @route GET /api/roles/:id
 */
export const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }
    res.json({
      message: "Role fetched successfully",
      data: role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch role" });
  }
};

/**
 * Create new role
 * @route POST /api/roles
 */
export const createRole = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate role name
    if (!name) {
      return res.status(400).json({
        message: "Validation failed",
        errors: { name: "Role name is required" },
      });
    }

    // Check if role name is valid enum value
    if (!Object.values(ROLE_NAME).includes(name)) {
      return res.status(400).json({
        message: "Validation failed",
        errors: {
          name: `Role must be one of: ${Object.values(ROLE_NAME).join(", ")}`,
        },
      });
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({
        message: "Role already exists",
      });
    }

    const role = new Role({ name });
    await role.save();

    res.status(201).json({
      message: "Role created successfully",
      data: role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create role" });
  }
};

/**
 * Update role by ID
 * @route PUT /api/roles/:id
 */
export const updateRole = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate role name
    if (!name) {
      return res.status(400).json({
        message: "Validation failed",
        errors: { name: "Role name is required" },
      });
    }

    // Check if role name is valid enum value
    if (!Object.values(ROLE_NAME).includes(name)) {
      return res.status(400).json({
        message: "Validation failed",
        errors: {
          name: `Role must be one of: ${Object.values(ROLE_NAME).join(", ")}`,
        },
      });
    }

    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Check if new name already exists (excluding current role)
    const existingRole = await Role.findOne({
      name,
      _id: { $ne: req.params.id },
    });
    if (existingRole) {
      return res.status(400).json({
        message: "Role already exists",
      });
    }

    const updatedRole = await Role.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true },
    );

    res.json({
      message: "Role updated successfully",
      data: updatedRole,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update role" });
  }
};

/**
 * Delete role by ID
 * @route DELETE /api/roles/:id
 */
export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    await Role.findByIdAndDelete(req.params.id);

    res.json({
      message: "Role deleted successfully",
      data: { id: req.params.id },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete role" });
  }
};
