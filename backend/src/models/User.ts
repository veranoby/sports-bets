// ARCHIVO: backend/src/models/User.ts
// CORRECCIÓN: Cambiar nombres de índices para compatibilidad con underscored: true

import {
  Model,
  DataTypes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  HasOneCreateAssociationMixin,
  HasOneGetAssociationMixin,
  HasManyCreateAssociationMixin,
  HasManyGetAssociationsMixin,
  HasManyHasAssociationMixin,
  HasManySetAssociationsMixin,
  HasManyAddAssociationMixin,
  HasManyRemoveAssociationMixin,
} from "sequelize";
import sequelize from "../config/database";
import bcrypt from "bcryptjs";

// Interfaz para el perfil de usuario
interface UserProfile {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  identificationNumber?: string;
  verificationLevel: "none" | "basic" | "full" | "pending";

  // Venue-specific fields (when role='venue')
  venueName?: string;
  venueLocation?: string;
  venueDescription?: string;
  venueEmail?: string;
  venueWebsite?: string;

  // Gallera-specific fields (when role='gallera')
  galleraName?: string;
  galleraLocation?: string;
  galleraDescription?: string;
  galleraEmail?: string;
  galleraWebsite?: string;
  galleraSpecialties?: string[];
  galleraActiveRoosters?: number;

  // Extended fields
  businessName?: string;
  location?: string;
  description?: string;
  establishedDate?: Date;
  certified?: boolean;
  rating?: number;
  premiumLevel?: string;
  specialties?: string[];
  imageUrl?: string;
}

// Definición del modelo User
export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  // TypeScript properties (camelCase) - automatically mapped to snake_case in DB
  declare id: CreationOptional<string>;
  declare username: string;
  declare email: string;
  declare passwordHash: string; // → password_hash
  declare role: "admin" | "operator" | "venue" | "user" | "gallera";
  declare isActive: CreationOptional<boolean>; // → is_active
  declare approved: CreationOptional<boolean>; // → approved
  declare profileInfo: CreationOptional<UserProfile>; // → profile_info
  declare lastLogin: CreationOptional<Date>; // → last_login
  declare emailVerified: CreationOptional<boolean>; // → email_verified
  declare verificationToken: CreationOptional<string>; // → verification_token
  declare verificationExpires: CreationOptional<Date>; // → verification_expires
  declare createdAt: CreationOptional<Date>; // → created_at
  declare updatedAt: CreationOptional<Date>; // → updated_at

  // Métodos estáticos para autenticación
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12");
    return bcrypt.hash(password, saltRounds);
  }

  // Método de instancia para verificar contraseña
  async comparePassword(password: string): Promise<boolean> {
    console.log(
      "🔍 Comparing password:",
      password,
      "with hash:",
      this.passwordHash
    );
    const result = await bcrypt.compare(password, this.passwordHash);
    console.log("🔍 Comparison result:", result);
    return result;
  }

  // Método para obtener datos públicos del usuario incluyendo suscripción
  async toPublicJSON() {
    const { passwordHash, verificationToken, ...publicData } = this.toJSON();
    
    // Include current subscription if available
    try {
      (publicData as any).subscription = await this.getCurrentSubscription();
    } catch (err) {
      console.warn('Failed to get current subscription for user:', this.id, err);
      // Fallback to free subscription if error occurs
      (publicData as any).subscription = {
        type: 'free',
        status: 'active',
        expiresAt: null,
        features: [],
        remainingDays: 0,
      };
    }
    
    return publicData;
  }

  // Método para verificar si el usuario puede realizar determinadas acciones
  canPerformRole(role: string): boolean {
    const roleHierarchy = {
      admin: ["admin", "operator", "venue", "user", "gallera"],
      operator: ["operator"],
      venue: ["venue"],
      user: ["user"],
      gallera: ["gallera"],
    };

    return roleHierarchy[this.role]?.includes(role) || false;
  }

  // Verificar si puede gestionar eventos
  canManageEvents(): boolean {
    return ["admin", "operator"].includes(this.role);
  }

  // Verificar si puede gestionar galleras
  canManageVenues(): boolean {
    return ["admin", "venue"].includes(this.role);
  }

  // Obtener suscripción actual normalizada (free si no hay activa)
  async getCurrentSubscription(): Promise<{
    type: 'free' | 'daily' | 'monthly';
    status: 'active' | 'cancelled' | 'expired' | 'pending';
    expiresAt: Date | null;
    features: string[];
    remainingDays: number;
  }> {
    // Carga perezosa para evitar problemas de importación circular
    const { Subscription } = require('./Subscription');

    const active = await Subscription.findActiveByUserId(this.id);
    if (!active) {
      return {
        type: 'free',
        status: 'active',
        expiresAt: null,
        features: [],
        remainingDays: 0,
      };
    }

    const json = active.toPublicJSON();
    return {
      type: (json.type || 'daily') as 'daily' | 'monthly',
      status: json.status,
      expiresAt: json.expiresAt ?? null,
      features: json.features || [],
      remainingDays: typeof json.remainingDays === 'number' ? json.remainingDays : 0,
    };
  }

  // Hook antes de crear usuario
  static beforeCreateHook = async (user: User) => {
    if (user.passwordHash && !user.passwordHash.startsWith("$2")) {
      user.passwordHash = await User.hashPassword(user.passwordHash);
    }
  };

  // Hook antes de actualizar usuario
  static beforeUpdateHook = async (user: User) => {
    if (
      user.changed("passwordHash") &&
      user.passwordHash &&
      !user.passwordHash.startsWith("$2")
    ) {
      user.passwordHash = await User.hashPassword(user.passwordHash);
    }
  };
}

// Inicialización del modelo
User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        isAlphanumeric: true,
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "password_hash",
      validate: {
        len: [6, 255],
      },
    },
    role: {
      type: DataTypes.ENUM("admin", "operator", "venue", "user", "gallera"),
      allowNull: false,
      defaultValue: "user",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active",
    },
    approved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "approved",
    },
    profileInfo: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "profile_info",
      defaultValue: {
        verificationLevel: "none",
      },
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_login",
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "email_verified",
    },
    verificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "verification_token",
    },
    verificationExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "verification_expires",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "updated_at",
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    underscored: true, // Enable snake_case mapping
    indexes: [
      {
        name: "users_email_unique",
        fields: ["email"],
        unique: true,
      },
      {
        name: "users_username_unique",
        fields: ["username"],
        unique: true,
      },
      {
        name: "idx_users_role_is_active",
        fields: ["role", "is_active"],
      },
      {
        name: "idx_users_email_is_active",
        fields: ["email", "is_active"],
      },
    ],
    hooks: {
      beforeCreate: User.beforeCreateHook,
      beforeUpdate: User.beforeUpdateHook,
    },
  }
);

// NO DEFINIR ASOCIACIONES AQUÍ - SE DEFINEN EN models/index.ts

export default User;
export type { UserProfile };
