# MC Broker public website design

Status: homepage and company profile implemented and verified; insurance detail redesign pending. Updated: 2026-10-03.

This document guides the design, implementation, and review of MC Broker's public website. The status above distinguishes delivered work from the remaining specifications. All current company information, insurance content, contact details, statistics, and other business data are development/test data.

## 1. Purpose and scope

Help individuals, families, and businesses in Laos understand their insurance options and reach an advisor. The main journey is **explore insurance → view an insurer and its products → contact an advisor**. Visitors should be able to browse without submitting personal information.

Cover the homepage, insurer profiles, insurance details, shared navigation and footer, and public loading, empty, error, and unavailable-content states. Deliver the same experience in Lao and English, with Lao remaining the default language.

The selected direction is calm and modern: navy and blue, warm white surfaces, pale mint accents, generous spacing, readable typography, and a visible human contact path. Retain the MC Broker name and existing logo. Use existing assets and placeholders only.

Admin redesign, account features, inquiry forms, online purchasing, automated quoting, side-by-side price comparison, new photography, and generated imagery are outside this redesign. Phone and WhatsApp are the main contact channels; email belongs in the footer.

Success means visitors can identify a suitable category, understand what an insurer offers, read a product, and find contact options on either desktop or mobile. The design must remain usable with long Lao text, incomplete test content, unavailable images, and an empty catalog.

## 2. Visual system

### Color roles

Use semantic tokens scoped to the public website. The names below describe the target system, not existing CSS variables.

| Token | Value | Use |
| --- | --- | --- |
| `public-ink` | `#102D47` | Headings, primary text, footer background |
| `public-primary` | `#1769E0` | Primary actions, text links, selected controls, focus |
| `public-primary-hover` | `#1254B5` | Primary action hover and pressed feedback |
| `public-background` | `#F7F8F5` | Page background and alternating sections |
| `public-surface` | `#FFFFFF` | Cards, header, inputs, reading surfaces |
| `public-accent` | `#E8F3EC` | Supporting panels and category-icon backgrounds |
| `public-muted` | `#526476` | Secondary text and supporting descriptions |
| `public-border` | `#DCE3E8` | Decorative separators and card borders |
| `public-control-border` | `#738395` | Input and outlined-control boundaries |
| `public-error` | `#B42318` | Error text and error indicators |

Use white text on primary-blue and navy surfaces. On mint, use ink for body text and the darker `public-primary-hover` blue for text links; the primary blue alone does not meet 4.5:1 for small text on mint. Decorative borders must not be the only cue identifying an interactive control. Errors also need text or an icon. Preserve original colors within existing brand and insurer logos.

### Typography and spacing

Use Inter for English and the existing local Phetsarath font for Lao, with regular (400) and bold (700) weights. Ensure the English font loader includes 700. Avoid synthetic intermediate weights for Lao. Replace Poppins in public UI during implementation. Labels, text embedded in components, and empty states must use the current locale's font.

| Role | English, mobile / desktop | Lao, mobile / desktop |
| --- | --- | --- |
| Hero heading | 36 / 56px, line height 1.15 | 32 / 44px, line height 1.45 |
| Detail-page heading | 32 / 44px, line height 1.2 | 30 / 38px, line height 1.45 |
| Section heading | 28 / 36px, line height 1.25 | 26 / 32px, line height 1.5 |
| Card heading | 20 / 22px, line height 1.35 | 20 / 22px, line height 1.5 |
| Body | 16 / 18px, line height 1.6 | 18 / 18px, line height 1.75 |
| Labels and supporting text | 14 / 14px, line height 1.5 | 16 / 16px, line height 1.7 |

Desktop type sizes begin at 1024px. Let headings and buttons grow vertically; do not truncate titles. Do not apply uppercase transformations, wide letter spacing, or forced word breaks to Lao text. Keep paragraphs to approximately 65 characters per line where practical.

Use an 8px spacing rhythm, allowing 4px for tight icon/text relationships. Content width is capped at 1200px. Page gutters are 20px below 768px and 32px from 768px. Section padding is 48px vertically on mobile and 80px from 1024px; card padding is 24px and grid gaps are 24px. Use 32–48px between a section heading and its content.

### Components and interaction

