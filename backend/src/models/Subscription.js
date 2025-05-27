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
exports.Subscription = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = require("./User");
// Definición del modelo Subscription
class Subscription extends sequelize_1.Model {
    // Métodos de instancia
    isActive() {
        return this.status === "active" && new Date() <= this.endDate;
    }
    isExpired() {
        return this.status === "expired" || new Date() > this.endDate;
    }
    isCancelled() {
        return this.status === "cancelled";
    }
    canRenew() {
        return this.autoRenew && this.status === "active";
    }
    daysRemaining() {
        if (this.isExpired())
            return 0;
        const now = new Date();
        const diff = this.endDate.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    getPlanDuration() {
        switch (this.plan) {
            case "daily":
                return 24; // 24 horas en lugar de 1 día
            case "monthly":
                return 30 * 24; // 30 días en horas
            default:
                return 24;
        }
    }
    getPlanDurationUnit() {
        switch (this.plan) {
            case "daily":
                return "hours"; // horas para precisión exacta
            case "monthly":
                return "hours"; // también en horas para consistencia
            default:
                return "hours";
        }
    }
    getPlanPrice() {
        const prices = {
            daily: 2.99,
            monthly: 29.99,
        };
        return prices[this.plan];
    }
    extend() {
        return __awaiter(this, void 0, void 0, function* () {
            const duration = this.getPlanDuration();
            this.endDate = new Date(this.endDate.getTime() + duration * 24 * 60 * 60 * 1000);
            yield this.save();
        });
    }
    cancel() {
        return __awaiter(this, void 0, void 0, function* () {
            this.status = "cancelled";
            this.autoRenew = false;
            yield this.save();
        });
    }
    toPublicJSON() {
        return {
            id: this.id,
            plan: this.plan,
            startDate: this.startDate,
            endDate: this.endDate,
            status: this.status,
            autoRenew: this.autoRenew,
            amount: this.amount,
            daysRemaining: this.daysRemaining(),
            isActive: this.isActive(),
        };
    }
}
exports.Subscription = Subscription;
// Inicialización del modelo
Subscription.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: User_1.User,
            key: "id",
        },
    },
    plan: {
        type: sequelize_1.DataTypes.ENUM("daily", "monthly"),
        allowNull: false,
    },
    startDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    endDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("active", "expired", "cancelled"),
        allowNull: false,
        defaultValue: "active",
    },
    autoRenew: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    paymentId: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    modelName: "Subscription",
    tableName: "subscriptions",
    timestamps: true,
    indexes: [
        {
            fields: ["userId"],
        },
        {
            fields: ["status"],
        },
        {
            fields: ["endDate"],
        },
        {
            fields: ["autoRenew"],
        },
    ],
    hooks: {
        beforeCreate: (subscription) => {
            // Configurar fecha de fin basada en el plan
            if (!subscription.endDate) {
                const duration = subscription.getPlanDuration();
                const unit = subscription.getPlanDurationUnit();
                if (unit === "hours") {
                    // Para planes diarios: 24 horas exactas desde el momento de pago
                    subscription.endDate = new Date(subscription.startDate.getTime() + duration * 60 * 60 * 1000);
                }
                else {
                    // Para otros planes: días completos
                    subscription.endDate = new Date(subscription.startDate.getTime() + duration * 24 * 60 * 60 * 1000);
                }
            }
            // Configurar precio si no está establecido
            if (!subscription.amount) {
                subscription.amount = subscription.getPlanPrice();
            }
        },
        beforeUpdate: (subscription) => {
            // Actualizar estado si la suscripción expiró
            if (subscription.status === "active" &&
                new Date() > subscription.endDate) {
                subscription.status = "expired";
            }
        },
    },
});
// NO DEFINIR ASOCIACIONES AQUÍ - SE DEFINEN EN models/index.ts
exports.default = Subscription;
