"use strict";
// Kushki Service for secure payment processing
// Handles card tokenization, validation, and payment flow
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
exports.validateCompleteCard = exports.getCardTypeIcon = exports.getCardTypeName = exports.formatExpiryDate = exports.formatCardNumber = exports.getCardType = exports.validateCVV = exports.validateExpiryDate = exports.validateCardNumber = exports.tokenizeCard = exports.initializeKushki = void 0;
var kushkiInstance = null;
/**
 * Initialize Kushki SDK with environment configuration
 */
var initializeKushki = function () { return __awaiter(void 0, void 0, void 0, function () {
    var publicKey, environment;
    return __generator(this, function (_a) {
        try {
            // Check if Kushki SDK is loaded
            if (!window.Kushki) {
                throw new Error("Kushki SDK not loaded. Please include the Kushki script.");
            }
            publicKey = import.meta.env.VITE_KUSHKI_PUBLIC_KEY;
            environment = import.meta.env.VITE_KUSHKI_ENVIRONMENT || "test";
            if (!publicKey) {
                throw new Error("Kushki public key not configured. Set VITE_KUSHKI_PUBLIC_KEY environment variable.");
            }
            // Initialize Kushki instance
            kushkiInstance = window.Kushki.init({
                publicKey: publicKey,
                environment: environment,
            });
            console.log("Kushki initialized in ".concat(environment, " mode"));
            return [2 /*return*/, true];
        }
        catch (error) {
            console.error("Failed to initialize Kushki:", error);
            throw new Error("Failed to initialize Kushki: ".concat(error.message));
        }
        return [2 /*return*/];
    });
}); };
exports.initializeKushki = initializeKushki;
/**
 * Tokenize card data securely with Kushki
 */
