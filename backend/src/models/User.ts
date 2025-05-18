// models/User.ts
interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string; // Almacenamos solo el hash, nunca la contraseña
  role: "admin" | "operator" | "venue" | "user";
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
  isActive: boolean;
  profileInfo?: UserProfile;
}

interface UserProfile {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  identificationNumber?: string; // Para KYC si es necesario
  verificationLevel: "none" | "basic" | "full"; // Para control de límites
}
