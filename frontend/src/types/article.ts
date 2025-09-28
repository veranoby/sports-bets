import type { User, Venue } from "./index";

export interface ArticleFormData {
  title: string;
  content: string;
  excerpt: string;
  featured_image: string;
  status: "draft" | "pending" | "published";
}

export interface ArticleFormErrors {
  title?: string;
  content?: string;
  excerpt?: string;
  featured_image?: string;
  status?: string;
}

// Article interface
export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  summary?: string;
  status: string;
  category?: string;
  tags?: string[] | string;
  featured_image?: string;
  featured_image_url?: string;
  published_at?: string;
  created_at: string;
  updated_at?: string;
  author?: User;
  author_name?: string;
  venue?: Venue;
  venue_name?: string;
  venue_id?: string;
}
