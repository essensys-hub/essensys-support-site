// @feature: support-reports-2026-10-004
// @spec: essensys-memory/openspec/changes/support-reports-2026-10-004/specs/support-report-submission/spec.md
// @spec: essensys-memory/openspec/changes/support-reports-2026-10-004/specs/support-report-tracking/spec.md
// @devices: desktop,iphone,ipad
//
// Mode no-armoire : l'API est simulée par page.route(), aucun backend, aucune
// base et aucune armoire réels. Le comportement serveur (filtre, limite,
// routage GitHub) est couvert par les tests Go NR-backend-*.

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const SCREENSHOTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../ux-evidence/screenshots');

const PROFILE = { id: 1, email: 'user@e2e.test', role: 'user', first_name: 'E2E', last_name: 'User', provider: 'email' };

async function signIn(page) {
    await page.addInitScript(() => {
        localStorage.setItem('adminToken', 'e2e-token');
        localStorage.setItem('adminRole', 'user');
        localStorage.setItem('cookieConsent', 'false');
    });
}

async function mockProfileApis(page, reports = []) {
    await page.route('**/api/profile', (r) => r.fulfill({ json: PROFILE }));
    await page.route('**/api/devices/nearby', (r) => r.fulfill({ json: { machines: [], gateways: [] } }));
    await page.route('**/api/admin/audit**', (r) => r.fulfill({ json: [] }));
    await page.route('**/api/support/reports', (r) =>
        r.request().method() === 'GET' ? r.fulfill({ json: { reports } }) : r.fallback());
}

async function fillBug(page, actual) {
    await page.getByLabel('Titre').fill('Les volets ne répondent plus');
    await page.getByLabel('Application concernée').selectOption('android');
    await page.getByLabel('Ce qui se passe').fill(actual);
}

test.describe('Signalements', () => {
    // NR: NR-site-1 essensys-hub/essensys-feature-lifecycle#15
    test('NR-site-1 avertissement visible au-dessus des champs libres sans défilement horizontal', async ({ page }, testInfo) => {
        await signIn(page);
        await page.goto('/signaler?type=bug');
        const warning = page.getByTestId('report-warning');
        await expect(warning).toBeVisible();
        await expect(warning).toContainText('adresse postale');
        await expect(warning).toContainText('mot de passe');
        const w = await warning.boundingBox();
        const first = await page.getByLabel('Titre').boundingBox();
        expect(w.y).toBeLessThan(first.y);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
        fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `support-report-${testInfo.project.name}.png`), fullPage: true });
    });

    // NR: NR-site-2 essensys-hub/essensys-feature-lifecycle#15
    test('NR-site-2 refus 422 affiché sous le champ et saisie conservée', async ({ page }) => {
        await signIn(page);
        await page.route('**/api/support/reports', (r) => r.fulfill({
            status: 422,
            json: { error: 'sensitive_content', field: 'actual', category: 'password', message: 'Ce texte semble contenir un mot de passe.' },
        }));
        await page.goto('/signaler?type=bug');
        await fillBug(page, 'mon mot de passe : Soleil2026');
        await page.getByRole('button', { name: 'Envoyer le signalement' }).click();
        await expect(page.locator('#report-actual-error')).toContainText('mot de passe');
        await expect(page.getByLabel('Ce qui se passe')).toHaveValue('mon mot de passe : Soleil2026');
        await expect(page.getByLabel('Ce qui se passe')).toHaveAttribute('aria-invalid', 'true');
    });

    // NR: NR-site-3 essensys-hub/essensys-feature-lifecycle#15
    test('NR-site-3 visiteur invité à se connecter sans formulaire', async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem('cookieConsent', 'false'));
        await page.goto('/signaler?type=incident');
        await expect(page.getByRole('link', { name: 'Se connecter pour signaler' }))
            .toHaveAttribute('href', '/login?return=%2Fsignaler%3Ftype%3Dincident');
        await expect(page.getByLabel('Ce qui se passe')).toHaveCount(0);
    });

    // NR: NR-site-4 essensys-hub/essensys-feature-lifecycle#15
    test('NR-site-4 incident sans lien GitHub dans Mes signalements', async ({ page }, testInfo) => {
        await signIn(page);
        await mockProfileApis(page, [
            { ref: 'R-INC00001', kind: 'incident', title: 'Plus aucune lumière', status: 'open', created_at: '2026-10-10T08:00:00Z' },
            { ref: 'R-BUG00001', kind: 'bug', title: 'Volets figés', status: 'resolved', created_at: '2026-10-09T08:00:00Z',
              issue_url: 'https://github.com/essensys-hub/essensys-support-site/issues/42' },
        ]);
        await page.goto('/profile');
        const items = page.getByTestId('my-report');
        await expect(items).toHaveCount(2);
        await expect(items.nth(0)).toContainText('Ouvert');
        await expect(items.nth(0).getByRole('link')).toHaveCount(0);
        await expect(items.nth(1)).toContainText('Résolu');
        await expect(items.nth(1).getByRole('link', { name: 'Voir sur GitHub' }))
            .toHaveAttribute('href', 'https://github.com/essensys-hub/essensys-support-site/issues/42');
        fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
        await page.locator('#signalements').screenshot({ path: path.join(SCREENSHOTS_DIR, `my-reports-${testInfo.project.name}.png`) });
    });

    test('signalement accepté : référence affichée', async ({ page }) => {
        await signIn(page);
        let sent;
        await page.route('**/api/support/reports', async (r) => {
            sent = r.request().postDataJSON();
            await r.fulfill({ status: 201, json: { ref: 'R-ABCD1234', kind: 'bug', status: 'open' } });
        });
        await page.goto('/signaler?type=bug');
        await fillBug(page, 'Rien ne se passe quand j’appuie sur Fermer.');
        await page.getByRole('button', { name: 'Envoyer le signalement' }).click();
        await expect(page.getByRole('status')).toContainText('R-ABCD1234');
        expect(sent).toMatchObject({ kind: 'bug', app: 'android', title: 'Les volets ne répondent plus' });
        expect(sent).not.toHaveProperty('impact');
    });

    test('limite atteinte : bandeau 429 avec la date du prochain essai', async ({ page }) => {
        await signIn(page);
        await page.route('**/api/support/reports', (r) => r.fulfill({
            status: 429,
            json: { error: 'rate_limited', retry_after: 3600, retry_at: '2026-10-11T09:00:00Z', message: 'Vous avez atteint la limite de 5 signalements par 24 heures.' },
        }));
        await page.goto('/signaler?type=bug');
        await fillBug(page, 'Encore un problème.');
        await page.getByRole('button', { name: 'Envoyer le signalement' }).click();
        await expect(page.getByRole('alert').filter({ hasText: 'limite' })).toContainText('Nouvel essai possible');
    });

    test('accueil connecté : la carte Incident ouvre le formulaire Incident', async ({ page }) => {
        await signIn(page);
        await page.goto('/');
        await page.locator('.report-card-incident').click();
        await expect(page).toHaveURL(/\/signaler\?type=incident$/);
        await expect(page.getByRole('radio', { name: 'Incident sur mon installation' })).toHaveAttribute('aria-checked', 'true');
        await expect(page.getByLabel('Ce qui est touché')).toBeVisible();
    });
});
