"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("DATABASE_URL starts with:", ((_a = process.env.DATABASE_URL) === null || _a === void 0 ? void 0 : _a.substring(0, 30)) + "...");
console.log("NODE_ENV:", process.env.NODE_ENV);
