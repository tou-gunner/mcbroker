import sanitizeHtml from 'sanitize-html';
import { htmlToDOM, type Element, type DOMNode } from 'html-react-parser';

const width = [/^\d{1,4}(?:px|%)$/];

/** Sanitize only a display copy. Authored content in storage is never rewritten. */
export function cleanArticleHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'sup', 'sub', 'blockquote', 'pre', 'code', 'hr', 'a', 'img', 'span', 'div', 'figure', 'figcaption', 'table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col'],
    allowedAttributes: {
      '*': ['id', 'style', 'lang', 'dir'],
      a: ['href', 'title', 'target'],
      img: ['src', 'alt', 'width', 'height', 'title'],
      table: ['width'], col: ['width', 'span'], colgroup: ['span'],
      th: ['colspan', 'rowspan', 'scope', 'width'], td: ['colspan', 'rowspan', 'width'],
      ol: ['start', 'reversed'], li: ['value'],
    },
    allowedStyles: {
      '*': { 'text-align': [/^(left|center|right|justify)$/] },
      table: { width }, th: { width }, td: { width }, col: { width },
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    allowProtocolRelative: false,
    nonTextTags: ['script', 'style', 'textarea', 'option', 'iframe', 'object', 'embed', 'svg', 'math', 'template'],
    transformTags: { h1: 'h2' },
  });
}

// Parser dependencies can contain different domhandler versions; use node shape, not instanceof.
export function isArticleElement(node: DOMNode | Element['children'][number]): node is Element {
  return node.type === 'tag' || node.type === 'script' || node.type === 'style';
}

export function articleText(nodes: DOMNode[]): string {
  return nodes.map(node => node.type === 'text' ? node.data : isArticleElement(node) ? articleText(node.children as DOMNode[]) : '').join('');
}

export function hasArticleHtml(html: string | null): boolean {
  if (!html) return false;
  const nodes = htmlToDOM(cleanArticleHtml(html));
  function meaningful(items: DOMNode[]): boolean {
    return items.some(node => node.type === 'text' ? Boolean(node.data.replace(/[\s\u200B-\u200D\uFEFF]/g, ''))
      : isArticleElement(node) && (node.name === 'img' && Boolean(node.attribs.src) || meaningful(node.children as DOMNode[])));
  }
  return meaningful(nodes);
}
