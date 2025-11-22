"use strict";
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
require("@testing-library/jest-dom");
var vitest_1 = require("vitest");
// Mock environment variables for testing
vitest_1.vi.mock("./config/env", function () { return ({
    API_URL: "http://localhost:3001/api",
    WS_URL: "http://localhost:3001",
    KUSHKI_PUBLIC_KEY: "test-key",
    APP_NAME: "SportsBets Test",
}); });
// Mock IntersectionObserver (required for some UI components)
global.IntersectionObserver = vitest_1.vi.fn().mockImplementation(function () { return ({
    disconnect: vitest_1.vi.fn(),
    observe: vitest_1.vi.fn(),
    unobserve: vitest_1.vi.fn(),
    root: null,
    rootMargin: "",
    thresholds: [],
    takeRecords: vitest_1.vi.fn().mockReturnValue([]),
}); });
// Mock ResizeObserver (required for charts and responsive components)
global.ResizeObserver = vitest_1.vi.fn(function () { return ({
    disconnect: vitest_1.vi.fn(),
    observe: vitest_1.vi.fn(),
    unobserve: vitest_1.vi.fn(),
}); });
// Mock matchMedia (required for responsive components)
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vitest_1.vi.fn().mockImplementation(function (query) { return ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vitest_1.vi.fn(), // deprecated
        removeListener: vitest_1.vi.fn(), // deprecated
        addEventListener: vitest_1.vi.fn(),
        removeEventListener: vitest_1.vi.fn(),
        dispatchEvent: vitest_1.vi.fn(),
    }); }),
});
// Mock localStorage
var localStorageMock = {
    getItem: vitest_1.vi.fn(),
    setItem: vitest_1.vi.fn(),
    removeItem: vitest_1.vi.fn(),
    clear: vitest_1.vi.fn(),
};
Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
});
// Mock sessionStorage
Object.defineProperty(window, "sessionStorage", {
    value: localStorageMock,
});
// Mock URL.createObjectURL (for file uploads/downloads)
global.URL.createObjectURL = vitest_1.vi.fn();
global.URL.revokeObjectURL = vitest_1.vi.fn();
// Console override for cleaner test output
var originalError = console.error;
beforeAll(function () {
    console.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (typeof args[0] === "string" &&
            args[0].includes("Warning: ReactDOM.render is no longer supported")) {
            return;
        }
        originalError.call.apply(originalError, __spreadArray([console], args, false));
    };
});
afterAll(function () {
    console.error = originalError;
});
