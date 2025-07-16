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
const database_1 = require("../config/database");
const sequelize_1 = require("sequelize");
const redis_1 = require("../config/redis");
const router = (0, express_1.Router)();
// GET /api/subscriptions - Obtener suscripciones del usuario
router.get("/", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const subscriptions = yield models_1.Subscription.findAll({
        where: { userId: req.user.id },
        order: [["createdAt", "DESC"]],
    });
    res.json({
        success: true,
        data: subscriptions.map((sub) => sub.toPublicJSON()),
    });
})));
// GET /api/subscriptions/current - Obtener suscripción activa actual
router.get("/current", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const activeSubscription = yield models_1.Subscription.findOne({
        where: {
            userId: req.user.id,
            status: "active",
            endDate: {
                [sequelize_1.Op.gt]: new Date(),
            },
        },
        order: [["endDate", "DESC"]],
    });
    res.json({
        success: true,
        data: activeSubscription ? activeSubscription.toPublicJSON() : null,
    });
})));
// POST /api/subscriptions - Crear nueva suscripción
router.post("/", auth_1.authenticate, [
    (0, express_validator_1.body)("plan")
        .isIn(["daily", "monthly"])
        .withMessage("Invalid plan specified"),
    (0, express_validator_1.body)("autoRenew")
        .optional()
        .isBoolean()
        .withMessage("Auto renew must be a boolean"),
    (0, express_validator_1.body)("paymentData")
        .optional()
        .isObject()
        .withMessage("Payment data must be an object"),
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest("Validation failed: " +
            validationErrors
                .array()
                .map((err) => err.msg)
                .join(", "));
    }
    const { plan, autoRenew, paymentData } = req.body;
    // Calcular startDate y endDate
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (plan === "daily") {
        endDate.setHours(endDate.getHours() + 24);
    }
    else if (plan === "monthly") {
        endDate.setDate(endDate.getDate() + 30);
    }
    // Verificar si ya tiene una suscripción activa
    const existingSubscription = yield models_1.Subscription.findOne({
        where: {
            userId: req.user.id,
            status: "active",
            endDate: {
                [sequelize_1.Op.gt]: new Date(),
            },
        },
    });
    if (existingSubscription) {
        throw errorHandler_1.errors.conflict("You already have an active subscription");
    }
    yield (0, database_1.transaction)((t) => __awaiter(void 0, void 0, void 0, function* () {
        // Crear suscripción
        const subscription = yield models_1.Subscription.create({
            userId: req.user.id,
            plan,
            startDate,
            endDate,
            autoRenew,
            metadata: {
                paymentData,
            },
        }, { transaction: t });
        // En un caso real, aquí integraríamos con el sistema de pagos (Kushki)
        // Por ahora, simularemos el procesamiento
        if (process.env.NODE_ENV === "development") {
            // En desarrollo, activar inmediatamente
            subscription.paymentId = `DEV_SUB_${Date.now()}`;
            yield subscription.save({ transaction: t });
            res.status(201).json({
                success: true,
                message: "Subscription created successfully (development mode)",
                data: subscription.toPublicJSON(),
            });
        }
        else {
            // En producción, devolver URL de pago
            res.status(201).json({
                success: true,
                message: "Subscription created, please complete payment",
                data: {
                    subscription: subscription.toPublicJSON(),
                    paymentUrl: `${process.env.FRONTEND_URL}/payment/subscription/${subscription.id}`,
                },
            });
        }
    }));
})));
// PUT /api/subscriptions/:id/cancel - Cancelar suscripción
router.put("/:id/cancel", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const subscription = yield models_1.Subscription.findOne({
        where: {
            id: req.params.id,
            userId: req.user.id,
        },
    });
    if (!subscription) {
        throw errorHandler_1.errors.notFound("Subscription not found");
    }
    if (subscription.status !== "active") {
        throw errorHandler_1.errors.badRequest("Only active subscriptions can be cancelled");
    }
    yield subscription.cancel();
    res.json({
        success: true,
        message: "Subscription cancelled successfully",
        data: subscription.toPublicJSON(),
    });
})));
// PUT /api/subscriptions/:id/auto-renew - Cambiar configuración de renovación automática
router.put("/:id/auto-renew", auth_1.authenticate, [(0, express_validator_1.body)("autoRenew").isBoolean().withMessage("autoRenew must be a boolean")], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest("Validation failed: " +
            validationErrors
                .array()
                .map((err) => err.msg)
                .join(", "));
    }
    const { autoRenew } = req.body;
    const subscription = yield models_1.Subscription.findOne({
        where: {
            id: req.params.id,
            userId: req.user.id,
            status: "active",
        },
    });
    if (!subscription) {
        throw errorHandler_1.errors.notFound("Active subscription not found");
    }
    subscription.autoRenew = autoRenew;
    yield subscription.save();
    res.json({
        success: true,
        message: `Auto-renewal ${autoRenew ? "enabled" : "disabled"} successfully`,
        data: subscription.toPublicJSON(),
    });
})));
// GET /api/subscriptions/plans - Obtener información de planes disponibles
router.get("/plans/info", (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const plans = [
        {
            id: "daily",
            name: "Plan Diario",
            price: parseFloat(process.env.SUBSCRIPTION_DAILY_PRICE || "2.99"),
            duration: 24, // 24 horas exactas
            durationUnit: "hours",
            description: "Acceso por 24 horas exactas desde el momento del pago",
            features: [
                "Acceso a transmisiones en vivo por 24 horas",
                "Participación en apuestas",
                "Soporte básico",
                "Se activa inmediatamente al pagar",
            ],
        },
        {
            id: "monthly",
            name: "Plan Mensual",
            price: parseFloat(process.env.SUBSCRIPTION_MONTHLY_PRICE || "29.99"),
            duration: 30,
            durationUnit: "days",
            description: "Acceso por 30 días completos",
            features: [
                "Acceso ilimitado a transmisiones",
                "Participación en apuestas",
                "Estadísticas avanzadas",
                "Historial completo",
                "Soporte premium",
                "Descuentos especiales",
            ],
            recommended: true,
        },
    ];
    res.json({
        success: true,
        data: plans,
    });
})));
// POST /api/subscriptions/check-access - Verificar acceso a contenido premium
router.post("/check-access", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = `subscription:${req.user.id}`;
    const cached = yield (0, redis_1.getCache)(cacheKey);
    if (cached) {
        return res.json(JSON.parse(cached)); // Simplificado
    }
    const activeSubscription = yield models_1.Subscription.findOne({
        where: {
            userId: req.user.id,
            status: "active",
            endDate: {
                [sequelize_1.Op.gt]: new Date(),
            },
        },
    });
    const hasAccess = !!activeSubscription;
    const response = {
        success: true,
        data: {
            hasAccess,
            subscription: hasAccess ? activeSubscription.toPublicJSON() : null,
            expiresAt: hasAccess ? activeSubscription.endDate : null,
        },
    };
    yield (0, redis_1.setCache)(cacheKey, JSON.stringify(response), 300); // TTL 5 minutos
    res.json(response);
})));
// PUT /api/subscriptions/:id/extend - Extender suscripción (solo admin o para renovaciones automáticas)
router.put("/:id/extend", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const subscription = yield models_1.Subscription.findByPk(req.params.id);
    if (!subscription) {
        throw errorHandler_1.errors.notFound("Subscription not found");
    }
    // Solo admin puede extender manualmente, o sistema para auto-renovación
    if (req.user.role !== "admin" && subscription.userId !== req.user.id) {
        throw errorHandler_1.errors.forbidden("You do not have permission to extend this subscription");
    }
    if (subscription.status !== "active") {
        throw errorHandler_1.errors.badRequest("Only active subscriptions can be extended");
    }
    yield subscription.extend();
    res.json({
        success: true,
        message: "Subscription extended successfully",
        data: subscription.toPublicJSON(),
    });
})));
exports.default = router;
