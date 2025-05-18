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
  HasManyGetAssociationsMixin
} from 'sequelize';
import sequelize from '../config/database';
import { Event } from './Event';

// Definición del modelo Fight
export class Fight extends Model<
  InferAttributes<Fight>,
  InferCreationAttributes<Fight>
> {
  declare id: CreationOptional<string>;
  declare eventId: ForeignKey<Event['id']>;
  declare number: number;
  declare redCorner: string;
  declare blueCorner: string;
  declare weight: number;
  declare notes: CreationOptional<string>;
  declare status: CreationOptional<'upcoming' | 'betting' | 'live' | 'completed' | 'cancelled'>;
  declare result: CreationOptional<'red' | 'blue' | 'draw' | 'cancelled'>;
  declare startTime: CreationOptional<Date>;
  declare endTime: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Asociaciones
  declare getEvent: BelongsToGetAssociationMixin<Event>;
  declare setEvent: BelongsToSetAssociationMixin<Event, number>;

  // Métodos de instancia
  isLive(): boolean {
    return this.status === 'live';
  }

  isBettingOpen(): boolean {
    return this.status === 'betting';
  }

  isCompleted(): boolean {
    return this.status === 'completed';
  }

  canAcceptBets(): boolean {
    return this.status === 'betting';
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
}

// Inicialización del modelo
Fight.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Event,
        key: 'id'
      }
    },
    number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 999
      }
    },
    redCorner: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [2, 255]
      }
    },
    blueCorner: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [2, 255]
      }
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 1.0,
        max: 10.0
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('upcoming', 'betting', 'live', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'upcoming'
    },
    result: {
      type: DataTypes.ENUM('red', 'blue', 'draw', 'cancelled'),
      allowNull: true
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Fight',
    tableName: 'fights',
    timestamps: true,
    indexes: [
      {
        fields: ['eventId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['eventId', 'number'],
        unique: true
      }
    ],
    validate: {
      // Validación personalizada para evitar criaderos iguales
      differentCorners() {
        if (this.redCorner === this.blueCorner) {
          throw new Error('Red and blue corners cannot be the same');
        }
      },
      // Validación de fechas
      endAfterStart() {
        if (this.startTime && this.endTime && this.endTime <= this.startTime) {
          throw new Error('End time must be after start time');
        }
      }
    }
  }
);

// Definir asociaciones
Fight.belongsTo(Event, {
  foreignKey: 'eventId',
  as: 'event'
});

Event.hasMany(Fight, {
  foreignKey: 'eventId',
  as: 'fights'
});

export default Fight;