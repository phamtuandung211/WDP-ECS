import { handleUpload } from "../services/upload.service.js";

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const result = handleUpload(req.file);
    return res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: result,
      url: result?.url,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