- Primary buttons: blue with white text. Secondary buttons: white with ink text and a control border. Use descriptive text links for tertiary actions.
- Main buttons and inputs have a minimum height of 48px and a 12px corner radius. Use a minimum 44×44px target for icon-only controls; enlarge controls when Lao labels wrap.
- Cards have 20px corners, a fine border, and at most a restrained shadow (`0 8px 24px rgb(16 45 71 / 8%)`). Use shadow and border feedback on hover without changing layout.
- Use consistent category icons from the existing `react-icons` library. Icons accompany labels; decorative icons are hidden from assistive technology.
- Use a 2px blue focus outline with 3px offset on light surfaces and a white outline on navy. Focus must remain visible outside clipped or scrolling containers.
- Transition colors, borders, and shadows over 150–200ms. Respect `prefers-reduced-motion`; do not require animation to discover information. No automatic carousel, parallax, or delayed reveal of essential content.

### Images and placeholders

Reuse the existing logo, active banner images, insurer logos, and insurance thumbnails. Render logos with `object-fit: contain` on white, preserving their proportions. Hero artwork uses a 4:3 frame; product thumbnail frames use 16:9. Reserve dimensions before images load.

Use `object-fit: cover` for photographic images when the crop preserves the subject. Existing banners containing text or logos use `contain` on a neutral surface. Keep the HTML hero copy beside the image, not over it. Do not depend on embedded image text to communicate important information.

Missing or broken hero and product images become pale-mint panels with a relevant category icon; missing insurer logos become a neutral building icon. Keep the associated name visible in HTML. These are visual placeholders, not invented company logos, customer portraits, or testimonials. Use empty alt text for decorative or immediately duplicated images; give informative images a concise description.

## 3. Page specifications

### Shared header and footer

Use an opaque white sticky header, a subtle bottom border, and a 72px minimum height. The logo links home. Desktop navigation contains Insurance types, Insurers, How it works, and FAQ, followed by a Lao/English switch and Talk to an advisor action. Use a mobile menu below 1024px.

The mobile menu opens as a dialog, traps focus, closes on Escape, and returns focus to its trigger. Close it after navigation. Both languages must be named explicitly: `ລາວ` and `English`. Language switching preserves the current page, search/filter query, and relevant anchor.

Homepage section anchors are `#insurance-types`, `#company-list`, `#how-it-works`, `#faq`, and `#contact`. Links from detail pages to homepage sections must include the localized homepage path. Each page has one `#contact` target. Account for the sticky header using scroll margins.

The navy footer contains the existing logo, a concise business description, navigation links, insurance categories, and configured contact information. Category links open the corresponding homepage filter. Use contact settings as the single source of truth for footer and page actions. Omit unavailable address and email fields rather than filling them with invented business details.

### Homepage

Render these sections in order:

1. **Hero:** two balanced columns from 1024px, copy first and artwork second; stack on smaller screens. Use one static image: the first active banner returned by the existing API. Preserve localized `hero_title` and `hero_subtitle` overrides. Proposed fallback copy is “Protect what matters. Understand your options.” and “Explore insurance for your life, family, and business with guidance from MC Broker.” Provide equivalent Lao copy. Primary action Explore insurance targets `#insurance-types`; secondary action Talk to an advisor targets `#contact`. A banner's valid `linkUrl`, when present, is a separate View featured information link below its artwork.
2. **Insurance types:** “What would you like to protect?” followed by seven category choices, each with an icon, name, and short explanation. Use two columns below 768px, four from 768px, and seven from 1024px; the final item stays left-aligned in incomplete rows. Each choice applies its filter and moves to the insurer directory.
3. **Insurer directory:** left-aligned heading, labeled name-search field, category filter controls, result count, and cards. Use one card column below 768px, two from 768px, and three from 1024px. Each card contains the insurer logo, full name, up to three lines of description, available-category labels, and View plans. Use a single clear link target per card; category labels are informational.
4. **How it works:** three numbered steps—share your needs, discuss your options, and arrange coverage—with short editable explanations. Use three columns on desktop and a vertical sequence on mobile. A supporting visual may reuse a suitable existing asset; otherwise use a neutral placeholder. Avoid unsourced promises about turnaround time, pricing, or claims outcomes.
5. **FAQ:** readable, independently expandable questions in a column no wider than 800px. Native `details`/`summary` is preferred. Answers are localized editable site copy.
6. **Advisor contact:** pale-mint panel with a short invitation, Call an advisor and Chat on WhatsApp actions, followed by the shared footer.

