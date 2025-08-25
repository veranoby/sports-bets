// 1. backend/src/models/Article.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { User } from "./User";
import { Venue } from "./Venue";

interface ArticleAttributes {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author_id: string;
  venue_id?: string;
  category: "news" | "analysis" | "tutorial" | "announcement";
  status: "draft" | "pending" | "published" | "archived";
  featured_image?: string;
  tags?: string[];
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
  public slug!: string;
  public content!: string;
  public excerpt!: string;
  public author_id!: string;
  public venue_id?: string;
  public category!: "news" | "analysis" | "tutorial" | "announcement";
  public featured_image?: string;
  public status!: "draft" | "pending" | "published" | "archived";
  public tags?: string[];
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
      author_name:
        (this.author as any)?.profileInfo?.fullName || this.author?.username || "Autor",
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
    slug: {
      type: DataTypes.STRING(300),
      allowNull: false,
      unique: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    category: {
      type: DataTypes.ENUM("news", "analysis", "tutorial", "announcement"),
      allowNull: false,
      defaultValue: "news",
    },
    status: {
      type: DataTypes.ENUM("draft", "pending", "published", "archived"),
      allowNull: false,
      defaultValue: "draft",
    },
    featured_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "featured_image",
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
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
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
