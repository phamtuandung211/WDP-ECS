// services/degree.service.js
import Degree from "../models/Degree.js";

/**
 * Get all unique degree names
 */
export const getAllDegreeNamesService = async () => {
    const names = await Degree.distinct("name");
    return names;
};