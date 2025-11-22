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
exports.SystemSetting = void 0;
var sequelize_1 = require("sequelize");
var database_1 = require("../config/database");
var SystemSetting = /** @class */ (function (_super) {
    __extends(SystemSetting, _super);
    function SystemSetting() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // Utility methods for type-safe value access
    SystemSetting.prototype.getBooleanValue = function () {
        if (this.type !== 'boolean') {
            throw new Error("Setting ".concat(this.key, " is not a boolean type"));
        }
        return this.value === 'true' || this.value === true;
    };
    SystemSetting.prototype.getNumberValue = function () {
        if (this.type !== 'number') {
            throw new Error("Setting ".concat(this.key, " is not a number type"));
        }
        return typeof this.value === 'string' ? parseFloat(this.value) : this.value;
    };
    SystemSetting.prototype.getStringValue = function () {
        if (this.type !== 'string') {
            throw new Error("Setting ".concat(this.key, " is not a string type"));
        }
        return this.value.toString();
    };
    SystemSetting.prototype.getJsonValue = function () {
        if (this.type !== 'json') {
            throw new Error("Setting ".concat(this.key, " is not a json type"));
        }
        return typeof this.value === 'string' ? JSON.parse(this.value) : this.value;
    };
    return SystemSetting;
}(sequelize_1.Model));
exports.SystemSetting = SystemSetting;
SystemSetting.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    key: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    value: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM('boolean', 'string', 'number', 'json'),
        allowNull: false,
    },
    category: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    is_public: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    updated_by: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updated_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'SystemSetting',
    tableName: 'system_settings',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});
