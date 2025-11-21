// backend/src/models/ActiveSession.ts - PRODUCTION READY
// Session tracking model for concurrent login prevention
// Author: QWEN - Security Enhancement Specialist

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { logger } from '../config/logger';

// Define the attributes for the ActiveSession model
interface ActiveSessionAttributes {
  id: string;
  userId: string;
  sessionToken: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
}

// Define the creation attributes (some fields are optional)
interface ActiveSessionCreationAttributes
  extends Optional<ActiveSessionAttributes, 'id' | 'deviceFingerprint' | 'ipAddress' | 'userAgent' | 'createdAt' | 'lastActivity' | 'isActive'> {}

// ActiveSession model class
export class ActiveSession extends Model<ActiveSessionAttributes, ActiveSessionCreationAttributes>
  implements ActiveSessionAttributes {
  public id!: string;
  public userId!: string;
  public sessionToken!: string;
  public deviceFingerprint?: string;
  public ipAddress?: string;
  public userAgent?: string;
  public createdAt!: Date;
  public lastActivity!: Date;
  public expiresAt!: Date;
  public isActive!: boolean;

  // Helper methods
  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  public async invalidate(): Promise<void> {
    this.isActive = false;
    await this.save();
  }

  public async updateActivity(): Promise<void> {
    this.lastActivity = new Date();
    await this.save();
  }
}

// Initialize the ActiveSession model
ActiveSession.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    sessionToken: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'session_token',
    },
    deviceFingerprint: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'device_fingerprint',
    },
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true,
      field: 'ip_address',
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    lastActivity: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'last_activity',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    tableName: 'active_sessions',
    timestamps: false,
    indexes: [
      { fields: ['user_id', 'is_active'] },
      { fields: ['session_token'], unique: true },
      { fields: ['expires_at'] },
      { fields: ['device_fingerprint'] },
      { fields: ['ip_address'] },
      { fields: ['last_activity'] },
    ],
    hooks: {
      beforeCreate: (session) => {
        // Set default expiresAt if not provided (24 hours from now)
        // CHANGED: Reduced from 7 days to 24 hours for better security
        if (!session.expiresAt) {
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);
          session.expiresAt = expiresAt;
        }
        
        // Set default lastActivity if not provided
        if (!session.lastActivity) {
          session.lastActivity = new Date();
        }
      },
      afterCreate: (session) => {
        logger.info(`ActiveSession created for user ${session.userId}`);
      },
      afterUpdate: (session) => {
        logger.debug(`ActiveSession updated for user ${session.userId}`);
      },
      afterDestroy: (session) => {
        logger.info(`ActiveSession destroyed for user ${session.userId}`);
      },
    },
  }
);

// Note: Associations are defined in models/index.ts
// ActiveSession belongs to User via userId foreign key

export default ActiveSession;