### Insurer profile

Use breadcrumbs Home → Insurers → Company name, with Insurers returning to the homepage directory. Introduce the company on a white surface with its contained logo, full name, complete description, and available categories.

Below the introduction, show published products using the same one/two/three-column grid as the directory. Product cards contain a thumbnail or category placeholder, category label, complete product name, a short description, and View details. Preserve the existing featured/priority ordering without inventing recommendation or popularity badges.

The company introduction includes Browse products and Talk to an advisor links to `#company-products` and `#contact`. Product thumbnails use contained 16:9 frames, descriptions preview up to three lines, and complete titles wrap naturally. The profile has a localized document title and description.

Product browsing uses a labeled name search and All plus the categories present in this company's published products. Combine filters using company-page `q` and `category` parameters, with the same normalization, history, clear, and locale-preservation behavior as the homepage. An unknown category or a category not offered by this company resolves to All. Forward the selected homepage category when opening a company; do not forward the insurer-name search into the product-name search. Product names without metadata receive a localized fallback; unknown product categories remain visible under All with a generic insurance label and icon.

Company and product data are server-rendered through the existing services; filtering runs locally without additional product requests. A product request failure keeps the company introduction and entered filters visible, with Retry refreshing server data. Profile request failures have a separate localized error boundary; missing or archived companies use the localized not-found view. Loading reserves space for the introduction and product cards.

End with an advisor panel at `#contact`, including company context in the WhatsApp message. A company with no published products receives a clear localized empty state and links to the directory and contact panel.

While a company profile is mounted, shared header/footer advisor actions target its contact panel and shared WhatsApp links include its name and localized page URL. This context is cleared on navigation. The company page uses the same mobile advisor bar and footer clearance as the homepage.

### Insurance detail

Use breadcrumbs Home → Insurer → Product, followed by insurer identity, product title, category, and description. From 1024px, place the reading column beside a 320px contact sidebar with a 32px gap. Keep the sidebar below the sticky header while scrolling. On smaller screens, place the contact panel after the article.

Present existing rich content as a readable article. Coverage, conditions, exclusions, and document links are recommended editorial sections when those details are supplied. Do not extract or invent structured policy fields, manufacture missing coverage, or create empty section headings. If rich content is absent, show the available description and a short invitation to contact an advisor.

Preserve authored content order, tables, images, and links. Constrain images to the reading column and allow wide tables to scroll inside labeled, keyboard-accessible containers. Public display styles may normalize typography and colors for readability without rewriting stored editor content.

The sidebar/panel at `#contact` includes phone and WhatsApp actions. WhatsApp messages identify the product and its absolute localized page URL. This page supports learning and inquiry; it does not display a purchase or instant-quote action.

### Layout sketches

Desktop homepage:

```text
[Logo]  Insurance types  Insurers  How it works  FAQ  [Language] [Advisor]

[Headline and supporting copy        ] [Existing hero image            ]
[Explore insurance] [Talk to advisor  ] [or neutral placeholder         ]

What would you like to protect?
[Life] [Health] [Accident] [Travel] [Home] [Vehicle] [Business]

Explore insurers
[Search by name........................] [Category filters / Clear]
[Logo, name, categories, View plans] [Insurer card] [Insurer card]

[Step 1]                     [Step 2]                     [Step 3]
[FAQ question and answer / expandable rows                      ]
[Advisor invitation                    ] [Call] [WhatsApp       ]
[Brand and description] [Navigation] [Categories] [Contact details]
```

Mobile homepage and detail:

```text
HOMEPAGE                       INSURANCE DETAIL
[Logo] [Language] [Menu]        [Logo] [Language] [Menu]
[Headline and description]     [Breadcrumbs]
[Explore] [Advisor]            [Insurer, title, category]
[Image / placeholder]          [Description]
[Category] [Category]          [Readable article]
[Search and filters]          [Table scrolls within article]
[Insurer card]                [Contact panel: Call / WhatsApp]
[Insurer card]                [Footer]
[Steps, FAQ, contact]
[Footer]
[Talk to an advisor bar]      [Talk to an advisor bar]
```

## 4. Behavior and content states

### Search, categories, and navigation

Preserve the canonical category slugs: `life`, `health`, `accident`, `travel`, `home`, `car`, and `business`. Vehicle is the English UI label for `car`. Directory filters include All and all seven categories, using the same labels and icons as the category section.

