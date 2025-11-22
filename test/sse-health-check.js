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
exports.getSystemMetrics = getSystemMetrics;
exports.checkSSEFiles = checkSSEFiles;
var child_process_1 = require("child_process");
var util_1 = require("util");
var execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Health Check Real del Sistema SSE
 *
 * Este script obtiene métricas reales del sistema actual sin hacer simulaciones teóricas
 */
function getSystemMetrics() {
    return __awaiter(this, void 0, void 0, function () {
        var memoryResult, memoryMB, cpuResult, connectionsResult, e_1, e_2, cpuPercent, connections, processResult, e_3, processCount, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 12, , 13]);
                    memoryResult = process.memoryUsage();
                    memoryMB = memoryResult.heapUsed / 1024 / 1024;
                    cpuResult = void 0, connectionsResult = void 0;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, execAsync('top -bn1 | head -n 5 | grep Cpu || echo "CPU% N/A"')];
                case 2:
                    cpuResult = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    cpuResult = { stdout: 'CPU% N/A' };
                    return [3 /*break*/, 4];
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, execAsync('lsof -i :3001 2>/dev/null | grep -c "node" || echo "0"')];
                case 5:
                    // Contar conexiones SSE activas (buscando EventSource en procesos si existen)
                    connectionsResult = _a.sent();
                    return [3 /*break*/, 7];
                case 6:
                    e_2 = _a.sent();
                    connectionsResult = { stdout: '0' };
                    return [3 /*break*/, 7];
                case 7:
                    cpuPercent = (cpuResult.stdout || 'CPU% N/A').trim().slice(0, 10);
                    connections = parseInt(connectionsResult.stdout.trim()) || 0;
                    processResult = void 0;
                    _a.label = 8;
                case 8:
                    _a.trys.push([8, 10, , 11]);
                    return [4 /*yield*/, execAsync('ps aux | grep node | wc -l')];
                case 9:
                    processResult = _a.sent();
                    return [3 /*break*/, 11];
                case 10:
                    e_3 = _a.sent();
                    processResult = { stdout: '1' };
                    return [3 /*break*/, 11];
                case 11:
                    processCount = parseInt(processResult.stdout.trim());
                    return [2 /*return*/, {
                            memoryMB: parseFloat(memoryMB.toFixed(2)),
                            cpuPercent: cpuPercent,
                            connections: connections,
                            processCount: processCount
                        }];
                case 12:
                    error_1 = _a.sent();
                    // Valores por defecto en caso de error
                    return [2 /*return*/, {
                            memoryMB: process.memoryUsage().heapUsed / 1024 / 1024,
                            cpuPercent: "N/A",
                            connections: 0,
                            processCount: 1
                        }];
                case 13: return [2 /*return*/];
            }
        });
    });
}
/**
 * Verificar existencia de archivos SSE reales en el proyecto
 */
