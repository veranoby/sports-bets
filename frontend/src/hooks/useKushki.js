"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.useKushki = void 0;
// frontend/src/hooks/useKushki.ts
var react_1 = require("react");
// Configuración Kushki
var KUSHKI_CONFIG = {
    publicKey: import.meta.env.VITE_KUSHKI_PUBLIC_KEY || "test-public-key",
    environment: (import.meta.env.VITE_KUSHKI_ENVIRONMENT || "sandbox"),
    currency: "USD",
    locale: "es",
};
var useKushki = function () {
    var _a = (0, react_1.useState)(false), loading = _a[0], setLoading = _a[1];
    var _b = (0, react_1.useState)(null), error = _b[0], setError = _b[1];
    var tokenizeCard = (0, react_1.useCallback)(function (cardData) { return __awaiter(void 0, void 0, void 0, function () {
        var response, result, err_1, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    if (!(KUSHKI_CONFIG.environment === "sandbox")) return [3 /*break*/, 3];
                    // Simular delay de red
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1500); })];
                case 2:
                    // Simular delay de red
                    _a.sent();
                    // Validaciones básicas
                    if (!cardData.number || cardData.number.length < 16) {
                        throw new Error("Número de tarjeta inválido");
                    }
                    if (!cardData.cvv || cardData.cvv.length < 3) {
                        throw new Error("CVV inválido");
                    }
                    if (!cardData.expiryMonth || !cardData.expiryYear) {
                        throw new Error("Fecha de expiración inválida");
                    }
                    // Retornar token simulado
                    return [2 /*return*/, "sim_token_".concat(Date.now(), "_").concat(Math.random()
                            .toString(36)
                            .substr(2, 9))];
                case 3: return [4 /*yield*/, fetch("https://api.kushkipagos.com/v1/tokens", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Public-Key": KUSHKI_CONFIG.publicKey,
                        },
                        body: JSON.stringify({
                            card: {
                                number: cardData.number.replace(/\s/g, ""),
                                cvv: cardData.cvv,
                                expiryMonth: cardData.expiryMonth,
                                expiryYear: cardData.expiryYear,
                                name: cardData.name,
                            },
                            currency: KUSHKI_CONFIG.currency,
                        }),
                    })];
                case 4:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 5:
                    result = _a.sent();
                    if (result.code !== "000") {
                        throw new Error(result.message || "Error al procesar la tarjeta");
                    }
                    return [2 /*return*/, result.token];
                case 6:
                    err_1 = _a.sent();
                    errorMessage = err_1 instanceof Error ? err_1.message : "Error al tokenizar tarjeta";
                    setError(errorMessage);
                    throw new Error(errorMessage);
                case 7:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); }, []);
    var processPayment = (0, react_1.useCallback)(function (paymentData) { return __awaiter(void 0, void 0, void 0, function () {
        var response, result, err_2, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("/api/wallet/process-payment", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "Bearer ".concat(localStorage.getItem("token")),
                            },
                            body: JSON.stringify(__assign(__assign({}, paymentData), { provider: "kushki", environment: KUSHKI_CONFIG.environment })),
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    if (!result.success) {
                        throw new Error(result.message || "Error al procesar pago");
                    }
                    return [2 /*return*/, result.data.transactionId];
                case 4:
                    err_2 = _a.sent();
                    errorMessage = err_2 instanceof Error ? err_2.message : "Error al procesar pago";
                    setError(errorMessage);
                    throw new Error(errorMessage);
                case 5:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); }, []);
    return {
        loading: loading,
        error: error,
        tokenizeCard: tokenizeCard,
        processPayment: processPayment,
        config: KUSHKI_CONFIG,
    };
};
exports.useKushki = useKushki;
