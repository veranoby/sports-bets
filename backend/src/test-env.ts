import { config } from "dotenv";
config();

console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log(
  "DATABASE_URL starts with:",
  process.env.DATABASE_URL?.substring(0, 30) + "..."
);
console.log("NODE_ENV:", process.env.NODE_ENV);
