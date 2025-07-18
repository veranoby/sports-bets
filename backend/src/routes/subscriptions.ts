import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { Subscription, User } from "../models";
import { body, validationResult } from "express-validator";
import { transaction } from "../config/database";
import { Op } from "sequelize";
import {
  getCache as cacheGet,
  setCache as cacheSet,
  delCache as cacheDel,
} from "../config/redis";

const router = Router();

// GET /api/subscriptions - Obtener suscripciones del usuario
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const subscriptions = await Subscription.findAll({
      where: { userId: req.user!.id },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: subscriptions.map((sub) => sub.toPublicJSON()),
    });
  })
);

// GET /api/subscriptions/current - Obtener suscripción activa actual
router.get(
  "/current",
  authenticate,
  asyncHandler(async (req, res) => {
    const activeSubscription = await Subscription.findOne({
      where: {
        userId: req.user!.id,
        status: "active",
        endDate: {
          [Op.gt]: new Date(),
        },
      },
      order: [["endDate", "DESC"]],
    });

    res.json({
      success: true,
      data: activeSubscription ? activeSubscription.toPublicJSON() : null,
    });
  })
);

// POST /api/subscriptions - Crear nueva suscripción
router.post(
  "/",
  authenticate,
  [
    body("plan")
      .isIn(["daily", "monthly"])
      .withMessage("Invalid plan specified"),
    body("autoRenew")
      .optional()
      .isBoolean()
      .withMessage("Auto renew must be a boolean"),
    body("paymentData")
      .optional()
      .isObject()
      .withMessage("Payment data must be an object"),
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest(
        "Validation failed: " +
          validationErrors
            .array()
            .map((err) => err.msg)
            .join(", ")
      );
    }

    const { plan, autoRenew, paymentData } = req.body;

    // Calcular startDate y endDate
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (plan === "daily") {
      endDate.setHours(endDate.getHours() + 24);
    } else if (plan === "monthly") {
      endDate.setDate(endDate.getDate() + 30);
    }

    // Verificar si ya tiene una suscripción activa
    const existingSubscription = await Subscription.findOne({
      where: {
        userId: req.user!.id,
        status: "active",
        endDate: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (existingSubscription) {
      throw errors.conflict("You already have an active subscription");
    }

    await transaction(async (t) => {
      // Crear suscripción
      const subscription = await Subscription.create(
        {
          userId: req.user!.id,
          plan,
          startDate,
          endDate,
          autoRenew,
          metadata: {
            paymentData,
          },
        },
        { transaction: t }
      );

      // En un caso real, aquí integraríamos con el sistema de pagos (Kushki)
      // Por ahora, simularemos el procesamiento

      if (process.env.NODE_ENV === "development") {
        // En desarrollo, activar inmediatamente
        subscription.paymentId = `DEV_SUB_${Date.now()}`;
        await subscription.save({ transaction: t });

        res.status(201).json({
          success: true,
          message: "Subscription created successfully (development mode)",
          data: subscription.toPublicJSON(),
        });
      } else {
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
    });
  })
);

// PUT /api/subscriptions/:id/cancel - Cancelar suscripción
router.put(
  "/:id/cancel",
  authenticate,
  asyncHandler(async (req, res) => {
    const subscription = await Subscription.findOne({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!subscription) {
      throw errors.notFound("Subscription not found");
    }

    if (subscription.status !== "active") {
      throw errors.badRequest("Only active subscriptions can be cancelled");
    }

    await subscription.cancel();

    res.json({
      success: true,
      message: "Subscription cancelled successfully",
      data: subscription.toPublicJSON(),
    });
  })
);

// PUT /api/subscriptions/:id/auto-renew - Cambiar configuración de renovación automática
router.put(
  "/:id/auto-renew",
  authenticate,
  [body("autoRenew").isBoolean().withMessage("autoRenew must be a boolean")],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest(
        "Validation failed: " +
          validationErrors
            .array()
            .map((err) => err.msg)
            .join(", ")
      );
    }

    const { autoRenew } = req.body;

    const subscription = await Subscription.findOne({
      where: {
        id: req.params.id,
        userId: req.user!.id,
        status: "active",
      },
    });

    if (!subscription) {
      throw errors.notFound("Active subscription not found");
    }

    subscription.autoRenew = autoRenew;
    await subscription.save();

    res.json({
      success: true,
      message: `Auto-renewal ${
        autoRenew ? "enabled" : "disabled"
      } successfully`,
      data: subscription.toPublicJSON(),
    });
  })
);

// GET /api/subscriptions/plans - Obtener información de planes disponibles
router.get(
  "/plans/info",
  asyncHandler(async (req, res) => {
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
  })
);

// POST /api/subscriptions/check-access - Verificar acceso a contenido premium
router.post(
  "/check-access",
  authenticate,
  asyncHandler(async (req, res) => {
    const cacheKey = `subscription:${req.user!.id}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached)); // Simplificado
    }

    const activeSubscription = await Subscription.findOne({
      where: {
        userId: req.user!.id,
        status: "active",
        endDate: {
          [Op.gt]: new Date(),
        },
      },
    });

    const hasAccess = !!activeSubscription;

    const response = {
      success: true,
      data: {
        hasAccess,
        subscription: hasAccess ? activeSubscription!.toPublicJSON() : null,
        expiresAt: hasAccess ? activeSubscription!.endDate : null,
      },
    };

    await cacheSet(cacheKey, JSON.stringify(response), 300); // TTL 5 minutos

    res.json(response);
  })
);

// PUT /api/subscriptions/:id/extend - Extender suscripción (solo admin o para renovaciones automáticas)
router.put(
  "/:id/extend",
  authenticate,
  asyncHandler(async (req, res) => {
    const subscription = await Subscription.findByPk(req.params.id);
    if (!subscription) {
      throw errors.notFound("Subscription not found");
    }

    // Solo admin puede extender manualmente, o sistema para auto-renovación
    if (req.user!.role !== "admin" && subscription.userId !== req.user!.id) {
      throw errors.forbidden(
        "You do not have permission to extend this subscription"
      );
    }

    if (subscription.status !== "active") {
      throw errors.badRequest("Only active subscriptions can be extended");
    }

    await subscription.extend();

    res.json({
      success: true,
      message: "Subscription extended successfully",
      data: subscription.toPublicJSON(),
    });
  })
);

export default router;
