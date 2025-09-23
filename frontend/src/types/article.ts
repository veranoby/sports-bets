export type ArticleStatus = "draft" | "pending" | "published" | "archived";
export type ArticleCategory = "news" | "analysis" | "tutorial" | "announcement";

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  author_id: string;
  category: ArticleCategory;
  status: ArticleStatus;
  featured_image?: string;
  tags?: unknown;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ArticleFormData {
  title: string;
  excerpt: string;
  content: string;
  featured_image?: string;
}

export interface ArticleFormErrors {
  title?: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
}
