// backend/src/models/Gallera.ts
// Nueva entidad para Galleras, siguiendo el patrón de Venues

import {
  Model,
  DataTypes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  ForeignKey,
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  BelongsToCreateAssociationMixin,
} from "sequelize";
import sequelize from "../config/database";
import { User } from "./User";

// Definición del modelo Gallera
export class Gallera extends Model<
  InferAttributes<Gallera>,
  InferCreationAttributes<Gallera>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare location: string;
  declare description: CreationOptional<string>;
  declare ownerId: ForeignKey<User["id"]>;
  declare specialties: CreationOptional<any>; // JSONB
  declare activeRoosters: CreationOptional<number>; // INTEGER
  declare fightRecord: CreationOptional<any>; // JSONB
  declare images: CreationOptional<string[]>;
  declare status: CreationOptional<"pending" | "active" | "suspended" | "rejected">;
  declare isVerified: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Asociaciones
  public readonly owner?: User;
  declare getOwner: BelongsToGetAssociationMixin<User>;
  declare setOwner: BelongsToSetAssociationMixin<User, number>;
  declare createOwner: BelongsToCreateAssociationMixin<User>;
}

// Inicialización del modelo
Gallera.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "owner_id",
      references: {
        model: User,
        key: "id",
      },
    },
    specialties: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    activeRoosters: {
        type: DataTypes.INTEGER,
        field: "active_roosters",
        defaultValue: 0,
    },
    fightRecord: {
        type: DataTypes.JSONB,
        field: "fight_record",
        allowNull: true,
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM("pending", "active", "suspended", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_verified",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "updated_at",
    },
  },
  {
    sequelize,
    modelName: "Gallera",
    tableName: "galleras",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["owner_id"],
      },
      {
        fields: ["status"],
      },
    ],
  }
);

export default Gallera;
