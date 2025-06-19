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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const Notification_1 = __importDefault(require("../models/Notification")); // ✅ Debe ser exactamente así
const sequelize_1 = require("sequelize"); // Importación necesaria para operadores
const router = (0, express_1.Router)();
// GET /api/notifications - Obtener notificaciones del usuario
router.get("/", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const notifications = yield Notification_1.default.findAll({
        where: {
            userId: req.user.id,
            status: { [sequelize_1.Op.ne]: "archived" },
        },
        order: [["createdAt", "DESC"]],
        limit: 50,
    });
    res.json({
        success: true,
        data: notifications.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            timestamp: n.createdAt,
            status: n.status,
            type: n.type,
        })),
    });
})));
// PUT /api/notifications/:id/read - Marcar como leído
router.put("/:id/read", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield Notification_1.default.update({ status: "read" }, {
        where: {
            id: req.params.id,
            userId: req.user.id,
        },
    });
    res.json({ success: true });
})));
// PUT /api/notifications/:id/archive - Archivar notificación
router.put("/:id/archive", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield Notification_1.default.update({ status: "archived" }, {
        where: {
            id: req.params.id,
            userId: req.user.id,
        },
    });
    res.json({ success: true });
})));
exports.default = router;
