"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeHTML = exports.sanitizeArticleContent = void 0;
const dompurify_1 = __importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
// Create a DOM purifier instance
const window = new jsdom_1.JSDOM('').window;
const purify = (0, dompurify_1.default)(window);
// Configure DOMPurify to allow safe HTML elements
const sanitizeConfig = {
    ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'blockquote', 'a', 'img'
    ],
    ALLOWED_ATTR: [
        'href', 'target', 'rel', 'src', 'alt', 'title', 'class'
    ],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout']
};
/**
 * Middleware to sanitize HTML content in article fields
 */
const sanitizeArticleContent = (req, res, next) => {
    try {
        if (req.body.content) {
            req.body.content = purify.sanitize(req.body.content, sanitizeConfig);
        }
        if (req.body.summary) {
            // Summary should be plain text only
            req.body.summary = purify.sanitize(req.body.summary, {
                ALLOWED_TAGS: [],
                ALLOWED_ATTR: []
            });
        }
        if (req.body.title) {
            // Title should be plain text only
            req.body.title = purify.sanitize(req.body.title, {
                ALLOWED_TAGS: [],
                ALLOWED_ATTR: []
            });
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.sanitizeArticleContent = sanitizeArticleContent;
/**
 * Utility function to sanitize HTML content
 */
const sanitizeHTML = (content, allowBasicHTML = true) => {
    const config = allowBasicHTML ? sanitizeConfig : { ALLOWED_TAGS: [], ALLOWED_ATTR: [] };
    return purify.sanitize(content, config);
};
exports.sanitizeHTML = sanitizeHTML;
