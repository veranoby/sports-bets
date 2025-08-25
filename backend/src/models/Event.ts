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
import { Venue } from "./Venue";

// Definición del modelo Event
export class Event extends Model<
  InferAttributes<Event>,
  InferCreationAttributes<Event>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare venueId: ForeignKey<Venue["id"]>;
  declare scheduledDate: Date;
  declare endDate: CreationOptional<Date>;
  declare status: CreationOptional<
    "scheduled" | "in-progress" | "completed" | "cancelled"
  >;
  declare operatorId: CreationOptional<ForeignKey<User["id"]>>;
  declare streamKey: CreationOptional<string>;
  declare streamUrl: CreationOptional<string>;
  declare createdBy: ForeignKey<User["id"]>;
  declare totalFights: number;
  declare completedFights: number;
  declare totalBets: number;
  declare totalPrizePool: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Asociaciones
  declare getVenue: BelongsToGetAssociationMixin<Venue>;
  declare setVenue: BelongsToSetAssociationMixin<Venue, number>;
  declare getOperator: BelongsToGetAssociationMixin<User>;
  declare setOperator: BelongsToSetAssociationMixin<User, number>;
  declare getCreatedBy: BelongsToGetAssociationMixin<User>;

  // Métodos de instancia
  isLive(): boolean {
    return this.status === "in-progress";
  }

  isUpcoming(): boolean {
    return (
      this.status === "scheduled" && new Date(this.scheduledDate) > new Date()
    );
  }

  isCompleted(): boolean {
    return this.status === "completed";
  }

  generateStreamKey(): string {
    return `event_${this.id}_${Date.now()}`;
  }

  toPublicJSON() {
    const { streamKey, ...publicData } = this.toJSON();
    return publicData;
  }
}

// Inicialización del modelo
Event.init(
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
    venueId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "venue_id",
      references: {
        model: Venue,
        key: "id",
      },
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "scheduled_date",
      validate: {
        isDate: true,
        isAfter: new Date().toISOString(), // Solo fechas futuras al crear
      },
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "end_date",
    },
    status: {
      type: DataTypes.ENUM(
        "scheduled",
        "in-progress",
        "completed",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "scheduled",
    },
    operatorId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "operator_id",
      references: {
        model: User,
        key: "id",
      },
    },
    streamKey: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      field: "stream_key",
    },
    streamUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "stream_url",
      validate: {
        isUrl: true,
      },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "created_by",
      references: {
        model: User,
        key: "id",
      },
    },
    totalFights: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "total_fights",
      validate: {
        min: 0,
        max: 200,
      },
    },
    completedFights: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "completed_fights",
      validate: {
        min: 0,
      },
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
    totalPrizePool: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "total_prize_pool",
      validate: {
        min: 0,
      },
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
    modelName: "Event",
    tableName: "events",
    timestamps: true,
    indexes: [
      {
        fields: ["venue_id"],
      },
      {
        fields: ["operator_id"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["scheduled_date"],
      },
      {
        fields: ["stream_key"],
        unique: true,
      },
      {
        fields: ["venue_id", "scheduled_date"],
      },
    ],
    hooks: {
      beforeCreate: (event: Event) => {
        if (!event.streamKey) {
          event.streamKey = event.generateStreamKey();
        }
      },
    },
  }
);

// NO DEFINIR ASOCIACIONES AQUÍ - SE DEFINEN EN models/index.ts

export default Event;
