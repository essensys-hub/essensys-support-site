/* global Buffer */
// @feature: portal-user-guide-2026-10-006
// @spec: essensys-memory/openspec/changes/portal-user-guide-2026-10-006/specs/portal-user-guide/spec.md
// @devices: desktop,iphone,ipad
// Mode no-armoire : API et contenu du guide simulés (page.route), aucun backend ni armoire.

import { test, expect } from '@playwright/test';

const SLUGS = ['premiers-pas', 'connexion', 'tableau-de-bord', 'eclairage', 'volets', 'chauffage', 'chauffe-eau',
    'arrosage', 'scenarios', 'securite', 'notifications', 'reglages', 'profil-signalements'];
const INDEX = { title: 'Guide du portail mon.essensys.fr', pages: SLUGS.map((slug) => ({ slug, title: `Titre ${slug}`, summary: `Résumé ${slug}` })) };
const ECLAIRAGE = `# Éclairage

## À quoi sert cet écran

Allumer et éteindre les lumières.

![L'écran Éclairage](/guide-data/images/eclairage-desktop.png)

## L'écran en détail

1. **Tout allumer** : allume tout.

| Message | Que faire |
|---|---|
| Commande envoyée | Tout va bien, l'armoire exécute la commande dans les secondes qui suivent. |
`;
// PNG 1×1 transparent, assez large une fois mis à l'échelle pour vérifier l'adaptation à l'écran.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

async function mockGuide(page) {
    const requested = [];
    await page.route('**/guide-data/**', (route) => {
        const url = route.request().url();
        requested.push(url);
        if (url.endsWith('/index.json')) return route.fulfill({ json: INDEX });
        if (url.endsWith('/eclairage.md')) return route.fulfill({ body: ECLAIRAGE, contentType: 'text/markdown' });
        if (url.endsWith('.png')) return route.fulfill({ body: PNG, contentType: 'image/png' });
        return route.fulfill({ status: 404, body: '' });
    });
    return requested;
}

async function signIn(page) {
    await page.addInitScript(() => {
        localStorage.setItem('adminToken', 'e2e-token');
        localStorage.setItem('adminRole', 'user');
        localStorage.setItem('cookieConsent', 'false');
    });
}

test.describe('Guide du portail', () => {
    // NR: NR-site-6 essensys-hub/essensys-feature-lifecycle#26
    test('NR-site-6 visiteur invité à se connecter sans charger le guide', async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem('cookieConsent', 'false'));
        const requested = await mockGuide(page);
        await page.goto('/guide/eclairage');
        await expect(page.getByText('Connectez-vous pour accéder au guide.')).toBeVisible();
        await expect(page.getByRole('link', { name: 'Se connecter' }).last())
            .toHaveAttribute('href', '/login?return=%2Fguide%2Feclairage');
        await expect(page.getByTestId('guide-article')).toHaveCount(0);
        expect(requested).toEqual([]);
    });

    // NR: NR-site-7 essensys-hub/essensys-feature-lifecycle#26
    test('NR-site-7 retour sur la page demandée après connexion', async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem('cookieConsent', 'false'));
        await mockGuide(page);
        await page.route('**/api/auth/login', (route) => route.fulfill({ json: {
            token: 'e2e-token', user: { id: 1, email: 'demo@essensys.fr', role: 'user' }, password_change_required: false } }));
        await page.goto('/guide/eclairage');
        await page.getByRole('link', { name: 'Se connecter' }).last().click();
        await page.getByLabel('Email').fill('demo@essensys.fr');
        await page.getByLabel('Mot de passe', { exact: true }).fill('mot-de-passe-de-test');
        await page.getByRole('button', { name: 'Se connecter' }).click();
        await expect(page).toHaveURL(/\/guide\/eclairage$/);
        await expect(page.getByTestId('guide-article')).toContainText('Allumer et éteindre les lumières');
    });

    // NR: NR-site-8 essensys-hub/essensys-feature-lifecycle#26
    test('NR-site-8 page lisible sans défilement horizontal', async ({ page }) => {
        await signIn(page);
        await mockGuide(page);
        await page.goto('/guide/eclairage');
        const article = page.getByTestId('guide-article');
        await expect(article.locator('table')).toBeVisible();
        await expect(article.locator('img')).toBeVisible();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
        const img = await article.locator('img').boundingBox();
        const viewport = page.viewportSize();
        expect(img.x + img.width).toBeLessThanOrEqual(viewport.width);
    });

    test('sommaire complet de 13 pages pour un utilisateur connecté', async ({ page }) => {
        await signIn(page);
        await mockGuide(page);
        await page.goto('/guide');
        const items = page.getByTestId('guide-toc').locator('li');
        await expect(items).toHaveCount(13);
        await expect(items.first().getByRole('link')).toHaveAttribute('href', '/guide/premiers-pas');
    });

    test('page inconnue : message et retour au sommaire', async ({ page }) => {
        await signIn(page);
        await mockGuide(page);
        await page.goto('/guide/inexistant');
        await expect(page.getByRole('heading', { name: 'Page du guide introuvable' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Retour au sommaire du guide' })).toHaveAttribute('href', '/guide');
    });

    test('guide absent : message « en cours de préparation »', async ({ page }) => {
        await signIn(page);
        await page.route('**/guide-data/**', (route) => route.fulfill({ status: 404, body: '' }));
        await page.goto('/guide');
        await expect(page.getByText('Le guide est en cours de préparation.', { exact: false })).toBeVisible();
    });

    test('lien vers le guide depuis le profil', async ({ page }) => {
        await signIn(page);
        await mockGuide(page);
        await page.route('**/api/profile', (r) => r.fulfill({ json: { id: 1, email: 'demo@essensys.fr', role: 'user', first_name: 'Démo', last_name: 'Portail' } }));
        await page.route('**/api/devices/nearby', (r) => r.fulfill({ json: { machines: [], gateways: [] } }));
        await page.route('**/api/admin/audit**', (r) => r.fulfill({ json: [] }));
        await page.route('**/api/support/reports', (r) => r.fulfill({ json: { reports: [] } }));
        await page.goto('/profile');
        await page.getByRole('link', { name: 'Guide du portail' }).click();
        await expect(page).toHaveURL(/\/guide$/);
        await expect(page.getByTestId('guide-toc')).toBeVisible();
    });
});
