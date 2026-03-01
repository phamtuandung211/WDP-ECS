import Specialization from "../models/Specialization.js";



/**
 * Get all specializations
 * @route GET /api/specializations
 */
export const getAllSpecializations = async (req, res) => {
    try {
        const specializations = await Specialization.find();
        return res.status(200).json({
            message: "Specializations fetched successfully",
            data: specializations
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed fetching specializations" });
    }
}

/**
 * Create new specialization
 * @route POST /api/specializations/create
 */
export const createSpecialization = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({ message: "Specialization name is required" });
        }

        const existingSpecialization = await Specialization.findOne({
            name: {
                $regex: `^${name.trim()}$`,
                $options: "i"
            }
        });

        if (existingSpecialization) {
            return res.status(400).json({ message: " Specialization already existed" });
        }

        const specialization = new Specialization({
            name: name.trim(),
            createdBy: req.user._id
        });

        await specialization.save();

        return res.status(201).json({
            message: "Specialization created successfully",
            data: specialization
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to create specialization" });
    }
}


/**
 * Update specialization
 * @route PUT /api/specializations/update/:id
 */

export const updateSpecialization = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({ message: "The name of specialization is required" });
        }

        const existingSpecialization = await Specialization.findById(id);

        if (!existingSpecialization) {
            return res.status(404).json({ message: "The specialization does not exist" });
        }

        const updateSpecialization = await Specialization.findByIdAndUpdate(
            id,
            { name: name.trim() },
            { new: true }
        )

        return res.status(200).json({
            message: "The specialization updated successfully",
            data: updateSpecialization
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to update specialization" });

    }
}

/**
 * Delete specialization
 * @route  /api/specializations/delete/:id
 */

export const deleteSpecialization = async (req, res) => {
    try {
        const { id } = req.params;

        const existingSpecialization = await Specialization.findById(id);
        if (!existingSpecialization) {
            return res.status(404).json({ message: "The specialization does not exist" });
        }

        await Specialization.findByIdAndDelete(id);

        return res.status(200).json({ message: "The specialization deleted successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to delete specialization" });
    }
}
