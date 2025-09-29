import { Router } from "express";
import multer from "multer";
import path from "path";
import { authenticate } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import fs from "fs";

const router = Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads/images");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-userId-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const userId = req.user?.id || "anonymous";
    const extension = path.extname(file.originalname);
    const filename = `${uniqueSuffix}-${userId}${extension}`;
    cb(null, filename);
  },
});

// File filter for images only
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// POST /api/uploads/image - Upload single image
router.post(
  "/image",
  authenticate,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw errors.badRequest("No image file provided");
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const imageUrl = `${baseUrl}/uploads/images/${req.file.filename}`;

    console.log(`📸 Image uploaded: ${req.file.filename} by user ${req.user!.username}`);

    res.json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: imageUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  })
);

// DELETE /api/uploads/image/:filename - Delete uploaded image
router.delete(
  "/image/:filename",
  authenticate,
  asyncHandler(async (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../../uploads/images", filename);

    // Security: Only allow deletion of files owned by the user (check filename contains userId)
    const userId = req.user!.id;
    if (!filename.includes(userId) && req.user!.role !== "admin") {
      throw errors.forbidden("You can only delete your own images");
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Image deleted: ${filename} by user ${req.user!.username}`);
      res.json({
        success: true,
        message: "Image deleted successfully",
      });
    } else {
      throw errors.notFound("Image not found");
    }
  })
);

export default router;