"use strict";
// backend/src/create-test-user.ts
// Script para revisar usuarios existentes y crear únicos + USUARIO VENUE
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExistingUsers = checkExistingUsers;
var dotenv_1 = require("dotenv");
var database_1 = require("./config/database");
var models_1 = require("./models");
var logger_1 = require("./config/logger");
(0, dotenv_1.config)();
function checkExistingUsers() {
    return __awaiter(this, void 0, void 0, function () {
        var existingUsers, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    logger_1.logger.info("👥 Checking existing users...");
                    return [4 /*yield*/, (0, database_1.connectDatabase)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, models_1.User.findAll({
                            attributes: ["id", "username", "email", "role", "isActive"],
                            order: [["createdAt", "ASC"]],
                        })];
                case 2:
                    existingUsers = _a.sent();
                    logger_1.logger.info("📊 Current users in database:");
                    existingUsers.forEach(function (user, index) {
                        logger_1.logger.info("".concat(index + 1, ". ").concat(user.username, " (").concat(user.email, ") - Role: ").concat(user.role, " - Active: ").concat(user.isActive));
                    });
                    logger_1.logger.info("\n\uD83D\uDCC8 Total users: ".concat(existingUsers.length));
                    // Crear usuarios de prueba únicos
                    return [4 /*yield*/, createUniqueTestUsers(existingUsers)];
                case 3:
                    // Crear usuarios de prueba únicos
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    logger_1.logger.error("❌ Error checking users:", error_1);
                    process.exit(1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function createUniqueTestUsers(existingUsers) {
    return __awaiter(this, void 0, void 0, function () {
        var generateUniqueUsername, generateUniqueEmail, testUsername, testEmail, _a, testUser, testUserCreated, operatorUsername, operatorEmail, _b, operatorUser, operatorCreated, venueUsername, venueEmail, _c, venueUser, venueUserCreated, adminUser, error_2;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 14, , 15]);
                    logger_1.logger.info("\n🧪 Creating unique test users...");
                    generateUniqueUsername = function (baseUsername) {
                        var existingUsernames = existingUsers.map(function (u) { return u.username; });
                        if (!existingUsernames.includes(baseUsername)) {
                            return baseUsername;
                        }
                        var counter = 1;
                        var newUsername = "".concat(baseUsername).concat(counter);
                        while (existingUsernames.includes(newUsername)) {
                            counter++;
                            newUsername = "".concat(baseUsername).concat(counter);
                        }
                        return newUsername;
                    };
                    generateUniqueEmail = function (baseEmail) {
                        var existingEmails = existingUsers.map(function (u) { return u.email; });
                        if (!existingEmails.includes(baseEmail)) {
                            return baseEmail;
                        }
                        var _a = baseEmail.split("@"), name = _a[0], domain = _a[1];
                        var counter = 1;
                        var newEmail = "".concat(name).concat(counter, "@").concat(domain);
                        while (existingEmails.includes(newEmail)) {
                            counter++;
                            newEmail = "".concat(name).concat(counter, "@").concat(domain);
                        }
                        return newEmail;
                    };
                    testUsername = generateUniqueUsername("testuser");
                    testEmail = generateUniqueEmail("testuser@sportsbets.com");
                    return [4 /*yield*/, models_1.User.findOrCreate({
                            where: { email: testEmail },
                            defaults: {
                                username: testUsername,
                                email: testEmail,
                                passwordHash: "Test123456", // Hook hashea automáticamente
                                role: "user",
                                isActive: true,
                                profileInfo: {
                                    fullName: "Test User",
                                    verificationLevel: "basic",
                                },
                            },
                        })];
                case 1:
                    _a = _d.sent(), testUser = _a[0], testUserCreated = _a[1];
                    if (!testUserCreated) return [3 /*break*/, 3];
                    return [4 /*yield*/, models_1.Wallet.create({
                            userId: testUser.id,
                            balance: 500,
                            frozenAmount: 0,
                        })];
                case 2:
                    _d.sent();
                    logger_1.logger.info("\u2705 Test user created: ".concat(testUsername, " (").concat(testEmail, ") / Test123456"));
                    return [3 /*break*/, 4];
                case 3:
                    logger_1.logger.info("\u2139\uFE0F Test user already exists: ".concat(testUsername));
                    _d.label = 4;
                case 4:
                    operatorUsername = generateUniqueUsername("operator");
                    operatorEmail = generateUniqueEmail("operator@sportsbets.com");
                    return [4 /*yield*/, models_1.User.findOrCreate({
                            where: { email: operatorEmail },
                            defaults: {
                                username: operatorUsername,
                                email: operatorEmail,
                                passwordHash: "Operator123", // Hook hashea automáticamente
                                role: "operator",
                                isActive: true,
                                profileInfo: {
                                    fullName: "Test Operator",
                                    verificationLevel: "full",
                                },
                            },
                        })];
                case 5:
                    _b = _d.sent(), operatorUser = _b[0], operatorCreated = _b[1];
                    if (!operatorCreated) return [3 /*break*/, 7];
                    return [4 /*yield*/, models_1.Wallet.create({
                            userId: operatorUser.id,
                            balance: 0,
                            frozenAmount: 0,
                        })];
                case 6:
                    _d.sent();
                    logger_1.logger.info("\u2705 Operator user created: ".concat(operatorUsername, " (").concat(operatorEmail, ") / Operator123"));
                    return [3 /*break*/, 8];
                case 7:
                    logger_1.logger.info("\u2139\uFE0F Operator user already exists: ".concat(operatorUsername));
                    _d.label = 8;
                case 8:
                    venueUsername = generateUniqueUsername("venueowner");
                    venueEmail = generateUniqueEmail("venueowner@sportsbets.com");
                    return [4 /*yield*/, models_1.User.findOrCreate({
                            where: { email: venueEmail },
                            defaults: {
                                username: venueUsername,
                                email: venueEmail,
                                passwordHash: "Venue123", // Hook hashea automáticamente
                                role: "venue",
                                isActive: true,
                                profileInfo: {
                                    fullName: "Venue Owner",
                                    verificationLevel: "full",
                                },
                            },
                        })];
                case 9:
                    _c = _d.sent(), venueUser = _c[0], venueUserCreated = _c[1];
                    if (!venueUserCreated) return [3 /*break*/, 11];
                    return [4 /*yield*/, models_1.Wallet.create({
                            userId: venueUser.id,
                            balance: 0,
                            frozenAmount: 0,
                        })];
                case 10:
                    _d.sent();
                    // DEPRECATED: Venue model consolidated into User.profileInfo
                    // Venue data should now be added to venueUser.profileInfo
                    /*
                    await Venue.create({
                      name: "Gallera El Ejemplo",
                      location: "Ciudad de Prueba, País Demo",
                      description:
                        "Gallera de ejemplo para testing de la plataforma SportsBets",
                      contactInfo: {
                        email: venueEmail,
                        phone: "+1-555-0123",
                      },
                      ownerId: venueUser.id,
                      status: "active", // Admin pre-aprueba para testing
                      isVerified: true,
                      images: [],
                    });
                    */
                    logger_1.logger.info("\u2705 Venue owner created: ".concat(venueUsername, " (").concat(venueEmail, ") / Venue123"));
                    logger_1.logger.info("\u2705 Sample venue \"Gallera El Ejemplo\" created for venue owner");
                    return [3 /*break*/, 12];
                case 11:
                    logger_1.logger.info("\u2139\uFE0F Venue owner already exists: ".concat(venueUsername));
                    _d.label = 12;
                case 12: return [4 /*yield*/, models_1.User.findOne({
                        where: { role: "admin" },
                    })];
                case 13:
                    adminUser = _d.sent();
                    if (adminUser) {
                        logger_1.logger.info("\u2705 Admin user exists: ".concat(adminUser.username, " (").concat(adminUser.email, ")"));
                    }
                    else {
                        logger_1.logger.warn("⚠️ No admin user found!");
                    }
                    logger_1.logger.info("\n🎉 User creation completed!");
                    logger_1.logger.info("\n📧 CREDENTIALS FOR TESTING:");
                    logger_1.logger.info("\uD83D\uDC64 Test User: ".concat(testUsername, " / Test123456"));
                    logger_1.logger.info("\uD83C\uDFAE Operator: ".concat(operatorUsername, " / Operator123"));
                    logger_1.logger.info("\uD83C\uDFDB\uFE0F Venue Owner: ".concat(venueUsername, " / Venue123"));
                    if (adminUser) {
                        logger_1.logger.info("\uD83D\uDC51 Admin: ".concat(adminUser.username, " / admin123"));
                    }
                    logger_1.logger.info("\n🏛️ VENUE TESTING:");
                    logger_1.logger.info("- Venue owner has access to \"Gallera El Ejemplo\"");
                    logger_1.logger.info("- Can create more venues through API");
                    logger_1.logger.info("- Frontend venue panel currently shows \"En desarrollo...\"");
                    process.exit(0);
                    return [3 /*break*/, 15];
                case 14:
                    error_2 = _d.sent();
                    logger_1.logger.error("❌ Error creating unique users:", error_2);
                    process.exit(1);
                    return [3 /*break*/, 15];
                case 15: return [2 /*return*/];
            }
        });
    });
}
if (require.main === module) {
    checkExistingUsers();
}
