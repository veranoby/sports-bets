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
exports.useStreamControl = void 0;
var react_1 = require("react");
var api_1 = require("../services/api");
var useStreamControl = function () {
    var _a = (0, react_1.useState)({
        start: false,
        stop: false,
        pause: false,
        resume: false,
    }), loadingStates = _a[0], setLoadingStates = _a[1];
    var _b = (0, react_1.useState)(null), error = _b[0], setError = _b[1];
    var updateLoadingState = (0, react_1.useCallback)(function (operation, value) {
        setLoadingStates(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[operation] = value, _a)));
        });
    }, []);
    var getIsLoading = (0, react_1.useCallback)(function () {
        return Object.values(loadingStates).some(function (value) { return value === true; });
    }, [loadingStates]);
    var handleStartStream = (0, react_1.useCallback)(function (eventId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (loadingStates.start)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    updateLoadingState("start", true);
                    setError(null);
                    return [4 /*yield*/, api_1.streamingAPI.startStream(eventId)];
                case 2:
                    response = _a.sent();
                    if (!response.success) {
                        throw new Error(response.error || "Failed to start stream");
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    console.error("Error starting stream:", err_1);
                    setError(err_1 instanceof Error ? err_1.message : "Error starting stream");
                    return [3 /*break*/, 5];
                case 4:
                    updateLoadingState("start", false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [loadingStates.start, updateLoadingState]);
    var handleStopStream = (0, react_1.useCallback)(function (eventId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (loadingStates.stop)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    updateLoadingState("stop", true);
                    setError(null);
                    return [4 /*yield*/, api_1.streamingAPI.stopStream(eventId)];
                case 2:
                    response = _a.sent();
                    if (!response.success) {
                        throw new Error(response.error || "Failed to stop stream");
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_2 = _a.sent();
                    console.error("Error stopping stream:", err_2);
                    setError(err_2 instanceof Error ? err_2.message : "Error stopping stream");
                    return [3 /*break*/, 5];
                case 4:
                    updateLoadingState("stop", false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [loadingStates.stop, updateLoadingState]);
    var handlePauseStream = (0, react_1.useCallback)(function (eventId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (loadingStates.pause)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    updateLoadingState("pause", true);
                    setError(null);
                    return [4 /*yield*/, api_1.streamingAPI.pauseStream(eventId)];
                case 2:
                    response = _a.sent();
                    if (!response.success) {
                        throw new Error(response.error || "Failed to pause stream");
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_3 = _a.sent();
                    console.error("Error pausing stream:", err_3);
                    setError(err_3 instanceof Error ? err_3.message : "Error pausing stream");
                    return [3 /*break*/, 5];
                case 4:
                    updateLoadingState("pause", false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [loadingStates.pause, updateLoadingState]);
    var handleResumeStream = (0, react_1.useCallback)(function (eventId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (loadingStates.resume)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    updateLoadingState("resume", true);
                    setError(null);
                    return [4 /*yield*/, api_1.streamingAPI.resumeStream(eventId)];
                case 2:
                    response = _a.sent();
                    if (!response.success) {
                        throw new Error(response.error || "Failed to resume stream");
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_4 = _a.sent();
                    console.error("Error resuming stream:", err_4);
                    setError(err_4 instanceof Error ? err_4.message : "Error resuming stream");
                    return [3 /*break*/, 5];
                case 4:
                    updateLoadingState("resume", false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [loadingStates.resume, updateLoadingState]);
    return {
        handleStartStream: handleStartStream,
        handleStopStream: handleStopStream,
        handlePauseStream: handlePauseStream,
        handleResumeStream: handleResumeStream,
        isLoading: getIsLoading(),
        error: error,
    };
};
exports.useStreamControl = useStreamControl;
