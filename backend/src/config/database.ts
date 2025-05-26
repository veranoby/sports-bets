import { Sequelize } from "sequelize";
import { logger } from "./logger";

// Configuración de la base de datos
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging:
        process.env.NODE_ENV === "development"
          ? (msg) => logger.debug(msg)
          : false,
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
      },
      timezone: "America/Guayaquil",
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    })
  : new Sequelize({
      dialect: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "sports_bets",
      username: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "password",
      pool: {
        max: 20,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions:
        process.env.NODE_ENV === "production"
          ? {
              ssl: {
                require: true,
                rejectUnauthorized: false,
              },
            }
          : {},
      logging:
        process.env.NODE_ENV === "development"
          ? (msg) => logger.debug(msg)
          : false,
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
      },
      timezone: "America/Guayaquil",
    });

// Función para conectar a la base de datos
export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info("✅ Database connection established successfully");

    // En desarrollo, sincronizar modelos
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      logger.info("✅ Database models synchronized");
    }
  } catch (error) {
    logger.error("❌ Unable to connect to the database:", error);
    throw error;
  }
};

// Función para cerrar la conexión
export const closeDatabase = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info("✅ Database connection closed");
  } catch (error) {
    logger.error("❌ Error closing database connection:", error);
    throw error;
  }
};

// Función para ejecutar transacciones
export const transaction = async <T>(
  callback: (transaction: any) => Promise<T>
): Promise<T> => {
  const t = await sequelize.transaction();
  try {
    const result = await callback(t);
    await t.commit();
    return result;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export { sequelize };
export default sequelize;
