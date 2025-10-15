import type { User, Venue, UserSubscription } from "./index";

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
  views?: number;
  // Indicador de si el artículo fue creado por un usuario premium
  is_premium_content?: boolean;
  // Información de suscripción del autor al momento de publicación
  author_subscription?: UserSubscription;
}
