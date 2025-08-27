import { config } from "dotenv";
import { Sequelize } from "sequelize";

config();

async function testConnection() {
  console.log("🔍 Testing Neon database connection...");
  console.log(
    "DATABASE_URL:",
    process.env.DATABASE_URL?.substring(0, 30) + "..."
  );

  try {
    const sequelize = new Sequelize(process.env.DATABASE_URL!, {
      dialect: "postgres",
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging: console.log,
    });

    await sequelize.authenticate();
    console.log("✅ Connection successful!");

    // Test query
    const result = await sequelize.query(
      "SELECT current_database(), current_user, version()"
    );
    console.log("📊 Database info:", result[0]);

    await sequelize.close();
  } catch (error) {
    console.error("❌ Connection failed:", error);
  }
}

testConnection();
