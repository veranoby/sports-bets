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
    toJSON(options) {
        const data = this.get(); // Get raw data from model instance
        const result = {};
        // Include only requested attributes if specified
        if (options === null || options === void 0 ? void 0 : options.attributes) {
            for (const attr of options.attributes) {
                if (data[attr] !== undefined) {
                    result[attr] = data[attr];
                }
            }
        }
        else {
            // If no specific attributes requested, return all direct attributes
            Object.assign(result, data);
        }
        // Conditionally add associated data if loaded
        if (this.author) {
            result.author_name = this.author.username; // Assuming username is always available
        }
        if (this.venue) {
            result.venue_name = this.venue.name; // Assuming name is always available
        }
        // Handle featured_image_url if featured_image is present
        if (result.featured_image) {
            result.featured_image_url = result.featured_image;
            delete result.featured_image; // Remove original field if a new one is created
        }
        // Rename excerpt to summary for consistency with frontend
        if (result.excerpt !== undefined) {
            result.summary = result.excerpt;
            delete result.excerpt;
        }
        return result;
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
