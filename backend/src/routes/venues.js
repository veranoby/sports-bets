"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const models_1 = require("../models");
const express_validator_1 = require("express-validator");
function getVenueAttributes(role) {
    const publicAttributes = [
        "id",
        "name",
        "location",
        "description",
        "status",
        "isVerified",
        "images",
        "createdAt",
        "updatedAt",
    ];
    switch (role) {
        case "admin":
            return undefined; // Return all attributes
        default:
            return publicAttributes;
    }
}
const router = (0, express_1.Router)();
// GET /api/venues - Listar galleras
router.get("/", auth_1.optionalAuth, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { status, limit = 20, offset = 0 } = req.query;
    const attributes = getVenueAttributes((_a = req.user) === null || _a === void 0 ? void 0 : _a.role);
    const where = {};
    if (status)
        where.status = status;
    const { count, rows } = yield models_1.Venue.findAndCountAll({
        where,
        attributes,
        include: [
            {
                model: models_1.User,
                as: "owner",
                attributes: ["id", "username", "email"], // Always include these for owner, filtering will happen in Venue.toJSON
            },
        ],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
    });
    res.json({
        success: true,
        data: {
            venues: rows.map((v) => v.toJSON({ attributes })),
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset),
        },
    });
})));
// GET /api/venues/:id - Obtener gallera específica
router.get("/:id", auth_1.optionalAuth, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const attributes = getVenueAttributes((_a = req.user) === null || _a === void 0 ? void 0 : _a.role);
    const venue = yield models_1.Venue.findByPk(req.params.id, {
        attributes,
        include: [
            {
                model: models_1.User,
                as: "owner",
                attributes: ["id", "username", "email"], // Always include these for owner, filtering will happen in Venue.toJSON
            },
        ],
    });
    if (!venue) {
        throw errorHandler_1.errors.notFound("Venue not found");
    }
    res.json({
        success: true,
        data: venue.toJSON({ attributes }),
    });
})));
// POST /api/venues - Crear nueva gallera (admin/venue)
router.post("/", auth_1.authenticate, (0, auth_1.authorize)("admin", "venue"), [
    (0, express_validator_1.body)("name")
        .isLength({ min: 3, max: 255 })
        .withMessage("Name must be between 3 and 255 characters"),
    (0, express_validator_1.body)("location")
        .isLength({ min: 5, max: 500 })
        .withMessage("Location must be between 5 and 500 characters"),
    (0, express_validator_1.body)("description")
        .optional()
        .isLength({ max: 2000 })
        .withMessage("Description must not exceed 2000 characters"),
    (0, express_validator_1.body)("contactInfo")
        .optional()
        .isObject()
        .withMessage("Contact info must be an object"),
    (0, express_validator_1.body)("ownerId")
        .optional()
        .isUUID()
        .withMessage("Owner ID must be a valid UUID"),
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest("Validation failed: " +
            validationErrors
                .array()
                .map((err) => err.msg)
                .join(", "));
    }
    const { name, location, description, contactInfo, ownerId } = req.body;
    // Determinar el propietario
    let finalOwnerId = ownerId;
    if (req.user.role === "venue") {
        // Si es un usuario venue, se asigna a sí mismo
        finalOwnerId = req.user.id;
    }
    else if (req.user.role === "admin" && !ownerId) {
        // Si es admin pero no especifica owner, se asigna a sí mismo
        finalOwnerId = req.user.id;
    }
    // Verificar que el owner existe
    if (finalOwnerId) {
        const owner = yield models_1.User.findByPk(finalOwnerId);
        if (!owner) {
            throw errorHandler_1.errors.badRequest("Specified owner does not exist");
        }
    }
    // Crear venue
    const venue = yield models_1.Venue.create({
        name,
        location,
        description,
        contactInfo: contactInfo || {},
        ownerId: finalOwnerId,
        status: req.user.role === "admin" ? "active" : "pending", // Admin aprueba automáticamente
    });
    // Recargar con asociaciones
    yield venue.reload({
        include: [
            {
                model: models_1.User,
                as: "owner",
                attributes: ["id", "username", "email"],
            },
        ],
    });
    res.status(201).json({
        success: true,
        message: "Venue created successfully",
        data: venue.toJSON(),
    });
})));
// PUT /api/venues/:id - Actualizar gallera
router.put("/:id", auth_1.authenticate, (0, auth_1.authorize)("admin", "venue"), [
    (0, express_validator_1.body)("name")
        .optional()
        .isLength({ min: 3, max: 255 })
        .withMessage("Name must be between 3 and 255 characters"),
    (0, express_validator_1.body)("location")
        .optional()
        .isLength({ min: 5, max: 500 })
        .withMessage("Location must be between 5 and 500 characters"),
    (0, express_validator_1.body)("description")
        .optional()
        .isLength({ max: 2000 })
        .withMessage("Description must not exceed 2000 characters"),
    (0, express_validator_1.body)("contactInfo")
        .optional()
        .isObject()
        .withMessage("Contact info must be an object"),
    (0, express_validator_1.body)("status")
        .optional()
        .isIn(["pending", "active", "suspended"])
        .withMessage("Invalid status"),
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest("Validation failed: " +
            validationErrors
                .array()
                .map((err) => err.msg)
                .join(", "));
    }
    const venue = yield models_1.Venue.findByPk(req.params.id);
    if (!venue) {
        throw errorHandler_1.errors.notFound("Venue not found");
    }
    // Verificar permisos
    if (req.user.role === "venue" && venue.ownerId !== req.user.id) {
        throw errorHandler_1.errors.forbidden("You can only edit your own venues");
    }
    // Actualizar campos permitidos
    const allowedFields = ["name", "location", "description", "contactInfo"];
    if (req.user.role === "admin") {
        allowedFields.push("status"); // Solo admin puede cambiar status
    }
    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            venue[field] = req.body[field];
        }
    });
    yield venue.save();
    // Recargar con asociaciones
    yield venue.reload({
        include: [
            {
                model: models_1.User,
                as: "owner",
                attributes: ["id", "username", "email"],
            },
        ],
    });
    res.json({
        success: true,
        message: "Venue updated successfully",
        data: venue.toJSON(),
    });
})));
// PUT /api/venues/:id/status - Cambiar estado de gallera (solo admin)
router.put("/:id/status", auth_1.authenticate, (0, auth_1.authorize)("admin"), [
    (0, express_validator_1.body)("status")
        .isIn(["pending", "active", "suspended"])
        .withMessage("Invalid status"),
    (0, express_validator_1.body)("reason")
        .optional()
        .isLength({ max: 500 })
        .withMessage("Reason must not exceed 500 characters"),
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest("Validation failed: " +
            validationErrors
                .array()
                .map((err) => err.msg)
                .join(", "));
    }
    const { status, reason } = req.body;
    const venue = yield models_1.Venue.findByPk(req.params.id);
    if (!venue) {
        throw errorHandler_1.errors.notFound("Venue not found");
    }
    const oldStatus = venue.status;
    venue.status = status;
    yield venue.save();
    // Log de auditoría
    require("../config/logger").logger.info(`Venue ${venue.name} (${venue.id}) status changed from ${oldStatus} to ${status} by admin ${req.user.username}. Reason: ${reason || "Not specified"}`);
    res.json({
        success: true,
        message: `Venue status updated to ${status}`,
        data: venue.toJSON(),
    });
})));
// DELETE /api/venues/:id - Eliminar gallera (solo admin)
router.delete("/:id", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const venue = yield models_1.Venue.findByPk(req.params.id);
    if (!venue) {
        throw errorHandler_1.errors.notFound("Venue not found");
    }
    // En lugar de eliminar, suspender
    venue.status = "suspended";
    yield venue.save();
    // Log de auditoría
    require("../config/logger").logger.info(`Venue ${venue.name} (${venue.id}) suspended by admin ${req.user.username}`);
    res.json({
        success: true,
        message: "Venue suspended successfully",
    });
})));
// GET /api/venues/my/venues - Obtener galleras del usuario actual (venue)
router.get("/my/venues", auth_1.authenticate, (0, auth_1.authorize)("venue", "admin"), (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const venues = yield models_1.Venue.findAll({
        where: { ownerId: req.user.id },
        order: [["createdAt", "DESC"]],
    });
    res.json({
        success: true,
        data: venues.map((venue) => venue.toJSON()),
    });
})));
exports.default = router;
