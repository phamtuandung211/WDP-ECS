import { createRequire } from "module";
import cloudinary from "../config/cloudinary.js";

const require = createRequire(import.meta.url);
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: "has_uploads",
    allowed_formats: ["jpg", "jpeg", "png"],
    resource_type: "image",
  }),
});

const upload = multer({ storage });

export default upload;
