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
} from "sequelize";
import sequelize from "../config/database";
import { Fight } from "./Fight";
import { User } from "./User";

// Definición del modelo Bet
export class Bet extends Model<
  InferAttributes<Bet>,
  InferCreationAttributes<Bet>
> {
  declare id: CreationOptional<string>;
  declare fightId: ForeignKey<Fight["id"]>;
  declare userId: ForeignKey<User["id"]>;
  declare side: "red" | "blue";
  declare amount: number;
  declare potentialWin: number;
  declare status: CreationOptional<
    "pending" | "active" | "completed" | "cancelled"
  >;
  declare result: CreationOptional<"win" | "loss" | "draw" | "cancelled">;
  declare matchedWith: CreationOptional<ForeignKey<Bet["id"]>>;
  declare parentBetId: CreationOptional<ForeignKey<Bet["id"]>>;
  declare betType: CreationOptional<"flat" | "doy">;
  declare proposalStatus: CreationOptional<
    "none" | "pending" | "accepted" | "rejected"
  >;
  declare terms: CreationOptional<{
    ratio: number;
    isOffer: boolean;
    pagoAmount?: number;
    doyAmount?: number;
    proposedBy?: string;
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
  declare getParentBet: BelongsToGetAssociationMixin<Bet>;
  declare setParentBet: BelongsToSetAssociationMixin<Bet, number>;

  // Métodos de instancia
  isPending(): boolean {
    return this.status === "pending";
  }

  isActive(): boolean {
    return this.status === "active";
  }

  isCompleted(): boolean {
    return this.status === "completed";
  }

  isWin(): boolean {
    return this.result === "win";
  }

  isLoss(): boolean {
    return this.result === "loss";
  }

  isDraw(): boolean {
    return this.result === "draw";
  }

  calculatePotentialWin(): number {
    if (this.terms?.ratio) {
      return this.amount * this.terms.ratio;
    }
    return this.potentialWin;
  }

  canBeMatched(): boolean {
    return this.status === "pending" && this.terms?.isOffer === true;
  }

  toPublicJSON() {
    return this.toJSON();
  }

  isPagoProposal(): boolean {
    return this.betType === "flat" && this.terms?.pagoAmount !== undefined;
  }

  isDoyBet(): boolean {
    return this.betType === "doy";
  }

  canAcceptProposal(): boolean {
    return (
      this.proposalStatus === "pending" &&
      this.betType === "flat" &&
      this.terms?.proposedBy !== undefined
    );
  }

  calculatePayoutAmounts(): { winner: number; loser: number } {
    if (this.isDoyBet()) {
      return {
        winner: this.amount + (this.terms?.doyAmount || 0),
        loser: this.amount,
      };
    } else if (this.isPagoProposal()) {
      return {
        winner: this.amount,
        loser: this.amount + (this.terms?.pagoAmount || 0),
      };
    }
    return { winner: this.potentialWin, loser: this.amount };
  }
}

// Inicialización del modelo
Bet.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fightId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "fight_id",
      references: {
        model: Fight,
        key: "id",
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
      references: {
        model: User,
        key: "id",
      },
    },
    side: {
      type: DataTypes.ENUM("red", "blue"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
        max: 10000.0,
      },
    },
    potentialWin: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "potential_win",
      validate: {
        min: 0.01,
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "active", "completed", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    result: {
      type: DataTypes.ENUM("win", "loss", "draw", "cancelled"),
      allowNull: true,
    },
    matchedWith: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "matched_with",
      references: {
        model: "bets",
        key: "id",
      },
    },
    parentBetId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "parent_bet_id",
      references: {
        model: "bets",
        key: "id",
      },
    },
    betType: {
      type: DataTypes.ENUM("flat", "doy"),
      allowNull: false,
      defaultValue: "flat",
    },
    proposalStatus: {
      type: DataTypes.ENUM("none", "pending", "accepted", "rejected"),
      allowNull: false,
      defaultValue: "none",
    },
    terms: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        ratio: 2.0,
        isOffer: true,
      },
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
    modelName: "Bet",
    tableName: "bets",
    timestamps: true,
    indexes: [
      {
        fields: ["fight_id", "user_id"],
        unique: true,
      },
      {
        fields: ["created_at"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["matched_with"],
      },
      {
        fields: ["fight_id", "status"],
      },
      {
        fields: ["parent_bet_id"],
      },
      {
        fields: ["bet_type"],
      },
      {
        fields: ["proposal_status"],
      },
    ],
    hooks: {
      beforeCreate: (bet: Bet) => {
        // Validar campos PAGO/DOY
        if (bet.betType === "doy" && !bet.terms?.doyAmount) {
          throw new Error("DOY bets require doyAmount in terms");
        }
        if (bet.isPagoProposal() && !bet.terms?.pagoAmount) {
          throw new Error("PAGO proposals require pagoAmount in terms");
        }
        // Calcular ganancia potencial si no está configurada
        if (!bet.potentialWin && bet.terms?.ratio) {
          bet.potentialWin = bet.calculatePotentialWin();
        }
        // Validar que la ganancia potencial sea mayor que el monto apostado
        if (bet.potentialWin && bet.potentialWin <= bet.amount) {
          throw new Error("Potential win must be greater than bet amount");
        }
      },
      beforeUpdate: (bet: Bet) => {
        // Validar campos PAGO/DOY
        if (bet.changed("betType") || bet.changed("terms")) {
          if (bet.betType === "doy" && !bet.terms?.doyAmount) {
            throw new Error("DOY bets require doyAmount in terms");
          }
          if (bet.isPagoProposal() && !bet.terms?.pagoAmount) {
            throw new Error("PAGO proposals require pagoAmount in terms");
          }
        }
        // Recalcular ganancia potencial si cambió el ratio
        if (bet.changed("terms") && bet.terms?.ratio) {
          bet.potentialWin = bet.calculatePotentialWin();
        }
        // Validar que la ganancia potencial sea mayor que el monto apostado
        if (bet.potentialWin && bet.potentialWin <= bet.amount) {
          throw new Error("Potential win must be greater than bet amount");
        }
      },
    },
  }
);

// NO DEFINIR ASOCIACIONES AQUÍ - SE DEFINEN EN models/index.ts

export default Bet;
