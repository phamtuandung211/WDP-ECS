import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const avatarStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "avatars",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Chỉ chấp nhận file ảnh (jpg, png, webp)"), false);
    }
};

export const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("avatar");
