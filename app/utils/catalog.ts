export const CATEGORY_SLUGS = ['life', 'health', 'accident', 'travel', 'home', 'car', 'business'] as const;
export type CategorySlug = typeof CATEGORY_SLUGS[number];
export type CategoryFilter = CategorySlug | 'all';

export function categoryFilter(value: string | null): CategoryFilter {
  return CATEGORY_SLUGS.includes(value as CategorySlug) ? value as CategorySlug : 'all';
}

export function normalizeSearch(value: string): string {
  return value.normalize('NFKC').trim().toLocaleLowerCase();
}

export function focusSection(id: string) {
  const element = document.getElementById(id);
  if (!element) return;
  const heading = element.querySelector<HTMLElement>('h2') ?? element;
  heading.focus({ preventScroll: true });
  element.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
}
