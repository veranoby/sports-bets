"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const sequelize_1 = require("sequelize");
(0, dotenv_1.config)();
function testConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        console.log("🔍 Testing Neon database connection...");
        console.log("DATABASE_URL:", ((_a = process.env.DATABASE_URL) === null || _a === void 0 ? void 0 : _a.substring(0, 30)) + "...");
        try {
            const sequelize = new sequelize_1.Sequelize(process.env.DATABASE_URL, {
                dialect: "postgres",
                dialectOptions: {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false,
                    },
                },
                logging: console.log,
            });
            yield sequelize.authenticate();
            console.log("✅ Connection successful!");
            // Test query
            const result = yield sequelize.query("SELECT current_database(), current_user, version()");
            console.log("📊 Database info:", result[0]);
            yield sequelize.close();
        }
        catch (error) {
            console.error("❌ Connection failed:", error);
        }
    });
}
testConnection();
