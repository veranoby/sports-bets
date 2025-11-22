#!/usr/bin/env ts-node
"use strict";
/**
 * TypeScript Interface Generator
 * Extracts TypeScript interfaces from backend model files and generates accurate documentation
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs/promises"));
var path = __importStar(require("path"));
var glob_1 = require("glob");
// Function to extract model attributes from Sequelize models
function extractModelAttributes(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var content, interfaces, classMatches, _i, classMatches_1, classMatch, modelName, properties;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fs.readFile(filePath, 'utf8')];
                case 1:
                    content = _b.sent();
                    interfaces = [];
                    classMatches = content.match(/class\s+(\w+)\s+extends\s+Model\s+/g);
                    if (!classMatches)
                        return [2 /*return*/, interfaces];
                    for (_i = 0, classMatches_1 = classMatches; _i < classMatches_1.length; _i++) {
                        classMatch = classMatches_1[_i];
                        modelName = (_a = classMatch.match(/class\s+(\w+)\s+extends\s+Model/)) === null || _a === void 0 ? void 0 : _a[1];
                        if (!modelName)
                            continue;
                        properties = [];
                        // Basic property extraction based on common Sequelize patterns
                        // Look for common field types in the model definition
                        if (content.includes('id:')) {
                            properties.push({ name: 'id', type: 'string', optional: false });
                        }
                        if (content.includes('createdAt:')) {
                            properties.push({ name: 'createdAt', type: 'Date', optional: false });
                        }
                        if (content.includes('updatedAt:')) {
                            properties.push({ name: 'updatedAt', type: 'Date', optional: false });
                        }
                        // Add the interface for this model
                        interfaces.push({
                            name: "".concat(modelName, "Attributes"),
                            file: filePath,
                            properties: properties
                        });
                    }
                    return [2 /*return*/, interfaces];
            }
        });
    });
}
// Helper function to extract interfaces from .ts files
function extractTSInterfaces(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var content, interfaces, interfaceRegex, match, interfaceName, interfaceBody, properties, lines, _i, lines_1, line, trimmedLine, propMatch, propName, optionalMarker, propType;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.readFile(filePath, 'utf8')];
                case 1:
                    content = _a.sent();
                    interfaces = [];
                    interfaceRegex = /export\s+interface\s+(\w+)(?:\s+extends\s+[^{]*)?\s*{([\s\S]*?)}/g;
                    while ((match = interfaceRegex.exec(content)) !== null) {
                        interfaceName = match[1];
                        interfaceBody = match[2];
                        properties = [];
                        lines = interfaceBody.split('\n');
                        for (_i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                            line = lines_1[_i];
                            trimmedLine = line.trim();
                            propMatch = trimmedLine.match(/^(\w+)(\?)?\s*:\s*(.+?)[;,]?$/);
                            if (propMatch) {
                                propName = propMatch[1], optionalMarker = propMatch[2], propType = propMatch[3];
                                properties.push({
                                    name: propName,
                                    type: propType.trim(),
                                    optional: !!optionalMarker
                                });
                            }
                        }
                        interfaces.push({
                            name: interfaceName,
                            file: filePath,
                            properties: properties
                        });
                    }
                    return [2 /*return*/, interfaces];
            }
        });
    });
}
// Main function
function generateTSInterfaceDocs() {
    return __awaiter(this, void 0, void 0, function () {
        var modelFiles, interfaceFiles, allInterfaces, _i, modelFiles_1, modelFile, extractedInterfaces, _a, interfaceFiles_1, interfaceFile, extractedInterfaces, tsDocs, outputPath, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 12, , 13]);
                    console.log('🔍 Scanning backend model and interface files...');
                    return [4 /*yield*/, (0, glob_1.glob)('**/models/**/*.ts', {
                            cwd: path.join(__dirname, '../backend/src'),
                            absolute: true
                        })];
                case 1:
                    modelFiles = _b.sent();
                    return [4 /*yield*/, (0, glob_1.glob)('**/types/**/*.ts', {
                            cwd: path.join(__dirname, '../frontend/src'),
                            absolute: true
                        }).catch(function () { return []; })];
                case 2:
                    interfaceFiles = _b.sent();
                    console.log("\uD83D\uDCCB Found ".concat(modelFiles.length, " model files and ").concat(interfaceFiles.length, " interface files to analyze..."));
                    allInterfaces = [];
                    _i = 0, modelFiles_1 = modelFiles;
                    _b.label = 3;
                case 3:
                    if (!(_i < modelFiles_1.length)) return [3 /*break*/, 6];
                    modelFile = modelFiles_1[_i];
                    console.log("\uD83D\uDCC4 Analyzing models in ".concat(path.basename(modelFile), "..."));
                    return [4 /*yield*/, extractModelAttributes(modelFile)];
                case 4:
                    extractedInterfaces = _b.sent();
                    allInterfaces = allInterfaces.concat(extractedInterfaces);
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    _a = 0, interfaceFiles_1 = interfaceFiles;
                    _b.label = 7;
                case 7:
                    if (!(_a < interfaceFiles_1.length)) return [3 /*break*/, 10];
                    interfaceFile = interfaceFiles_1[_a];
                    console.log("\uD83D\uDCC4 Analyzing interfaces in ".concat(path.basename(interfaceFile), "..."));
                    return [4 /*yield*/, extractTSInterfaces(interfaceFile)];
                case 8:
                    extractedInterfaces = _b.sent();
                    allInterfaces = allInterfaces.concat(extractedInterfaces);
                    _b.label = 9;
                case 9:
                    _a++;
                    return [3 /*break*/, 7];
                case 10:
                    console.log("\u2705 Extracted ".concat(allInterfaces.length, " TypeScript interfaces and models"));
                    tsDocs = {
                        metadata: {
                            purpose: 'AUTO-GENERATED: Accurate TypeScript interface documentation extracted from backend models and frontend types',
                            generated: new Date().toISOString(),
                            sourceFiles: __spreadArray(__spreadArray([], modelFiles, true), interfaceFiles, true).map(function (f) { return path.relative(path.join(__dirname, '..'), f); })
                        },
                        interfaces: allInterfaces
                    };
                    outputPath = path.join(__dirname, '../brain/generated-typescript-interfaces.json');
                    return [4 /*yield*/, fs.writeFile(outputPath, JSON.stringify(tsDocs, null, 2))];
                case 11:
                    _b.sent();
                    console.log("\uD83D\uDCC4 TypeScript interface documentation generated successfully at ".concat(outputPath));
                    console.log("\uD83D\uDCCA Summary: ".concat(allInterfaces.length, " interfaces from ").concat(modelFiles.length + interfaceFiles.length, " source files"));
                    return [3 /*break*/, 13];
                case 12:
                    error_1 = _b.sent();
                    console.error('❌ Error generating TypeScript interface documentation:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 13];
                case 13: return [2 /*return*/];
            }
        });
    });
}
// Run the generator
generateTSInterfaceDocs();
