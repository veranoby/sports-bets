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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Article = void 0;
// 1. backend/src/models/Article.ts
var sequelize_1 = require("sequelize");
var database_1 = __importDefault(require("../config/database"));
var Article = /** @class */ (function (_super) {
    __extends(Article, _super);
    function Article() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // venue association REMOVED per PRD:205 - use author instead
    Article.prototype.toJSON = function (options) {
        var data = this.get(); // Get raw data from model instance
        var result = {};
        // Include only requested attributes if specified
        if (options === null || options === void 0 ? void 0 : options.attributes) {
            for (var _i = 0, _a = options.attributes; _i < _a.length; _i++) {
                var attr = _a[_i];
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
        // venue association REMOVED per PRD:205 - FASE 5 consolidation
        // ⚡ KEEP BOTH: Add featured_image_url but keep featured_image (frontend uses it)
        if (result.featured_image) {
            result.featured_image_url = result.featured_image;
            // DON'T delete featured_image - frontend components expect it
        }
        // Add summary but keep excerpt (may be needed by frontend)
        if (result.excerpt !== undefined) {
            result.summary = result.excerpt;
            // DON'T delete excerpt
        }
        return result;
    };
    return Article;
}(sequelize_1.Model));
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
    // venue_id REMOVED per PRD:205 - FASE 5 consolidation (2025-11-04)
    // Migration needed: ALTER TABLE articles DROP COLUMN venue_id;
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
