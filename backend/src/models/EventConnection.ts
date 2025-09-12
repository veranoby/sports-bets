import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface EventConnectionAttributes {
  id: number;
  event_id: number;
  user_id: number;
  session_id: string;
  connected_at: Date;
  disconnected_at?: Date;
  duration_seconds?: number;
  ip_address?: string;
  user_agent?: string;
}

interface EventConnectionCreationAttributes extends Optional<EventConnectionAttributes, 'id' | 'disconnected_at' | 'duration_seconds' | 'ip_address' | 'user_agent'> {}

export class EventConnection extends Model<EventConnectionAttributes, EventConnectionCreationAttributes> implements EventConnectionAttributes {
  public id!: number;
  public event_id!: number;
  public user_id!: number;
  public session_id!: string;
  public connected_at!: Date;
  public disconnected_at?: Date;
  public duration_seconds?: number;
  public ip_address?: string;
  public user_agent?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EventConnection.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  session_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  connected_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  disconnected_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  duration_seconds: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'event_connections',
  timestamps: true,
  underscored: true,
});