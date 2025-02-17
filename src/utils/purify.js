// src/utils/purify.js
import DOMPurify from 'dompurify';

export function purifyHtml(content) {
  return DOMPurify.sanitize(content);
}
