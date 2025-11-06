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
import { Event } from "./Event";

// Definición del modelo Fight
export class Fight extends Model<
  InferAttributes<Fight>,
  InferCreationAttributes<Fight>
> {
  declare id: CreationOptional<string>;
  declare eventId: ForeignKey<Event["id"]>;
  declare number: number;
  declare redCorner: string;
  declare blueCorner: string;
  declare weight: number;
  declare notes: CreationOptional<string>;
  declare initialOdds: CreationOptional<{ red: number; blue: number }>;
  declare bettingStartTime: CreationOptional<Date>;
  declare bettingEndTime: CreationOptional<Date>;
  declare totalBets: number;
  declare totalAmount: number;
  declare status: CreationOptional<
    "upcoming" | "betting" | "live" | "completed" | "cancelled"
  >;
  declare result: CreationOptional<"red" | "blue" | "draw" | "cancelled">;
  declare startTime: CreationOptional<Date>;
  declare endTime: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Asociaciones
  declare getEvent: BelongsToGetAssociationMixin<Event>;
  declare setEvent: BelongsToSetAssociationMixin<Event, number>;

  // Métodos de instancia
  isLive(): boolean {
    return this.status === "live";
  }

  isBettingOpen(): boolean {
    return this.status === "betting";
  }

  isCompleted(): boolean {
    return this.status === "completed";
  }

  canAcceptBets(): boolean {
    const now = new Date();
    return (
      this.status === "betting" &&
      (!this.bettingStartTime || now >= this.bettingStartTime) &&
      (!this.bettingEndTime || now <= this.bettingEndTime)
    );
  }

  duration(): number | null {
    if (this.startTime && this.endTime) {
      return this.endTime.getTime() - this.startTime.getTime();
    }
    return null;
  }

  toPublicJSON() {
    return this.toJSON();
  }

  canTransitionTo(newStatus: "upcoming" | "betting" | "live" | "completed" | "cancelled"): boolean {
    const validTransitions = {
      "upcoming": ["betting", "cancelled"],
      "betting": ["live", "cancelled"],
      "live": ["completed", "cancelled"],
      "completed": [] as string[],
      "cancelled": [] as string[]
    };
    
    return validTransitions[this.status]?.includes(newStatus) ?? false;
  }
}

// Inicialización del modelo
Fight.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "event_id",
      references: {
        model: Event,
        key: "id",
      },
    },
    number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 999,
      },
    },
    redCorner: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "red_corner",
      validate: {
        len: [2, 255],
      },
    },
    blueCorner: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "blue_corner",
      validate: {
        len: [2, 255],
      },
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 1.0,
        max: 10.0,
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    initialOdds: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "initial_odds",
      defaultValue: {
        red: 1.0,
        blue: 1.0,
      },
    },
    bettingStartTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "betting_start_time",
    },
    bettingEndTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "betting_end_time",
    },
    totalBets: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "total_bets",
      validate: {
        min: 0,
      },
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "total_amount",
      validate: {
        min: 0,
      },
    },
    status: {
      type: DataTypes.ENUM(
        "upcoming",
        "betting",
        "live",
        "completed",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "upcoming",
    },
    result: {
      type: DataTypes.ENUM("red", "blue", "draw", "cancelled"),
      allowNull: true,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "start_time",
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "end_time",
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
    modelName: "Fight",
    tableName: "fights",
    timestamps: true,
    indexes: [
      {
        fields: ["event_id"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["event_id", "number"],
        unique: true,
      },
      {
        fields: ["event_id", "status"],
      },
    ],
    validate: {
      // Validación personalizada para evitar criaderos iguales
      differentCorners() {
        if (this.redCorner === this.blueCorner) {
          throw new Error("Red and blue corners cannot be the same");
        }
      },
      // Validación de fechas
      endAfterStart() {
        if (this.startTime && this.endTime && this.endTime <= this.startTime) {
          throw new Error("End time must be after start time");
        }
      },
      bettingWindow() {
        if (
          this.bettingStartTime &&
          this.bettingEndTime &&
          this.bettingEndTime <= this.bettingStartTime
        ) {
          throw new Error("Betting end time must be after start time");
        }
      },
    },
  }
);

// NO DEFINIR ASOCIACIONES AQUÍ - SE DEFINEN EN models/index.ts

export default Fight;
