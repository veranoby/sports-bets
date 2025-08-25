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
        var _a, _b, _c, _d;
        return {
            id: this.id,
            title: this.title,
            slug: this.slug,
            content: this.content,
            summary: this.excerpt,
            author_id: this.author_id,
            venue_id: this.venue_id,
            category: this.category,
            status: this.status,
            featured_image_url: this.featured_image,
            tags: this.tags,
            published_at: this.published_at,
            created_at: this.created_at,
            updated_at: this.updated_at,
            author_name: ((_b = (_a = this.author) === null || _a === void 0 ? void 0 : _a.profileInfo) === null || _b === void 0 ? void 0 : _b.fullName) || ((_c = this.author) === null || _c === void 0 ? void 0 : _c.username) || "Autor",
            venue_name: (_d = this.venue) === null || _d === void 0 ? void 0 : _d.name,
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
    slug: {
        type: sequelize_1.DataTypes.STRING(300),
        allowNull: false,
        unique: true,
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    excerpt: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
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
    category: {
        type: sequelize_1.DataTypes.ENUM("news", "analysis", "tutorial", "announcement"),
        allowNull: false,
        defaultValue: "news",
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("draft", "pending", "published", "archived"),
        allowNull: false,
        defaultValue: "draft",
    },
    featured_image: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
        field: "featured_image",
    },
    tags: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
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
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
});
