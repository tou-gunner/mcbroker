# Company preview fixtures

The company page renders database content on the server. These fixtures exercise the same profile and catalog components with long names, missing images, and recoverable failures without editing database records.

In an **isolated copy** of the application, create `app/(public)/[locale]/company-preview/` and copy `company-page.tsx` there as `page.tsx`. Copy the real company route's `error.tsx` and `loading.tsx` alongside it, adjusting their relative component imports from `../../` to `../`. For `loading.tsx`, import `ProductSkeleton` from `../company/[id]/ProductSkeleton`.

Start that copy on port 3076, then run `COMPANY_FIXTURE_TESTS=1 pnpm test:e2e`. The regular company smoke tests use the existing Allianz and AIA test records and make no database writes. Contact API responses and image failures are intercepted in the browser.

Remove the fixture route before the final production build. A normal build of this repository does not include it. With `COMPANY_FIXTURE_TESTS` unset, the fixture tests are skipped; homepage and real company checks still run.
