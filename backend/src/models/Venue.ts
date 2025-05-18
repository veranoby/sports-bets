// models/Venue.ts
interface Venue {
  id: string;
  name: string;
  location: string;
  description?: string;
  contactInfo: {
    email?: string;
    phone?: string;
  };
  ownerId: string; // Referencia al Usuario con rol 'venue'
  status: "pending" | "active" | "suspended";
  createdAt: Date;
  updatedAt: Date;
  images?: string[]; // URLs de imágenes
}
