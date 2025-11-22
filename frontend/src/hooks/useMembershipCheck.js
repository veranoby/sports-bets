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
exports.useMembershipCheck = void 0;
var react_1 = require("react");
var api_1 = require("../services/api");
var useMembershipCheck = function () {
    var _a = (0, react_1.useState)(null), membershipStatus = _a[0], setMembershipStatus = _a[1];
    var _b = (0, react_1.useState)(false), loading = _b[0], setLoading = _b[1];
    var _c = (0, react_1.useState)(0), lastCheck = _c[0], setLastCheck = _c[1];
    var checkMembership = (0, react_1.useCallback)(function () {
        var args_1 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args_1[_i] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (force) {
            var now, fiveMinutes, cachedExpiration, cachedType, expirationTime, hasExpired, cachedStatus, response, status_1, error_1, fallbackStatus;
            if (force === void 0) { force = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = Date.now();
                        fiveMinutes = 5 * 60 * 1000;
                        // Skip if checked within last 5 minutes and not forced
                        if (!force && now - lastCheck < fiveMinutes && membershipStatus) {
                            return [2 /*return*/, membershipStatus];
                        }
                        cachedExpiration = localStorage.getItem("membership_expires_at");
                        cachedType = localStorage.getItem("membership_type");
                        if (cachedExpiration && !force) {
                            expirationTime = new Date(cachedExpiration).getTime();
                            hasExpired = now > expirationTime;
                            if (!hasExpired) {
                                cachedStatus = {
                                    membership_valid: true,
                                    current_status: "active",
                                    expires_at: cachedExpiration,
                                    membership_type: cachedType || "24h",
                                };
                                setMembershipStatus(cachedStatus);
                                setLastCheck(now);
                                return [2 /*return*/, cachedStatus];
                            }
                        }
                        // API verification needed
                        setLoading(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, api_1.authAPI.checkMembershipStatus()];
                    case 2:
                        response = (_a.sent());
                        status_1 = response.data;
                        // Update localStorage
                        if (status_1.expires_at) {
                            localStorage.setItem("membership_expires_at", status_1.expires_at);
                            localStorage.setItem("membership_type", status_1.membership_type);
                        }
                        else {
                            localStorage.removeItem("membership_expires_at");
                            localStorage.removeItem("membership_type");
                        }
                        localStorage.setItem("last_membership_check", now.toString());
                        setMembershipStatus(status_1);
                        setLastCheck(now);
                        return [2 /*return*/, status_1];
                    case 3:
                        error_1 = _a.sent();
                        console.error("Membership check failed:", error_1);
                        fallbackStatus = {
                            membership_valid: false,
                            current_status: "free",
                            expires_at: null,
                            membership_type: "free",
                        };
                        setMembershipStatus(fallbackStatus);
                        return [2 /*return*/, fallbackStatus];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }, [membershipStatus, lastCheck]);
    // Auto-check on mount
    (0, react_1.useEffect)(function () {
        checkMembership();
    }, [checkMembership]);
    return {
        membershipStatus: membershipStatus,
        loading: loading,
        checkMembership: checkMembership,
        refreshMembership: function () { return checkMembership(true); },
    };
};
exports.useMembershipCheck = useMembershipCheck;
exports.default = exports.useMembershipCheck;
