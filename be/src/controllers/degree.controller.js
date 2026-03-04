// controllers/degree.controller.js
import { getAllDegreeNamesService } from "../services/degree.service.js";

/**
 * @route GET /api/degrees/names
 */
export const getAllDegreeNames = async (req, res) => {
    try {
        const names = await getAllDegreeNamesService();

        return res.status(200).json({
            message: "Unique degree names fetched successfully",
            data: names,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};