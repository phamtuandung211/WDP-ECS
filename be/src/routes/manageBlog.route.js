import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { ROLE_NAME } from "../constants/Role.enum.js";
import {
  list,
  getById,
  create,
  update,
  remove,
} from "../controllers/manageBlog.controller.js";

const router = express.Router();

router.get("/", authenticate, authorize(ROLE_NAME.SALE_STAFF), list);
router.get("/:id", authenticate, authorize(ROLE_NAME.SALE_STAFF), getById);
router.post("/", authenticate, authorize(ROLE_NAME.SALE_STAFF), create);
router.put("/:id", authenticate, authorize(ROLE_NAME.SALE_STAFF), update);
router.delete("/:id", authenticate, authorize(ROLE_NAME.SALE_STAFF), remove);

export default router;
