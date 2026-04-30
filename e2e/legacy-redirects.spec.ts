import { test, expect } from './fixtures/auth';

/**
 * Validates the 4 legacy route redirects registered in src/App.tsx.
 * These routes are kept for backwards-compat with old links and must
 * land authenticated users on their new destinations.
 */
const LEGACY_REDIRECTS: Array<{ from: string; to: string; label: string }> = [
  { from: '/reports', to: '/estoque', label: '/reports → /estoque' },
  { from: '/vitrine', to: '/marketing?tab=midias', label: '/vitrine → /marketing?tab=midias' },
  { from: '/pdvs', to: '/settings?tab=pdvs', label: '/pdvs → /settings?tab=pdvs' },
  { from: '/team', to: '/settings?tab=team', label: '/team → /settings?tab=team' },
];

test.describe('Legacy route redirects (authenticated)', () => {
  for (const { from, to, label } of LEGACY_REDIRECTS) {
    test(`redirects ${label}`, async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      await page.goto(from);
      // Wait for client-side <Navigate replace /> to settle.
      await page.waitForLoadState('networkidle');

      const url = new URL(page.url());
      const expected = new URL(to, url.origin);

      expect(
        url.pathname,
        `expected pathname ${expected.pathname} after navigating to ${from}, got ${url.pathname}`,
      ).toBe(expected.pathname);

      // Validate every query param the target requires is present.
      for (const [key, value] of expected.searchParams.entries()) {
        expect(
          url.searchParams.get(key),
          `expected query param ${key}=${value} after navigating to ${from}`,
        ).toBe(value);
      }

      // Sanity check: the destination must not be the auth screen.
      expect(url.pathname).not.toBe('/auth');
    });
  }
});