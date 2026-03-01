import express from 'express';
import {
    getAllSpecializations,
    createSpecialization,
    updateSpecialization,
    deleteSpecialization

} from '../controllers/specialization.controller.js';
import { ROLE_NAME } from '../constants/Role.enum.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const route = express.Router();

route.get("/", getAllSpecializations);
route.post("/create", authenticate, authorize(ROLE_NAME.SALE_STAFF), createSpecialization);
route.put("/update/:id", authenticate, authorize(ROLE_NAME.SALE_STAFF), updateSpecialization);
route.delete('/delete/:id', authenticate, authorize(ROLE_NAME.SALE_STAFF), deleteSpecialization);

export default route;