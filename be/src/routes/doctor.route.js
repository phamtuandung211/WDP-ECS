import express from 'express';
import {
    getAllDoctors,
    getDoctorById,
    getRelateDoctors
} from '../controllers/doctor.controller.js';

const route = express.Router();

route.get("/", getAllDoctors);
route.get("/:id", getDoctorById);
route.get("/relateddoctors/:id", getRelateDoctors);

export default route;