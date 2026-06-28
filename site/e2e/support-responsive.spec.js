// @feature: essensys-support-nav-responsive-2026-06-032
// @spec: openspec/changes/essensys-support-nav-responsive-2026-06-032/specs/ux-regression-matrix/spec.md
// @devices: desktop,iphone,ipad

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.resolve(__dirname, '../ux-evidence/screenshots');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Use specific selectors — multiple <nav> may exist in the app
const MAIN_NAV = '#main-nav';
const HAMBURGER = '.hamburger-btn';

// ── Desktop tests ─────────────────────────────────────────────────────────────
test.describe('Desktop — navigation et page Support', () => {

    test('nav principale visible et liens horizontaux sur desktop', async ({ page, viewport }) => {
        if (!viewport || viewport.width < 900) test.skip();

        await page.goto('/support', { waitUntil: 'networkidle' });
        await expect(page.locator(MAIN_NAV)).toBeVisible();

        await expect(page.locator(`${MAIN_NAV} a`).filter({ hasText: 'Support' })).toBeVisible();
        await expect(page.locator(`${MAIN_NAV} a`).filter({ hasText: 'Blog' })).toBeVisible();
    });

    test('bouton hamburger invisible sur desktop', async ({ page, viewport }) => {
        if (!viewport || viewport.width < 900) test.skip();

        await page.goto('/support', { waitUntil: 'networkidle' });
        const hamburger = page.locator(HAMBURGER);
        const count = await hamburger.count();
        if (count > 0) {
            await expect(hamburger).not.toBeVisible();
        }
    });

    test('page Support charge avec deux sections + screenshot desktop', async ({ page, viewport }) => {
        if (!viewport || viewport.width < 900) test.skip();

        await page.goto('/support', { waitUntil: 'networkidle' });
        await expect(page.getByRole('heading', { name: /Installation/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Dépannage/i })).toBeVisible();

        ensureDir(SCREENSHOTS_DIR);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'support-desktop.png'), fullPage: true });
    });

    test('screenshot nav desktop', async ({ page, viewport }) => {
        if (!viewport || viewport.width < 900) test.skip();

        await page.goto('/support');
        await page.waitForLoadState('networkidle');
        ensureDir(SCREENSHOTS_DIR);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'nav-desktop.png') });
    });

    test('aucune erreur console sur la page Support (desktop)', async ({ page, viewport }) => {
        if (!viewport || viewport.width < 900) test.skip();

        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto('/support', { waitUntil: 'networkidle' });
        expect(errors).toHaveLength(0);
    });
});

// ── iPhone tests ──────────────────────────────────────────────────────────────
test.describe('iPhone — navigation hamburger et page Support', () => {

    test('bouton hamburger visible sur iPhone + screenshot', async ({ page, viewport }) => {
        if (!viewport || viewport.width > 768) test.skip();

        await page.goto('/support', { waitUntil: 'networkidle' });
        await expect(page.locator(HAMBURGER)).toBeVisible();

        ensureDir(SCREENSHOTS_DIR);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'nav-iphone-closed.png') });
    });

    test('ouvrir le menu hamburger affiche tous les liens + screenshot', async ({ page, viewport }) => {
        if (!viewport || viewport.width > 768) test.skip();

        await page.goto('/support', { waitUntil: 'networkidle' });
        await page.locator(HAMBURGER).click();
        await page.waitForTimeout(400); // CSS transition 0.3s

        await expect(page.locator(`${MAIN_NAV} a`).filter({ hasText: 'Accueil' })).toBeVisible();
        await expect(page.locator(`${MAIN_NAV} a`).filter({ hasText: 'Support' })).toBeVisible();
        await expect(page.locator(`${MAIN_NAV} a`).filter({ hasText: 'Blog' })).toBeVisible();

        ensureDir(SCREENSHOTS_DIR);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'nav-iphone-open.png') });
    });

    test('fermer le menu au clic sur un lien iPhone', async ({ page, viewport }) => {
        if (!viewport || viewport.width > 768) test.skip();

        await page.goto('/');
        await page.locator(HAMBURGER).click();
        await page.waitForTimeout(400);
        await page.locator(`${MAIN_NAV} a`).filter({ hasText: 'Support' }).click();

        await page.waitForURL('**/support');
        await expect(page.locator(MAIN_NAV)).not.toHaveClass(/nav-open/);
    });

    test('page Support sans scroll horizontal iPhone', async ({ page, viewport }) => {
        if (!viewport || viewport.width > 768) test.skip();

        await page.goto('/support', { waitUntil: 'networkidle' });
        await page.waitForLoadState('domcontentloaded');

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
    });

    test('page Support charge correctement + screenshot iPhone', async ({ page, viewport }) => {
        if (!viewport || viewport.width > 768) test.skip();

        await page.goto('/support', { waitUntil: 'networkidle' });
        await expect(page.getByRole('heading', { name: /Installation/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Dépannage/i })).toBeVisible();

        ensureDir(SCREENSHOTS_DIR);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'support-iphone.png'), fullPage: true });
    });
});

// ── iPad tests ────────────────────────────────────────────────────────────────
test.describe('iPad — navigation et page Support', () => {

    test('page Support charge correctement + screenshot iPad', async ({ page }) => {
        await page.goto('/support', { waitUntil: 'networkidle' });
        await expect(page.getByRole('heading', { name: /Installation/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Dépannage/i })).toBeVisible();

        ensureDir(SCREENSHOTS_DIR);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'support-ipad.png'), fullPage: true });
    });

    test('support-card visible sur iPad', async ({ page }) => {
        await page.goto('/support', { waitUntil: 'networkidle' });
        await expect(page.locator('.support-card')).toBeVisible();
    });

    test('liens support cliquables sur iPad', async ({ page }) => {
        await page.goto('/support', { waitUntil: 'networkidle' });
        const links = page.locator('.support-doc-link');
        const count = await links.count();
        expect(count).toBeGreaterThanOrEqual(2);
        await expect(links.first()).toBeVisible();
    });

    test('navigation accessible + screenshot nav iPad', async ({ page, viewport }) => {
        await page.goto('/support', { waitUntil: 'networkidle' });
        ensureDir(SCREENSHOTS_DIR);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'nav-ipad.png') });

        if (!viewport) return;
        if (viewport.width > 768) {
            await expect(page.locator(`${MAIN_NAV} a`).filter({ hasText: 'Accueil' })).toBeVisible();
        } else {
            await expect(page.locator(HAMBURGER)).toBeVisible();
        }
    });
});
