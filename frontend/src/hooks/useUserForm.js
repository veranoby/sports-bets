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
exports.useUserForm = void 0;
var react_1 = require("react");
var api_1 = require("../services/api");
var useToast_1 = require("../hooks/useToast");
var useUserForm = function (mode, role, initialUser) {
    var addToast = (0, useToast_1.useToast)().addToast;
    var _a = (0, react_1.useState)(function () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        if (mode === "edit" && initialUser) {
            return {
                username: initialUser.username,
                email: initialUser.email,
                password: undefined,
                role: initialUser.role,
                isActive: initialUser.isActive,
                approved: initialUser.approved || true,
                profileInfo: {
                    fullName: ((_a = initialUser.profileInfo) === null || _a === void 0 ? void 0 : _a.fullName) || "",
                    phoneNumber: ((_b = initialUser.profileInfo) === null || _b === void 0 ? void 0 : _b.phoneNumber) || "",
                    images: ((_c = initialUser.profileInfo) === null || _c === void 0 ? void 0 : _c.images) || [],
                    verificationLevel: ((_d = initialUser.profileInfo) === null || _d === void 0 ? void 0 : _d.verificationLevel) || "none",
                    venueName: ((_e = initialUser.profileInfo) === null || _e === void 0 ? void 0 : _e.venueName) || "",
                    venueLocation: ((_f = initialUser.profileInfo) === null || _f === void 0 ? void 0 : _f.venueLocation) || "",
                    venueDescription: ((_g = initialUser.profileInfo) === null || _g === void 0 ? void 0 : _g.venueDescription) || "",
                    venueEmail: ((_h = initialUser.profileInfo) === null || _h === void 0 ? void 0 : _h.venueEmail) || "",
                    venueWebsite: ((_j = initialUser.profileInfo) === null || _j === void 0 ? void 0 : _j.venueWebsite) || "",
                    galleraName: ((_k = initialUser.profileInfo) === null || _k === void 0 ? void 0 : _k.galleraName) || "",
                    galleraLocation: ((_l = initialUser.profileInfo) === null || _l === void 0 ? void 0 : _l.galleraLocation) || "",
                    galleraDescription: ((_m = initialUser.profileInfo) === null || _m === void 0 ? void 0 : _m.galleraDescription) || "",
                    galleraEmail: ((_o = initialUser.profileInfo) === null || _o === void 0 ? void 0 : _o.galleraEmail) || "",
                    galleraWebsite: ((_p = initialUser.profileInfo) === null || _p === void 0 ? void 0 : _p.galleraWebsite) || "",
                    galleraSpecialties: ((_q = initialUser.profileInfo) === null || _q === void 0 ? void 0 : _q.galleraSpecialties) || [],
                    galleraActiveRoosters: ((_r = initialUser.profileInfo) === null || _r === void 0 ? void 0 : _r.galleraActiveRoosters) || [],
                },
            };
        }
        else {
            return {
                username: "",
                email: "",
                password: "",
                role: role,
                isActive: true,
                approved: true,
                profileInfo: {
                    fullName: "",
                    phoneNumber: "",
                    images: [],
                    verificationLevel: "none",
                    venueName: "",
                    venueLocation: "",
                    venueDescription: "",
                    venueEmail: "",
                    venueWebsite: "",
                    galleraName: "",
                    galleraLocation: "",
                    galleraDescription: "",
                    galleraEmail: "",
                    galleraWebsite: "",
                    galleraSpecialties: [],
                    galleraActiveRoosters: [],
                },
            };
        }
    }), formData = _a[0], setFormData = _a[1];
    var _b = (0, react_1.useState)(null), error = _b[0], setError = _b[1];
    var handleChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value, type = _a.type;
        var checked = e.target.checked;
        // Check if it's a nested field (contains dot notation)
        if (name.includes(".")) {
            var _b = name.split("."), parent_1 = _b[0], child_1 = _b[1];
            if (parent_1 === "profileInfo") {
                // Handle profileInfo nested fields correctly
                setFormData(function (prev) {
                    var _a;
                    return (__assign(__assign({}, prev), { profileInfo: __assign(__assign({}, prev.profileInfo), (_a = {}, _a[child_1] = value, _a)) }));
                });
            }
            else {
                // Handle other nested fields if any
                setFormData(function (prev) {
                    var _a, _b;
                    return (__assign(__assign({}, prev), (_a = {}, _a[parent_1] = __assign(__assign({}, prev[parent_1]), (_b = {}, _b[child_1] = value, _b)), _a)));
                });
            }
        }
        else {
            // Handle root level fields (checkboxes, username, email, etc.)
            setFormData(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = type === "checkbox" ? checked : value, _a)));
            });
        }
    };
    var handleArrayChange = function (field, value) {
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), { profileInfo: __assign(__assign({}, prev.profileInfo), (_a = {}, _a[field] = value ? value.split(",").map(function (s) { return s.trim(); }) : [], _a)) }));
        });
    };
    var handleImagesChange = function (images) {
        setFormData(function (prev) { return (__assign(__assign({}, prev), { profileInfo: __assign(__assign({}, prev.profileInfo), { images: images }) })); });
    };
    var handleSubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
        var createUserData, res, errorMessage, err_1, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 12, , 13]);
                    if (!(mode === "create")) return [3 /*break*/, 3];
                    createUserData = {
                        username: formData.username,
                        email: formData.email,
                        password: formData.password || "",
                        role: formData.role,
                        profileInfo: __assign({}, formData.profileInfo),
                    };
                    return [4 /*yield*/, api_1.userAPI.create(createUserData)];
                case 2:
                    res = _a.sent();
                    if (res.success) {
                        addToast({
                            type: "success",
                            title: "Usuario Creado",
                            message: "El usuario ".concat(formData.username, " ha sido creado exitosamente."),
                        });
                        return [2 /*return*/, res];
                    }
                    else {
                        errorMessage = res.error || "Ocurrió un error al crear el usuario.";
                        setError(errorMessage);
                        addToast({
                            type: "error",
                            title: "Error al Crear",
                            message: errorMessage,
                        });
                        throw new Error(errorMessage);
                    }
                    return [3 /*break*/, 11];
                case 3:
                    if (!(mode === "edit" && initialUser)) return [3 /*break*/, 11];
                    // For edit mode, update the profile info
                    return [4 /*yield*/, api_1.userAPI.updateProfile({
                            profileInfo: formData.profileInfo,
                        })];
                case 4:
                    // For edit mode, update the profile info
                    _a.sent();
                    if (!(formData.role !== initialUser.role)) return [3 /*break*/, 6];
                    return [4 /*yield*/, api_1.userAPI.updateRole(initialUser.id, formData.role)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    if (!(formData.isActive !== initialUser.isActive)) return [3 /*break*/, 8];
                    return [4 /*yield*/, api_1.userAPI.updateStatus(initialUser.id, formData.isActive)];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8:
                    if (!(formData.approved !== initialUser.approved)) return [3 /*break*/, 10];
                    return [4 /*yield*/, api_1.userAPI.update(initialUser.id, {
                            approved: formData.approved,
                        })];
                case 9:
                    _a.sent();
                    _a.label = 10;
                case 10:
                    addToast({
                        type: "success",
                        title: "Usuario Actualizado",
                        message: "El usuario ".concat(formData.username, " ha sido actualizado exitosamente."),
                    });
                    return [2 /*return*/, { success: true, data: __assign(__assign({}, initialUser), formData) }];
                case 11: return [3 /*break*/, 13];
                case 12:
                    err_1 = _a.sent();
                    errorMessage = err_1 instanceof Error
                        ? err_1.message
                        : "Ocurrió un error al procesar el usuario.";
                    setError(errorMessage);
                    addToast({
                        type: "error",
                        title: "Error",
                        message: errorMessage,
                    });
                    throw err_1;
                case 13: return [2 /*return*/];
            }
        });
    }); };
    return {
        formData: formData,
        handleChange: handleChange,
        handleArrayChange: handleArrayChange,
        handleImagesChange: handleImagesChange,
        handleSubmit: handleSubmit,
        error: error,
        setError: setError,
    };
};
exports.useUserForm = useUserForm;
