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
import { Fight } from './Fight';
import { User } from './User';

// Definición del modelo Bet
export class Bet extends Model<
  InferAttributes<Bet>,
  InferCreationAttributes<Bet>
> {
  declare id: CreationOptional<string>;
  declare fightId: ForeignKey<Fight['id']>;
  declare userId: ForeignKey<User['id']>;
  declare side: 'red' | 'blue';
  declare amount: number;
  declare potentialWin: number;
  declare status: CreationOptional<'pending' | 'active' | 'completed' | 'cancelled'>;
  declare result: CreationOptional<'win' | 'loss' | 'draw' | 'cancelled'>;
  declare matchedWith: CreationOptional<ForeignKey<Bet['id']>>;
  declare terms: CreationOptional<{
    ratio: number;
    isOffer: boolean;
  }>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Asociaciones
  declare getFight: BelongsToGetAssociationMixin<Fight>;
  declare setFight: BelongsToSetAssociationMixin<Fight, number>;
  declare getUser: BelongsToGetAssociationMixin<User>;
  declare setUser: BelongsToSetAssociationMixin<User, number>;
  declare getMatchedBet: BelongsToGetAssociationMixin<Bet>;
  declare setMatchedBet: BelongsToSetAssociationMixin<Bet, number>;

  // Métodos de instancia
  isPending(): boolean {
    return this.status === 'pending';
  }

  isActive(): boolean {
    return this.status === 'active';
  }

  isCompleted(): boolean {
    return this.status === 'completed';
  }

  isWin(): boolean {
    return this.result === 'win';
  }

  isLoss(): boolean {
    return this.result === 'loss';
  }

  isDraw(): boolean {
    return this.result === 'draw';
  }

  calculatePotentialWin(): number {
    if (this.terms?.ratio) {
      return this.amount * this.terms.ratio;
    }
    return this.potentialWin;
  }

  canBeMatched(): boolean {
    return this.status === 'pending' && this.terms?.isOffer === true;
  }

  toPublicJSON() {
    return this.toJSON();
  }
}

// Inicialización del modelo
Bet.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    fightId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Fight,
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    side: {
      type: DataTypes.ENUM('red', 'blue'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
        max: 10000.00
      }
    },
    potentialWin: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    result: {
      type: DataTypes.ENUM('win', 'loss', 'draw', 'cancelled'),
      allowNull: true
    },
    matchedWith: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'bets',
        key: 'id'
      }
    },
    terms: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        ratio: 2.0,
        isOffer: true
      }
    }
  },
  {
    sequelize,
    modelName: 'Wallet',
    tableName: 'wallets',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
        unique: true
      }
    ],
    validate: {
      // Validación para asegurar que el monto congelado no exceda el balance
      frozenNotExceedsBalance() {
        if (this.frozenAmount > this.balance) {
          throw new Error('Frozen amount cannot exceed balance');
        }
      }
    }
  }
);

// Inicialización del modelo Transaction
Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    walletId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Wallet,
        key: 'userId'
      }
    },
    type: {
      type: DataTypes.ENUM('deposit', 'withdrawal', 'bet-win', 'bet-loss', 'bet-refund'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    reference: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    timestamps: true,
    indexes: [
      {
        fields: ['walletId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['reference']
      },
      {
        fields: ['createdAt']
      }
    ]
  }
);

// Definir asociaciones
Wallet.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Wallet.hasMany(Transaction, {
  foreignKey: 'walletId',
  as: 'transactions'
});

Transaction.belongsTo(Wallet, {
  foreignKey: 'walletId',
  as: 'wallet'
});

User.hasOne(Wallet, {
  foreignKey: 'userId',
  as: 'wallet'
});

export { Wallet, Transaction };
export default Wallet; 'Bet',
    tableName: 'bets',
    timestamps: true,
    indexes: [
      {
        fields: ['fightId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['matchedWith']
      },
      {
        fields: ['fightId', 'status']
      }
    ],
    hooks: {
      beforeCreate: (bet: Bet) => {
        // Calcular ganancia potencial si no está configurada
        if (!bet.potentialWin && bet.terms?.ratio) {
          bet.potentialWin = bet.calculatePotentialWin();
        }
      },
      beforeUpdate: (bet: Bet) => {
        // Recalcular ganancia potencial si cambió el ratio
        if (bet.changed('terms') && bet.terms?.ratio) {
          bet.potentialWin = bet.calculatePotentialWin();
        }
      }
    }
  }
);

// Definir asociaciones
Bet.belongsTo(Fight, {
  foreignKey: 'fightId',
  as: 'fight'
});

Bet.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Bet.belongsTo(Bet, {
  foreignKey: 'matchedWith',
  as: 'matchedBet'
});

Fight.hasMany(Bet, {
  foreignKey: 'fightId',
  as: 'bets'
});

User.hasMany(Bet, {
  foreignKey: 'userId',
  as: 'bets'
});

export default Bet;