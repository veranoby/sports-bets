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
import { Fight } from "./Fight";

// Definición del modelo Event
export class Event extends Model<
  InferAttributes<Event>,
  InferCreationAttributes<Event>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare venueId: ForeignKey<User["id"]>;
  declare scheduledDate: Date;
  declare endDate: CreationOptional<Date>;
  declare status: CreationOptional<
    "scheduled" | "in-progress" | "intermission" | "paused" | "completed" | "cancelled"
  >;
  declare operatorId: CreationOptional<ForeignKey<User["id"]>>;
  declare streamKey: CreationOptional<string>;
  declare streamUrl: CreationOptional<string>;
  declare streamStatus: CreationOptional<"offline" | "connecting" | "connected" | "paused" | "disconnected">;
  declare hlsStatus: CreationOptional<"offline" | "processing" | "ready" | "error">;
  declare createdBy: ForeignKey<User["id"]>;
  declare totalFights: number;
  declare completedFights: number;
  declare totalBets: number;
  declare totalPrizePool: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Asociaciones
  public readonly venue?: User;
  public readonly operator?: User;
  public readonly creator?: User;
  public readonly fights?: Fight[];

  declare getVenue: BelongsToGetAssociationMixin<User>;
  declare setVenue: BelongsToSetAssociationMixin<User, number>;
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

  isIntermission(): boolean {
    return this.status === "intermission";
  }

  isPaused(): boolean {
    return this.status === "paused";
  }

  generateStreamKey(): string {
    // ✅ DEVELOPMENT: Use fixed key to match OBS configuration
    // TODO PRODUCTION: Generate unique keys and update OBS dynamically
    if (process.env.NODE_ENV === 'development') {
      return 'test-stream';
    }
    return `event_${this.id}_${Date.now()}`;
  }

  public toJSON(options?: { attributes?: string[] }) {
    const data = this.get(); // Get raw data from model instance
    const result: { [key: string]: any } = {};

    // Include only requested attributes if specified
    if (options?.attributes) {
      for (const attr of options.attributes) {
        if (data[attr] !== undefined) {
          result[attr] = data[attr];
        }
      }
    } else {
      // If no specific attributes requested, return all direct attributes
      Object.assign(result, data);
    }

    // Conditionally add associated data if loaded
    if (this.venue) {
      result.venue = this.venue.toJSON(); // Assuming Venue model also has toJSON
    }
    if (this.operator) {
      result.operator = this.operator.toJSON(); // Assuming User model also has toJSON
    }
    if (this.creator) {
      result.creator = this.creator.toJSON(); // Assuming User model also has toJSON
    }
    if (this.fights) {
      result.fights = this.fights.map(fight => fight.toJSON()); // Assuming Fight model also has toJSON
    }

    return result;
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
        model: User,
        key: "id",
      },
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "scheduled_date",
      validate: {
        isDate: true,
        // isAfter validation removed - events can be activated even if scheduledDate is in the past
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
        "intermission",
        "paused",
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
      // Validation removed - allows RTMP URLs (rtmp://...) generated by admin
    },
    streamStatus: {
      type: DataTypes.ENUM("offline", "connecting", "connected", "paused", "disconnected"),
      allowNull: false,
      defaultValue: "offline",
      field: "stream_status",
    },
    hlsStatus: {
      type: DataTypes.ENUM("offline", "processing", "ready", "error"),
      allowNull: false,
      defaultValue: "offline",
      field: "hls_status",
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