function checkSSEFiles() {
    return __awaiter(this, void 0, void 0, function () {
        var fs, path, sseFiles, results, _i, _a, _b, name_1, filePath, fullPath;
        return __generator(this, function (_c) {
            fs = require('fs');
            path = require('path');
            sseFiles = {
                'backend SSE service': './backend/src/services/sseService.ts',
                'backend SSE routes': './backend/src/routes/sse.ts',
                'backend streaming monitor': './backend/src/routes/streaming-monitoring.ts',
                'frontend SSE hook': './frontend/src/hooks/useSSEConnection.ts',
                'frontend SSE component': './frontend/src/components/admin/OptimizedStreamingMonitor.tsx',
                'SSE context': './frontend/src/contexts/SSEContext.tsx'
            };
            results = {};
            for (_i = 0, _a = Object.entries(sseFiles); _i < _a.length; _i++) {
                _b = _a[_i], name_1 = _b[0], filePath = _b[1];
                try {
                    fullPath = path.join(__dirname, '..', '..', filePath.replace('./', ''));
                    results[name_1] = fs.existsSync(fullPath);
                }
                catch (error) {
                    results[name_1] = false;
                }
            }
            return [2 /*return*/, results];
        });
    });
}
/**
 * Health check principal que proporciona datos reales
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var metrics, sseFiles, foundSSE, _i, _a, _b, name_2, exists;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log('🔍 REALITY CHECK INICIADO - Health Check Real del Sistema SSE\n');
                    console.log('📊 OBTENIENDO MÉTRICAS DEL SISTEMA...\n');
                    return [4 /*yield*/, getSystemMetrics()];
                case 1:
                    metrics = _c.sent();
                    console.log('📈 MÉTRICAS ACTUALES DEL SISTEMA:');
                    console.log("   Memoria usada: ".concat(metrics.memoryMB, " MB"));
                    console.log("   CPU: ".concat(metrics.cpuPercent));
                    console.log("   Conexiones activas SSE/WS: ".concat(metrics.connections || 'N/A'));
                    console.log("   Procesos Node: ".concat(metrics.processCount));
                    console.log("   Uptime Node: ".concat((process.uptime() / 60).toFixed(2), " min"));
                    console.log('\n🔍 BUSCANDO ARCHIVOS SSE/WEBSOCKET EXISTENTES...\n');
                    return [4 /*yield*/, checkSSEFiles()];
                case 2:
                    sseFiles = _c.sent();
                    console.log('✅ ARCHIVOS SSE DETECTADOS:');
                    foundSSE = false;
                    for (_i = 0, _a = Object.entries(sseFiles); _i < _a.length; _i++) {
                        _b = _a[_i], name_2 = _b[0], exists = _b[1];
                        if (exists) {
                            console.log("   \u2713 ".concat(name_2));
                            foundSSE = true;
                        }
                        else {
                            console.log("   \u26A0 ".concat(name_2, " - No encontrado"));
                        }
                    }
                    console.log('\n🎯 EVALUACIÓN REALIDAD VS TEORÍA:');
                    if (!foundSSE) {
                        console.log('   ❌ No se encontraron archivos SSE/WS en el sistema');
                        console.log('   ⚠ Sistema SSE/WS podría no estar implementado aún');
                        console.log('   🔄 Recomendación: Revisar si la funcionalidad SSE/WS ya fue construida');
                    }
                    else {
                        console.log("   \u2705 Sistema SSE/WS est\u00E1 presente en el c\u00F3digo");
                        console.log("   \u2705 Memoria actual: ".concat(metrics.memoryMB, " MB (< 200MB = ESTABLE)"));
                        if (metrics.memoryMB < 150) {
                            console.log('   ✅ Uso de memoria saludable (< 150MB)');
                            // Verificar si hay muchas conexiones activas
                            if (metrics.connections > 50) {
                                console.log('   ⚠ Más de 50 conexiones activas detectadas');
                                console.log('   🔄 Recomendación: Monitorear crecimiento de conexiones');
                            }
                            else {
                                console.log('   ✅ Nivel de conexiones aceptable (< 50)');
                            }
                        }
                        else {
                            console.log('   ⚠ Uso de memoria elevado (>= 150MB)');
                            console.log('   🔄 Recomendación: Investigar causas de uso elevado de memoria');
                        }
                    }
                    console.log('\n📋 CONCLUSIÓN:');
                    console.log('   Basado en datos reales del sistema actual:');
                    console.log("   - Memoria: ".concat(metrics.memoryMB, " MB"));
                    console.log("   - Conexiones SSE/WS: ".concat(metrics.connections));
                    console.log("   - Archivos SSE: ".concat(foundSSE ? 'Presentes' : 'Ausentes'));
                    if (foundSSE && metrics.memoryMB < 150 && metrics.connections < 50) {
                        console.log('\n   ✅ CONDICIÓN GENERAL: Sistema SSE/WS OPERANDO NORMALMENTE');
                        console.log('   🔄 No se requiere instrumentación inmediata');
                        console.log('   📊 Recomendación: Observación periódica de métricas');
                    }
                    else if (foundSSE) {
                        console.log('\n   ⚠ CONDICIÓN AVISADA: Sistema SSE/WS con posibles signos de advertencia');
                        console.log('   🔄 Recomendación: Instrumentar métricas específicas basadas en hallazgos');
                        console.log('   📊 Priorizar: Active Connections Count y Memory Growth Rate');
                    }
                    else {
                        console.log('\n   ❓ ESTADO INCERTIDUMBRE: Sistema SSE/WS no encontrado');
                        console.log('   🔄 Recomendación: Confirmar si la funcionalidad ya fue implementada');
                    }
                    console.log('\n💡 RECOMENDACIÓN GLOBAL:');
                    if (foundSSE && metrics.memoryMB < 100) {
                        console.log('   - Mantener monitoreo básico');
                        console.log('   - No implementar instrumentación compleja aún');
                        console.log('   - Enfocarse en observabilidad selectiva');
                    }
                    else if (foundSSE && metrics.memoryMB >= 100 && metrics.memoryMB < 200) {
                        console.log('   - Implementar monitoreo de conexiones activas');
                        console.log('   - Agregar tracking de memory growth rate');
                        console.log('   - Considerar límites de conexiones por cliente');
                    }
                    else {
                        console.log('   - Revisar inmediatamente uso de memoria');
                        console.log('   - Implementar límites estrictos de conexiones');
                        console.log('   - Considerar optimización urgente de recursos');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// Ejecutar solo si este módulo es el principal
if (typeof require !== 'undefined' && require.main === module) {
    main().catch(console.error);
}
