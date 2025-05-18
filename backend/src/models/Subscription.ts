import {
  Model,
  DataTypes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  ForeignKey,
  BelongsToCreateAssociationMixin,
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin
} from 'sequelize';
import sequelize from '../config/database';
import { User } from './User';

// Definición del modelo Subscription
export class Subscription extends Model<
  InferAttributes<Subscription>,
  InferCreationAttributes<Subscription>
> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<User['id']>;
  declare plan: 'daily' | 'weekly' | 'monthly';
  declare startDate: Date;
  declare endDate: Date;
  declare status: CreationOptional<'active' | 'expired' | 'cancelled'>;
  declare autoRenew: CreationOptional<boolean>;
  declare paymentId: CreationOptional<string>;
  declare amount: CreationOptional<number>;
  declare metadata: CreationOptional<any>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Asociaciones
  declare getUser: BelongsToGetAssociationMixin<User>;
  declare setUser: BelongsToSetAssociationMixin<User, number>;

  // Métodos de instancia
  isActive(): boolean {
    return this.status === 'active' && new Date() <= this.endDate;
  }

  isExpired(): boolean {
    return this.status === 'expired' || new Date() > this.endDate;
  }

  isCancelled(): boolean {
    return this.status === 'cancelled';
  }

  canRenew(): boolean {
    return this.autoRenew && this.status === 'active';
  }

  daysRemaining(): number {
    if (this.isExpired()) return 0;
    const now = new Date();
    const diff = this.endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  getPlanDuration(): number {
    switch (this.plan) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'monthly': return 30;
      default: return 1;
    }
  }

  getPlanPrice(): number {
    const prices = {
      daily: 2.99,
      weekly: 9.99,
      monthly: 29.99
    };
    return prices[this.plan];
  }

  async extend(): Promise<void> {
    const duration = this.getPlanDuration();
    this.endDate = new Date(this.endDate.getTime() + (duration * 24 * 60 * 60 * 1000));
    await this.save();
  }

  async cancel(): Promise<void> {
    this.status = 'cancelled';
    this.autoRenew = false;
    await this.save();
  }

  toPublicJSON() {
    return {
      id: this.id,
      plan: this.plan,
      startDate: this.startDate,
      endDate: this.endDate,
      status: this.status,
      autoRenew: this.autoRenew,
      amount: this.amount,
      daysRemaining: this.daysRemaining(),
      isActive: this.isActive()
    };
  }
}

// Inicialización del modelo
Subscription.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    plan: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'active'
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    paymentId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Subscription',
    tableName: 'subscriptions',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['endDate']
      },
      {
        fields: ['autoRenew']
      }
    ],
    hooks: {
      beforeCreate: (subscription: Subscription) => {
        // Configurar fecha de fin basada en el plan
        if (!subscription.endDate) {
          const duration = subscription.getPlanDuration();
          subscription.endDate = new Date(
            subscription.startDate.getTime() + (duration * 24 * 60 * 60 * 1000)
          );
        }
        
        // Configurar precio si no está establecido
        if (!subscription.amount) {
          subscription.amount = subscription.getPlanPrice();
        }
      },
      beforeUpdate: (subscription: Subscription) => {
        // Actualizar estado si la suscripción expiró
        if (subscription.status === 'active' && new Date() > subscription.endDate) {
          subscription.status = 'expired';
        }
      }
    }
  }
);

// Definir asociaciones
Subscription.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(Subscription, {
  foreignKey: 'userId',
  as: 'subscriptions'
});

export default Subscription;