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
import { User } from './User';
import { Venue } from './Venue';

// Definición del modelo Event
export class Event extends Model<
  InferAttributes<Event>,
  InferCreationAttributes<Event>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare venueId: ForeignKey<Venue['id']>;
  declare scheduledDate: Date;
  declare endDate: CreationOptional<Date>;
  declare status: CreationOptional<'scheduled' | 'in-progress' | 'completed' | 'cancelled'>;
  declare operatorId: CreationOptional<ForeignKey<User['id']>>;
  declare streamKey: CreationOptional<string>;
  declare streamUrl: CreationOptional<string>;
  declare createdBy: ForeignKey<User['id']>;
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
    return this.status === 'in-progress';
  }

  isUpcoming(): boolean {
    return this.status === 'scheduled' && new Date(this.scheduledDate) > new Date();
  }

  isCompleted(): boolean {
    return this.status === 'completed';
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
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [3, 255]
      }
    },
    venueId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Venue,
        key: 'id'
      }
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfter: new Date().toISOString() // Solo fechas futuras al crear
      }
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'in-progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled'
    },
    operatorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: User,
        key: 'id'
      }
    },
    streamKey: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    streamUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    }
  },
  {
    sequelize,
    modelName: 'Event',
    tableName: 'events',
    timestamps: true,
    indexes: [
      {
        fields: ['venueId']
      },
      {
        fields: ['operatorId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['scheduledDate']
      },
      {
        fields: ['streamKey'],
        unique: true
      }
    ],
    hooks: {
      beforeCreate: (event: Event) => {
        if (!event.streamKey) {
          event.streamKey = event.generateStreamKey();
        }
      }
    }
  }
);

// Definir asociaciones
Event.belongsTo(Venue, {
  foreignKey: 'venueId',
  as: 'venue'
});

Event.belongsTo(User, {
  foreignKey: 'operatorId',
  as: 'operator'
});

Event.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

Venue.hasMany(Event, {
  foreignKey: 'venueId',
  as: 'events'
});

User.hasMany(Event, {
  foreignKey: 'operatorId',
  as: 'operatedEvents'
});

User.hasMany(Event, {
  foreignKey: 'createdBy',
  as: 'createdEvents'
});

export default Event;