"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipChangeRequest = void 0;
var sequelize_1 = require("sequelize");
var database_1 = require("../config/database");
var MembershipChangeRequest = /** @class */ (function (_super) {
    __extends(MembershipChangeRequest, _super);
    function MembershipChangeRequest() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MembershipChangeRequest.prototype.toPublicJSON = function () {
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
    };
    return MembershipChangeRequest;
}(sequelize_1.Model));
exports.MembershipChangeRequest = MembershipChangeRequest;
MembershipChangeRequest.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
    },
    currentMembershipType: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
        field: 'current_membership_type',
    },
    requestedMembershipType: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        field: 'requested_membership_type',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'completed', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
    },
    requestNotes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        field: 'request_notes',
    },
    paymentProofUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
        field: 'payment_proof_url',
    },
    requestedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
        field: 'requested_at',
    },
    processedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'processed_at',
    },
    processedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'processed_by',
    },
    rejectionReason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        field: 'rejection_reason',
    },
    adminNotes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        field: 'admin_notes',
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'membership_change_requests',
    timestamps: true,
    underscored: true,
});
