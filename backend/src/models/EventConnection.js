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
exports.EventConnection = void 0;
var sequelize_1 = require("sequelize");
var database_1 = require("../config/database");
var EventConnection = /** @class */ (function (_super) {
    __extends(EventConnection, _super);
    function EventConnection() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return EventConnection;
}(sequelize_1.Model));
exports.EventConnection = EventConnection;
EventConnection.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    event_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    user_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    session_id: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    connected_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    disconnected_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    duration_seconds: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    ip_address: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    user_agent: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'event_connections',
    timestamps: true,
    underscored: true,
});