Use homepage query parameters `category` and `q` to make the state shareable and preserve it across navigation. Example: `/lo?category=health#company-list`. Omit the category parameter for All; unsupported values resolve to All. Search matches the displayed localized insurer name using a trimmed, Unicode-normalized, case-insensitive substring. Apply name and category conditions together, preserving the existing company order.

Typing updates results locally and replaces the query string without creating a history entry per character. Deliberate category selections create a navigable state. Changing category preserves the search text; Clear filters resets both. Back/forward navigation and locale changes restore the state. Category links in the footer supply their category explicitly.

Choosing a category on the homepage moves to the directory heading without hiding it behind the header. Use immediate scrolling for reduced-motion users. Announce result counts politely without moving focus on each search keystroke.

### Contact configuration and mobile action

Store the shared destinations through the existing settings mechanism as `contact_phone`, `contact_whatsapp`, and `contact_email`. Use the `en` locale record as the canonical source for these language-independent values; labels and message templates remain translated. Read through the existing settings API with `prefix=contact_&locale=en`. This adds settings keys, not a new response format or database table.

Phone uses an international number for its `tel:` link. WhatsApp uses a configured international number as digits only in `https://wa.me/<number>?text=<encoded-message>`. Localize and URL-encode the message, including the company or product name where applicable and the current localized page URL. The link opens a conversation for the visitor to send; the site does not send messages automatically. Email uses `mailto:`.

Do not copy the current sample phone numbers or email into active configuration. When a destination is missing or invalid, keep its action visibly unavailable, remove link behavior, and show localized text explaining that contact details are not yet available. A settings request failure follows the same behavior. Do not guess a fallback destination.

Below 1024px, provide a fixed Talk to an advisor bar that moves focus to the page's `#contact` panel. Hide it while that panel is visible, while the mobile menu is open, or while a text field is focused. Reserve its height plus the device safe-area inset in page padding so it cannot obscure the footer or keyboard-focused content.

### State requirements

| State | Required presentation |
| --- | --- |
| Directory loading | Card-shaped placeholders with reserved space and an accessible loading status |
| No companies | Brief catalog-unavailable message and advisor contact link |
| No search/filter matches | Restate the selection, show Clear filters, and retain the search controls |
| Directory request failure | Localized error message and Retry action; preserve the entered filters |
| Missing or broken image | Stable placeholder in the same frame; no broken-image icon |
| Missing description | Omit the description area without inventing text |
| Unknown/archived insurer or unavailable product | Localized not-found experience with home and insurer-directory links |
| Detail request failure | Error presentation with retry/navigation; do not mislabel a temporary failure as not found |
| Missing contact settings | Unavailable contact actions with an explanation; no fabricated live destinations |

Use skeletons or placeholders without shimmer when reduced motion is requested. Replacing content should not cause avoidable layout shifts.

### Copy and test-data policy

All UI text must exist in Lao and English. Use clear names for insurance types, explain unfamiliar terms, and favor short paragraphs. Describe what the visitor can do next. Primary navigation, actions, full titles, and essential coverage information must not be clipped to fit a fixed height.

Treat the supplied insurers, products, contacts, and business claims as test content, even when records are marked published. Catalog records may be used to exercise the design. Do not turn sample insurer counts, ratings, testimonials, licensing statements, customer totals, service guarantees, or response times into credibility claims. The proposed headline is editable sample copy. Genuine business information must replace test content before a real launch.

## 5. Implementation boundaries

The app has localized public routes, database-backed company and insurance records, hero settings, banner reads, and separate public/admin root layouts. The homepage and company profile implement the shared visual system, catalog filtering, and advisor presentation described above. The insurance detail body remains a future redesign; its shared header and footer already use the new public styles.