var tokenizeCard = function (cardData) { return __awaiter(void 0, void 0, void 0, function () {
    var requiredFields, _i, requiredFields_1, field, sanitizedCard, tokenResponse, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                requiredFields = [
                    "number",
                    "expiry_month",
                    "expiry_year",
                    "cvv",
                    "name",
                ];
                for (_i = 0, requiredFields_1 = requiredFields; _i < requiredFields_1.length; _i++) {
                    field = requiredFields_1[_i];
                    if (!cardData[field]) {
                        throw new Error("Missing required card fields: ".concat(field));
                    }
                }
                if (!!kushkiInstance) return [3 /*break*/, 2];
                return [4 /*yield*/, (0, exports.initializeKushki)()];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2:
                if (!kushkiInstance) {
                    throw new Error("Kushki not initialized");
                }
                sanitizedCard = {
                    number: cardData.number.replace(/\s/g, ""), // Remove spaces
                    expiryMonth: cardData.expiry_month.padStart(2, "0"), // Ensure 2 digits
                    expiryYear: cardData.expiry_year,
                    cvv: cardData.cvv,
                    name: cardData.name.trim(),
                };
                // Validate card data before sending
                if (!(0, exports.validateCardNumber)(sanitizedCard.number)) {
                    throw new Error("Invalid card number");
                }
                if (!(0, exports.validateExpiryDate)("".concat(sanitizedCard.expiryMonth, "/").concat(sanitizedCard.expiryYear))) {
                    throw new Error("Invalid expiry date");
                }
                if (!(0, exports.validateCVV)(sanitizedCard.cvv, (0, exports.getCardType)(sanitizedCard.number))) {
                    throw new Error("Invalid CVV");
                }
                return [4 /*yield*/, kushkiInstance.requestToken({
                        card: sanitizedCard,
                    })];
            case 3:
                tokenResponse = _a.sent();
                return [2 /*return*/, tokenResponse];
            case 4:
                error_1 = _a.sent();
                console.error("Card tokenization failed:", error_1);
                // Handle specific Kushki error codes
                if (error_1.code) {
                    switch (error_1.code) {
                        case "E100":
                            throw new Error("Invalid card number");
                        case "E101":
                            throw new Error("Invalid expiry date");
                        case "E102":
                            throw new Error("Invalid CVV");
                        case "E103":
                            throw new Error("Invalid cardholder name");
                        case "E104":
                            throw new Error("Card has expired");
                        case "E105":
                            throw new Error("Card is not supported");
                        case "E106":
                            throw new Error("Insufficient funds");
                        case "E107":
                            throw new Error("Card is blocked");
                        default:
                            throw new Error(error_1.message || "Payment processing failed");
                    }
                }
                throw new Error(error_1.message || "Payment processing failed");
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.tokenizeCard = tokenizeCard;
/**
 * Validate card number using Luhn algorithm
 */
var validateCardNumber = function (cardNumber) {
    if (!cardNumber || typeof cardNumber !== "string") {
        return false;
    }
    // Remove spaces and non-digits
    var number = cardNumber.replace(/\D/g, "");
    // Check length (13-19 digits for most cards)
    if (number.length < 13 || number.length > 19) {
        return false;
    }
    // Luhn algorithm
    var sum = 0;
    var isEven = false;
    for (var i = number.length - 1; i >= 0; i--) {
        var digit = parseInt(number[i], 10);
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        sum += digit;
        isEven = !isEven;
    }
    return sum % 10 === 0;
};
exports.validateCardNumber = validateCardNumber;
/**
 * Validate expiry date (MM/YY format)
 */
var validateExpiryDate = function (expiryDate) {
    if (!expiryDate || typeof expiryDate !== "string") {
        return false;
    }
    var match = expiryDate.match(/^(\d{2})\/(\d{2})$/);
    if (!match) {
        return false;
    }
    var month = parseInt(match[1], 10);
    var year = parseInt(match[2], 10) + 2000; // Convert YY to YYYY
    // Validate month
    if (month < 1 || month > 12) {
        return false;
    }
    // Check if date is in the future
    var now = new Date();
    var currentYear = now.getFullYear();
    var currentMonth = now.getMonth() + 1;
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return false;
    }
    return true;
};
exports.validateExpiryDate = validateExpiryDate;
/**
 * Validate CVV based on card type
 */
var validateCVV = function (cvv, cardType) {
    if (cardType === void 0) { cardType = ""; }
    if (!cvv || typeof cvv !== "string") {
        return false;
    }
    // Remove non-digits
    var digits = cvv.replace(/\D/g, "");
    // American Express uses 4-digit CVV, others use 3-digit
    var expectedLength = cardType === "amex" ? 4 : 3;
    return digits.length === expectedLength;
};
exports.validateCVV = validateCVV;
/**
 * Detect card type from card number
 */
var getCardType = function (cardNumber) {
    if (!cardNumber) {
        return "unknown";
    }
    // Remove spaces and non-digits
    var number = cardNumber.replace(/\D/g, "");
    // Card type patterns
    var patterns = {
        visa: /^4/,
        mastercard: /^5[1-5]|^2[2-7]/,
        amex: /^3[47]/,
        discover: /^6(?:011|5)/,
        diners: /^3[0689]/,
        jcb: /^35/,
    };
    for (var _i = 0, _a = Object.entries(patterns); _i < _a.length; _i++) {
        var _b = _a[_i], type = _b[0], pattern = _b[1];
        if (pattern.test(number)) {
            return type;
        }
    }
    return "unknown";
};
exports.getCardType = getCardType;
/**
 * Format card number with appropriate spacing
 */
var formatCardNumber = function (cardNumber) {
    if (!cardNumber) {
        return "";
    }
    // Remove all non-digits
    var number = cardNumber.replace(/\D/g, "");
    var cardType = (0, exports.getCardType)(number);
    // Limit length based on card type
    var maxLength = cardType === "amex" ? 15 : 16;
    var limitedNumber = number.slice(0, maxLength);
    // Format based on card type
    if (cardType === "amex") {
        // American Express: 4-6-5 format
        return limitedNumber
            .replace(/(\d{4})(\d{6})(\d{5})/, "$1 $2 $3")
            .replace(/(\d{4})(\d{6})(\d{1,5})/, "$1 $2 $3")
            .replace(/(\d{4})(\d{1,6})/, "$1 $2");
    }
    else {
        // Other cards: 4-4-4-4 format
        return limitedNumber.replace(/(\d{4})(?=\d)/g, "$1 ");
    }
};
exports.formatCardNumber = formatCardNumber;
/**
 * Format expiry date with slash (MM/YY)
 */
var formatExpiryDate = function (expiryDate) {
    if (!expiryDate) {
        return "";
    }
    // Remove non-digits
    var digits = expiryDate.replace(/\D/g, "");
    // Limit to 4 digits (MMYY)
    var limitedDigits = digits.slice(0, 4);
    // Add slash after MM
    if (limitedDigits.length >= 2) {
        return "".concat(limitedDigits.slice(0, 2), "/").concat(limitedDigits.slice(2));
    }
    return limitedDigits;
};
exports.formatExpiryDate = formatExpiryDate;
/**
 * Get user-friendly card type name
 */
var getCardTypeName = function (cardType) {
    var names = {
        visa: "Visa",
        mastercard: "Mastercard",
        amex: "American Express",
        discover: "Discover",
        diners: "Diners Club",
        jcb: "JCB",
        unknown: "Unknown",
    };
    return names[cardType] || "Unknown";
};
exports.getCardTypeName = getCardTypeName;
/**
 * Get card type icon/class for UI
 */
var getCardTypeIcon = function (cardType) {
    var icons = {
        visa: "fab fa-cc-visa",
        mastercard: "fab fa-cc-mastercard",
        amex: "fab fa-cc-amex",
        discover: "fab fa-cc-discover",
        diners: "fab fa-cc-diners-club",
        jcb: "fab fa-cc-jcb",
        unknown: "far fa-credit-card",
    };
    return icons[cardType] || icons.unknown;
};
exports.getCardTypeIcon = getCardTypeIcon;
/**
 * Validate complete card data
 */
var validateCompleteCard = function (cardData) {
    var errors = {};
    // Validate card number
    if (!cardData.number) {
        errors.number = "Card number is required";
    }
    else if (!(0, exports.validateCardNumber)(cardData.number)) {
        errors.number = "Invalid card number";
    }
    // Validate expiry date
    if (!cardData.expiry_month || !cardData.expiry_year) {
        errors.expiry = "Expiry date is required";
    }
    else {
        var expiryString = "".concat(cardData.expiry_month.padStart(2, "0"), "/").concat(cardData.expiry_year);
        if (!(0, exports.validateExpiryDate)(expiryString)) {
            errors.expiry = "Invalid expiry date";
        }
    }
    // Validate CVV
    if (!cardData.cvv) {
        errors.cvv = "CVV is required";
    }
    else {
        var cardType = (0, exports.getCardType)(cardData.number || "");
        if (!(0, exports.validateCVV)(cardData.cvv, cardType)) {
            errors.cvv = "Invalid CVV";
        }
    }
    // Validate cardholder name
    if (!cardData.name) {
        errors.name = "Cardholder name is required";
    }
    else if (cardData.name.trim().length < 2) {
        errors.name = "Cardholder name is too short";
    }
    return {
        isValid: Object.keys(errors).length === 0,
        errors: errors,
    };
};
exports.validateCompleteCard = validateCompleteCard;
exports.default = {
    initializeKushki: exports.initializeKushki,
    tokenizeCard: exports.tokenizeCard,
    validateCardNumber: exports.validateCardNumber,
    validateExpiryDate: exports.validateExpiryDate,
    validateCVV: exports.validateCVV,
    getCardType: exports.getCardType,
    formatCardNumber: exports.formatCardNumber,
    formatExpiryDate: exports.formatExpiryDate,
    getCardTypeName: exports.getCardTypeName,
    getCardTypeIcon: exports.getCardTypeIcon,
    validateCompleteCard: exports.validateCompleteCard,
};
