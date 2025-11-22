#!/usr/bin/env ts-node
"use strict";
/**
 * API Documentation Generator
 * Extracts API endpoints from backend route files and generates accurate documentation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
var fs = __importStar(require("fs/promises"));
var path = __importStar(require("path"));
var glob_1 = require("glob");
var util_1 = require("util");
var fsAccess = (0, util_1.promisify)(fs.access);
// Function to extract API endpoints from route files
function extractEndpointsFromRouteFile(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var content, lines, endpoints, methodPatterns, i, line, hasAuth, hasAuthz, _i, methodPatterns_1, pattern, match, method, endpointPath, roles, j, authLine, roleMatch, rolesStr;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.readFile(filePath, 'utf8')];
                case 1:
                    content = _a.sent();
                    lines = content.split('\n');
                    endpoints = [];
                    methodPatterns = [
                        /router\.get\(\s*["']([^"']+)["']/,
                        /router\.post\(\s*["']([^"']+)["']/,
                        /router\.put\(\s*["']([^"']+)["']/,
                        /router\.delete\(\s*["']([^"']+)["']/,
                        /router\.patch\(\s*["']([^"']+)["']/,
                        /app\.get\(\s*["']([^"']+)["']/,
                        /app\.post\(\s*["']([^"']+)["']/,
                        /app\.put\(\s*["']([^"']+)["']/,
                        /app\.delete\(\s*["']([^"']+)["']/,
                        /app\.patch\(\s*["']([^"']+)["']/
                    ];
                    for (i = 0; i < lines.length; i++) {
                        line = lines[i].trim();
                        if (!line)
                            continue;
                        hasAuth = line.includes('authenticate') || line.includes('authMiddleware');
                        hasAuthz = line.includes('authorize') || line.includes('requireRole');
                        // Extract method and path patterns
                        for (_i = 0, methodPatterns_1 = methodPatterns; _i < methodPatterns_1.length; _i++) {
                            pattern = methodPatterns_1[_i];
                            match = line.match(pattern);
                            if (match) {
                                method = 'GET';
                                if (line.includes('.post'))
                                    method = 'POST';
                                if (line.includes('.put'))
                                    method = 'PUT';
                                if (line.includes('.delete') || line.includes('.del'))
                                    method = 'DELETE';
                                if (line.includes('.patch'))
                                    method = 'PATCH';
                                endpointPath = match[1];
                                roles = [];
                                if (hasAuthz) {
                                    // Look for authorize calls in surrounding lines to extract roles
                                    for (j = Math.max(0, i - 5); j < Math.min(lines.length, i + 5); j++) {
                                        authLine = lines[j];
                                        if (authLine.includes('authorize') || authLine.includes('requireRole')) {
                                            roleMatch = authLine.match(/authorize\(([^)]+)\)|requireRole\(([^)]+)\)/);
                                            if (roleMatch) {
                                                rolesStr = roleMatch[1] || roleMatch[2];
                                                if (rolesStr) {
                                                    roles = rolesStr
                                                        .split(',')
                                                        .map(function (r) { return r.trim().replace(/['"]/g, ''); })
                                                        .filter(function (r) { return r.length > 0; });
                                                }
                                            }
                                        }
                                    }
                                }
                                endpoints.push({
                                    method: method,
                                    path: endpointPath,
                                    authRequired: hasAuth,
                                    roles: roles.length > 0 ? roles : undefined,
                                    file: filePath,
                                    line: i + 1
                                });
                            }
                        }
                    }
                    return [2 /*return*/, endpoints];
            }
        });
    });
}
// Main function
function generateAPIDocs() {
    return __awaiter(this, void 0, void 0, function () {
        var routeFiles, allEndpoints, _i, routeFiles_1, routeFile, endpoints, apiDocs, outputPath, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    console.log('🔍 Scanning backend route files...');
                    return [4 /*yield*/, (0, glob_1.glob)('**/routes/**/*.ts', {
                            cwd: path.join(__dirname, '../backend/src'),
                            absolute: true
                        })];
                case 1:
                    routeFiles = _a.sent();
                    console.log("\uD83D\uDCCB Found ".concat(routeFiles.length, " route files to analyze..."));
                    allEndpoints = [];
                    _i = 0, routeFiles_1 = routeFiles;
                    _a.label = 2;
                case 2:
                    if (!(_i < routeFiles_1.length)) return [3 /*break*/, 5];
                    routeFile = routeFiles_1[_i];
                    console.log("\uD83D\uDCC4 Analyzing ".concat(path.basename(routeFile), "..."));
                    return [4 /*yield*/, extractEndpointsFromRouteFile(routeFile)];
                case 3:
                    endpoints = _a.sent();
                    allEndpoints = allEndpoints.concat(endpoints);
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    console.log("\u2705 Extracted ".concat(allEndpoints.length, " API endpoints"));
                    apiDocs = {
                        metadata: {
                            purpose: 'AUTO-GENERATED: Accurate API endpoint documentation extracted from backend route files',
                            generated: new Date().toISOString(),
                            sourceFiles: routeFiles.map(function (f) { return path.relative(path.join(process.cwd(), 'backend/src'), f); })
                        },
                        endpoints: allEndpoints
                    };
                    outputPath = path.join(process.cwd(), 'brain/generated-api-reference.json');
                    return [4 /*yield*/, fs.writeFile(outputPath, JSON.stringify(apiDocs, null, 2))];
                case 6:
                    _a.sent();
                    console.log("\uD83D\uDCC4 API documentation generated successfully at ".concat(outputPath));
                    console.log("\uD83D\uDCCA Summary: ".concat(allEndpoints.length, " endpoints from ").concat(routeFiles.length, " source files"));
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _a.sent();
                    console.error('❌ Error generating API documentation:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
// Run the generator
generateAPIDocs();