- Preserve `/[locale]`, `/[locale]/company/[id]`, and `/[locale]/insurance/[id]` and the current default-locale handling in [i18n/routing.ts](i18n/routing.ts). Use its navigation helpers for internal routes. Query parameters enhance the homepage; no new listing or quote route is required.
- Reuse the existing company fields (`name`, `description`, `logo`, `available_insurances`) and insurance fields (`name`, `description`, `category`, `thumbnail`, rich content). Derive insurer identity on detail pages from the existing company relation. Preserve active-company and published-product visibility rules.
- Keep existing company, insurance, banner, and settings API response shapes. Insurer search and filtering operate on the fetched localized company list. Resolve the page's locale before displaying metadata or content and retain the established English metadata fallback. No schema migration is part of this design.
- Preserve the hero settings overrides. Select the first banner in API order: descending priority, then descending creation date. Other active banners remain managed in the CMS but are not rotated in the public hero. An empty or failed banner response uses the placeholder.
- Scope new tokens and public rich-content rules under a public root class such as `.public-site`. [app/globals.css](app/globals.css) currently serves both public and admin pages and contains combined `.prose`/`.ProseMirror` selectors, including `!important` rules. Isolate the public article styling without changing editor or admin appearance.
- Retain the existing data loading, localization, and image-storage infrastructure. Populate contact keys through the existing authenticated settings mechanism during later implementation/configuration; an admin interface redesign is not required.

Website implementation and deployment are separate tasks. The company redesign introduces presentation components and internal contact context, with no public API response changes, new dependencies, or schema migrations. The product service also excludes products belonging to inactive companies. The existing `.env` is preserved.

Company verification uses an isolated preview. `tests/company.spec.ts` covers real catalog navigation and shared contact behavior; the opt-in fixture route described in `tests/fixtures/README.md` covers synthetic failures, missing content, and long bilingual names without editing database records. Fixture routes are excluded from the final production build.

## 6. Accessibility and acceptance

Target WCAG 2.2 AA for the public experience. Normal text needs at least 4.5:1 contrast and large text at least 3:1. Verify interactive boundaries and state indicators separately. Use semantic headings, one page-level `h1`, a skip-to-content link, explicit input labels, visible focus, and accessible expanded/selected states. Custom target sizing in this document intentionally exceeds the 24px WCAG AA minimum for main controls.

Future implementation review must cover:

- [ ] Homepage, insurer profile, and insurance detail in both languages at 360px, 768px, and 1440px, plus a 320px reflow check and 200% text zoom.
- [ ] Long Lao headings, diacritics, wrapped button labels, long insurer/product names, and full descriptions without clipping or overlap.
- [ ] Every category, name search, combined filters, no matches, reset, shared query URLs, and back/forward restoration.
- [ ] Header/footer category and section links from detail pages, breadcrumbs, and locale changes that preserve the relevant page state.
- [ ] Empty catalogs, companies without published products, missing metadata, absent rich content, broken logos/thumbnails/banners, and request failures with working retry actions.
- [ ] Active-company and published-product visibility, including archived or unavailable deep links.
- [ ] Phone/WhatsApp/email destinations from one configuration source; encoded Lao and English WhatsApp messages; product names and localized URLs; absent/invalid destinations remain inactive.
- [ ] Keyboard-only use of navigation, mobile menu, filters, FAQ, article links, table scrolling, and contact actions; correct focus restoration and visible focus.
- [ ] Screen-reader names and status messages; meaningful image alternatives; contrast in default, hover, focus, selected, error, and unavailable states.
- [ ] Mobile contact bar does not cover content and hides appropriately around the contact panel, menu, and text input.
- [ ] Reduced-motion behavior, reserved image space, responsive image sizing, and no automatic banner rotation.
- [ ] CMS-authored product content remains intact and readable; admin pages and the rich-text editor retain their existing appearance.

Company implementation verification passed TypeScript, scoped ESLint, an isolated production build, and browser checks for the homepage and company journey. Fixture checks cover retry, loading, missing metadata, broken images, long names, mobile interaction, and bilingual reflow. The fixture route is removed before the production build. Shared database records and the deployed service are not modified by these checks.

## 7. Research references

- [Lemonade homepage](https://www.lemonade.com/): reference for direct language and clear insurance-product entry points. Use the principle of obvious choices; MC Broker's journey remains browsing and advisor contact.
- [Nielsen Norman Group: Trustworthiness in Web Design](https://www.nngroup.com/articles/trustworthy-design/): research supporting clear organization, useful information, and accessible contact details. Apply those principles without treating sample claims as evidence of credibility.
- [W3C: Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): text contrast requirements and their exceptions.
- [W3C: Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): target size and spacing guidance; the 44–48px control targets above are the project's more generous design choice.

These references inform the design principles. Existing project assets and neutral placeholders are the only imagery sources selected for this phase.
