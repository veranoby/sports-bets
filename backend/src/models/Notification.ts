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

export class Notification extends Model<
  InferAttributes<Notification>,
  InferCreationAttributes<Notification>
> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<User["id"]>;
  declare title: string;
  declare message: string;
  declare type: "info" | "warning" | "error" | "success" | "bet_proposal";
  declare status: CreationOptional<"unread" | "read" | "archived">;
  declare metadata: CreationOptional<object>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Métodos de instancia
  isUnread(): boolean {
    return this.status === "unread";
  }

  markAsRead(): void {
    this.status = "read";
  }

  toPublicJSON(): object {
    return {
      id: this.id,
      title: this.title,
      message: this.message,
      type: this.type,
      status: this.status,
      metadata: this.metadata,
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
    status: {
      type: DataTypes.ENUM("unread", "read", "archived"),
      allowNull: false,
      defaultValue: "unread",
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Notification",
    tableName: "notifications",
    timestamps: true,
    indexes: [
      { fields: ["userId"] },
      { fields: ["status"] },
      { fields: ["type"] },
      { fields: ["createdAt"] },
    ],
  }
);

// NO DEFINIR ASOCIACIONES AQUÍ - SE DEFINEN EN models/index.ts

export default Notification;
