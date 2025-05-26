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
  verificationLevel: "none" | "basic" | "full";
}

// Definición del modelo User
export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  // Propiedades del modelo
  declare id: CreationOptional<string>;
  declare username: string;
  declare email: string;
  declare passwordHash: string;
  declare role: "admin" | "operator" | "venue" | "user";
  declare isActive: CreationOptional<boolean>;
  declare profileInfo: CreationOptional<UserProfile>;
  declare lastLogin: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Métodos estáticos para autenticación
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12");
    return bcrypt.hash(password, saltRounds);
  }

  // Método de instancia para verificar contraseña
  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  // Método para obtener datos públicos del usuario
  toPublicJSON() {
    const { passwordHash, ...publicData } = this.toJSON();
    return publicData;
  }

  // Método para verificar si el usuario puede realizar determinadas acciones
  canPerformRole(role: string): boolean {
    const roleHierarchy = {
      admin: ["admin", "operator", "venue", "user"],
      operator: ["operator"],
      venue: ["venue"],
      user: ["user"],
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
      validate: {
        len: [6, 255],
      },
    },
    role: {
      type: DataTypes.ENUM("admin", "operator", "venue", "user"),
      allowNull: false,
      defaultValue: "user",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    profileInfo: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        verificationLevel: "none",
      },
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
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
    modelName: "User",
    tableName: "users",
    timestamps: true,
    indexes: [
      {
        fields: ["email"],
        unique: true,
      },
      {
        fields: ["username"],
        unique: true,
      },
      {
        fields: ["role"],
      },
      {
        fields: ["isActive"],
      },
    ],
    hooks: {
      beforeCreate: User.beforeCreateHook,
      beforeUpdate: User.beforeUpdateHook,
    },
  }
);

export default User;
