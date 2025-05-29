import {
  Model,
  DataTypes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  ForeignKey,
  BelongsToCreateAssociationMixin,
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  HasManyCreateAssociationMixin,
  HasManyGetAssociationsMixin,
} from "sequelize";
import sequelize from "../config/database";
import { User } from "./User";

// Definición del modelo Venue
export class Venue extends Model<
  InferAttributes<Venue>,
  InferCreationAttributes<Venue>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare location: string;
  declare description: CreationOptional<string>;
  declare contactInfo: CreationOptional<{
    email?: string;
    phone?: string;
  }>;
  declare ownerId: ForeignKey<User["id"]>;
  declare status: CreationOptional<"pending" | "active" | "suspended">;
  declare isVerified: CreationOptional<boolean>;
  declare images: CreationOptional<string[]>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Asociaciones (declaradas pero no definidas aquí)
  declare getOwner: BelongsToGetAssociationMixin<User>;
  declare setOwner: BelongsToSetAssociationMixin<User, number>;
  declare createOwner: BelongsToCreateAssociationMixin<User>;

  // Métodos de instancia
  toPublicJSON() {
    const { ownerId, ...publicData } = this.toJSON();
    return publicData;
  }
}

// Inicialización del modelo
Venue.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [3, 255],
      },
    },
    location: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        len: [5, 500],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contactInfo: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "active", "suspended"),
      allowNull: false,
      defaultValue: "pending",
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
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
    modelName: "Venue",
    tableName: "venues",
    timestamps: true,
    indexes: [
      {
        fields: ["owner_id"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["name"],
      },
      {
        fields: ["is_verified"],
      },
    ],
  }
);

// NO DEFINIR ASOCIACIONES AQUÍ - SE DEFINEN EN models/index.ts

export default Venue;
