// backend/src/models/Notification.ts - VERSIÓN CORREGIDA
import {
  Model,
  DataTypes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  ForeignKey,
} from "sequelize";
import sequelize from "../config/database";
import { User } from "./User";

export interface NotificationAttributes {
  id: string;
  userId: string;
  type: "info" | "warning" | "error" | "success" | "bet_proposal";
  title: string;
  message: string;
  data?: object;
  isRead: boolean;
  status: string;
  readAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Notification extends Model<
  InferAttributes<Notification>,
  InferCreationAttributes<Notification>
> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<User["id"]>;
  declare title: string;
  declare message: string;
  declare type: "info" | "warning" | "error" | "success" | "bet_proposal";
  declare isRead: CreationOptional<boolean>;
  declare data: CreationOptional<object>;
  declare status: string;
  declare readAt: CreationOptional<Date>;
  declare expiresAt: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Métodos de instancia
  isUnread(): boolean {
    return this.isRead === false;
  }

  markAsRead(): void {
    this.isRead = true;
  }

  toPublicJSON(): object {
    return {
      id: this.id,
      title: this.title,
      message: this.message,
      type: this.type,
      isRead: this.isRead,
      metadata: this.data,
      createdAt: this.createdAt,
    };
  }
}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id", // ✅ IMPORTANTE: Mapear al nombre de columna en DB
      references: {
        model: User,
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_read",
    },
    status: {
      type: DataTypes.STRING(10),
      defaultValue: "unread",
      field: "status",
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "read_at",
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "expires_at",
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM(
        "info",
        "warning",
        "error",
        "success",
        "bet_proposal"
      ),
      allowNull: false,
      defaultValue: "info",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at", // ✅ IMPORTANTE: Mapear al nombre de columna en DB
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "updated_at", // ✅ IMPORTANTE: Mapear al nombre de columna en DB
    },
  },
  {
    sequelize,
    modelName: "Notification",
    tableName: "notifications",
    timestamps: true,
    // ✅ IMPORTANTE: Configurar underscored para coincir con DB
    underscored: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["is_read"] },
      { fields: ["created_at"] },
      { fields: ["user_id", "is_read"] },
    ],
  }
);

export default Notification;
