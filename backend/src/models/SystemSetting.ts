
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface SystemSettingAttributes {
  id: string;
  key: string;
  value: any; // JSONB can hold any type
  type: 'boolean' | 'string' | 'number' | 'json';
  category: string;
  description?: string;
  is_public: boolean;
  updated_by?: string;
  created_at: Date;
  updated_at: Date;
}

interface SystemSettingCreationAttributes extends Optional<SystemSettingAttributes, 'id' | 'created_at' | 'updated_at' | 'is_public'> {}

export class SystemSetting extends Model<SystemSettingAttributes, SystemSettingCreationAttributes> implements SystemSettingAttributes {
  public id!: string;
  public key!: string;
  public value!: any;
  public type!: 'boolean' | 'string' | 'number' | 'json';
  public category!: string;
  public description?: string;
  public is_public!: boolean;
  public updated_by?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Utility methods for type-safe value access
  public getBooleanValue(): boolean {
    if (this.type !== 'boolean') {
      throw new Error(`Setting ${this.key} is not a boolean type`);
    }
    return this.value === 'true' || this.value === true;
  }

  public getNumberValue(): number {
    if (this.type !== 'number') {
      throw new Error(`Setting ${this.key} is not a number type`);
    }
    return typeof this.value === 'string' ? parseFloat(this.value) : this.value;
  }

  public getStringValue(): string {
    if (this.type !== 'string') {
      throw new Error(`Setting ${this.key} is not a string type`);
    }
    return this.value.toString();
  }

  public getJsonValue(): any {
    if (this.type !== 'json') {
      throw new Error(`Setting ${this.key} is not a json type`);
    }
    return typeof this.value === 'string' ? JSON.parse(this.value) : this.value;
  }
}

SystemSetting.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('boolean', 'string', 'number', 'json'),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
  },
  {
    sequelize,
    modelName: 'SystemSetting',
    tableName: 'system_settings',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
