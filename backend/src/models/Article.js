"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Article = void 0;
// 1. backend/src/models/Article.ts
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Article extends sequelize_1.Model {
    toPublicJSON() {
        var _a, _b, _c;
        return {
            id: this.id,
            title: this.title,
            content: this.content,
            summary: this.excerpt,
            author_id: this.author_id,
            venue_id: this.venue_id,
            status: this.status,
            featured_image_url: this.featured_image_url,
            published_at: this.published_at,
            created_at: this.created_at,
            updated_at: this.updated_at,
            author_name: ((_b = (_a = this.author) === null || _a === void 0 ? void 0 : _a.profileInfo) === null || _b === void 0 ? void 0 : _b.fullName) || "Autor",
            venue_name: (_c = this.venue) === null || _c === void 0 ? void 0 : _c.name,
        };
    }
}
exports.Article = Article;
Article.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    excerpt: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: false,
    },
    author_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: "author_id",
    },
    venue_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: "venue_id",
    },
    featured_image_url: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
        field: "featured_image",
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("draft", "pending", "published", "archived"),
        allowNull: false,
        defaultValue: "draft",
    },
    published_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
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
    sequelize: database_1.default,
    modelName: "Article",
    tableName: "articles",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
});
