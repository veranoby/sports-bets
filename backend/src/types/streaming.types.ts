// src/types/streaming.types.ts
// Tipos relacionados con el streaming
export interface Stream {
  id: string;
  title: string;
  status: "active" | "inactive";
  // ... otros campos relevantes ...
}
