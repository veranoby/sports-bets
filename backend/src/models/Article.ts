// 1. backend/src/models/Article.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { User } from "./User";
import { Venue } from "./Venue";

interface ArticleAttributes {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author_id: string;
  venue_id?: string;
  status: "draft" | "pending" | "published" | "archived";
  featured_image_url?: string;
  published_at?: Date;
  created_at: Date;
  updated_at: Date;
}

interface ArticleCreationAttributes
  extends Optional<ArticleAttributes, "id" | "created_at" | "updated_at"> {}

export class Article
  extends Model<ArticleAttributes, ArticleCreationAttributes>
  implements ArticleAttributes
{
  public id!: string;
  public title!: string;
  public content!: string;
  public excerpt!: string;
  public author_id!: string;
  public venue_id?: string;
  public featured_image_url?: string;
  public status!: "draft" | "pending" | "published" | "archived";
  public published_at?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Asociaciones
  public readonly author?: User;
  public readonly venue?: Venue;

  public toPublicJSON() {
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
      author_name: this.author?.profileInfo?.fullName || "Autor",
      venue_name: this.venue?.name,
    };
  }
}

Article.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    excerpt: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    author_id: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "author_id",
    },
    venue_id: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "venue_id",
    },
    featured_image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "featured_image",
    },
    status: {
      type: DataTypes.ENUM("draft", "pending", "published", "archived"),
      allowNull: false,
      defaultValue: "draft",
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Article",
    tableName: "articles",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
