"use strict";
// frontend/src/hooks/useToast.ts
// ================================================================
// 🍞 USE TOAST: Hook para manejo global de notificaciones
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
exports.useToast = void 0;
var react_1 = require("react");
var toastId = 0;
var useToast = function () {
    var _a = (0, react_1.useState)([]), toasts = _a[0], setToasts = _a[1];
    var addToast = (0, react_1.useCallback)(function (payload) {
        var type = payload.type, title = payload.title, description = payload.description, message = payload.message, options = payload.options;
        var id = "toast-".concat(++toastId);
        var newToast = {
            id: id,
            type: type,
            title: title,
            description: description || message,
            duration: options === null || options === void 0 ? void 0 : options.duration,
            persistent: options === null || options === void 0 ? void 0 : options.persistent,
        };
        setToasts(function (prev) { return __spreadArray(__spreadArray([], prev, true), [newToast], false); });
        return id;
    }, []);
    var removeToast = (0, react_1.useCallback)(function (id) {
        setToasts(function (prev) { return prev.filter(function (toast) { return toast.id !== id; }); });
    }, []);
    var clearAllToasts = (0, react_1.useCallback)(function () {
        setToasts([]);
    }, []);
    // Métodos de conveniencia
    var toast = {
        success: function (title, description, options) { return addToast({ type: "success", title: title, description: description, options: options }); },
        error: function (title, description, options) { return addToast({ type: "error", title: title, description: description, options: options }); },
        warning: function (title, description, options) { return addToast({ type: "warning", title: title, description: description, options: options }); },
        info: function (title, description, options) { return addToast({ type: "info", title: title, description: description, options: options }); },
    };
    return {
        toasts: toasts,
        toast: toast,
        addToast: addToast,
        removeToast: removeToast,
        clearAllToasts: clearAllToasts,
    };
};
exports.useToast = useToast;
