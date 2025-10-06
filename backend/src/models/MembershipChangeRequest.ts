
import { Model, DataTypes, BelongsToGetAssociationMixin } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

class MembershipChangeRequest extends Model {
  public id!: string;
  public userId!: string;
  public currentMembershipType?: string | null;
  public requestedMembershipType!: string;
  public status!: 'pending' | 'completed' | 'rejected';
  public requestNotes?: string | null;
  public paymentProofUrl?: string | null;
  public requestedAt!: Date;
  public processedAt?: Date | null;
  public processedBy?: string | null;
  public rejectionReason?: string | null;
  public adminNotes?: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getUser!: BelongsToGetAssociationMixin<User>;
  public getProcessor!: BelongsToGetAssociationMixin<User>;

  public toPublicJSON() {
    return {
      id: this.id,
      userId: this.userId,
      currentMembershipType: this.currentMembershipType,
      requestedMembershipType: this.requestedMembershipType,
      status: this.status,
      requestNotes: this.requestNotes,
      paymentProofUrl: this.paymentProofUrl,
      requestedAt: this.requestedAt,
      processedAt: this.processedAt,
      processedBy: this.processedBy,
      rejectionReason: this.rejectionReason,
      adminNotes: this.adminNotes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

MembershipChangeRequest.init(
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
      },
      currentMembershipType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'current_membership_type',
      },
      requestedMembershipType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'requested_membership_type',
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      requestNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'request_notes',
      },
      paymentProofUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'payment_proof_url',
      },
      requestedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'requested_at',
      },
      processedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'processed_at',
      },
      processedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'processed_by',
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'rejection_reason',
      },
      adminNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'admin_notes',
      },
  },
  {
    sequelize,
    tableName: 'membership_change_requests',
    timestamps: true,
    underscored: true,
  }
);

export { MembershipChangeRequest };
