import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create a DOM purifier instance
const window = new JSDOM('').window;
const purify = DOMPurify(window);

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
export const sanitizeArticleContent = (req: Request, res: Response, next: NextFunction) => {
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
  } catch (error) {
    next(error);
  }
};

/**
 * Utility function to sanitize HTML content
 */
export const sanitizeHTML = (content: string, allowBasicHTML: boolean = true): string => {
  const config = allowBasicHTML ? sanitizeConfig : { ALLOWED_TAGS: [], ALLOWED_ATTR: [] };
  return purify.sanitize(content, config);
};