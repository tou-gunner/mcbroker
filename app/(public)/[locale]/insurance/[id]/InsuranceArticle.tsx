import { createElement } from 'react';
import { attributesToProps, domToReact, htmlToDOM, type Element, type DOMNode, type HTMLReactParserOptions } from 'html-react-parser';
import { getTranslations } from 'next-intl/server';
import { articleText, cleanArticleHtml, hasArticleHtml, isArticleElement } from '@/app/lib/article-html';
import ArticleImage from './ArticleImage';

export default async function InsuranceArticle({ html, text, language }: { html: string | null; text: string | null; language: string }) {
  const t = await getTranslations('insurance');
  if (!hasArticleHtml(html)) return <div className="insurance-article" lang={language}>{text?.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>;
  const clean = cleanArticleHtml(html!);
  const ids = new Map<string, string>();
  const tables = new Map<Element, number>();
  const nodes = htmlToDOM(clean);
  function collectIds(nodes: DOMNode[]) {
    for (const node of nodes) if (isArticleElement(node)) {
      if (node.attribs.id && !ids.has(node.attribs.id)) ids.set(node.attribs.id, `article-${ids.size + 1}`);
      if (node.name === 'table') tables.set(node, tables.size + 1);
      collectIds(node.children as DOMNode[]);
    }
  }
  collectIds(nodes);
  const renderedIds = new Set<string>();
  const options: HTMLReactParserOptions = {
    replace(node) {
      if (!isArticleElement(node)) return;
      const attributes = { ...node.attribs };
      if (attributes.id) {
        const original = attributes.id;
        if (renderedIds.has(original)) delete attributes.id;
        else { attributes.id = ids.get(original)!; renderedIds.add(original); }
      }
      if (node.name === 'a') {
        if (attributes.target === '_blank') attributes.rel = 'noopener noreferrer';
        if (attributes.href?.startsWith('#') && ids.has(attributes.href.slice(1))) attributes.href = `#${ids.get(attributes.href.slice(1))}`;
      }
      if (node.name === 'img') {
        if (!attributes.src) return <></>;
        const dimension = (value?: string) => value && /^\d+$/.test(value) && Number(value) > 0 && Number(value) <= 10000 ? Number(value) : undefined;
        return <ArticleImage id={attributes.id} src={attributes.src} alt={attributes.alt} width={dimension(attributes.width)} height={dimension(attributes.height)} title={attributes.title} />;
      }
      const props = attributesToProps(attributes);
      if (node.name === 'table') {
        const caption = node.children.find(child => isArticleElement(child) && child.name === 'caption');
        const label = caption && isArticleElement(caption) ? articleText(caption.children as DOMNode[]).trim() : '';
        return <div className="article-table-scroll" role="region" aria-label={label || t('tableLabel', { number: tables.get(node)! })} tabIndex={0}><table {...props}>{domToReact(node.children as DOMNode[], options)}</table></div>;
      }
      // Recreate only elements whose attributes need changing; the parser handles other nodes.
      if (node.attribs.id || node.name === 'a') return ['br', 'hr', 'col'].includes(node.name) ? createElement(node.name, props) : createElement(node.name, props, domToReact(node.children as DOMNode[], options));
    },
  };
  return <div className="insurance-article" lang={language}>{domToReact(nodes, options)}</div>;
}
