/* global process */
// @feature: portal-user-guide-2026-10-006
// @devices: desktop
// Captures des écrans du site pour le guide utilisateur (connexion, mot de passe
// temporaire, profil, signalement). API simulée par page.route : aucun backend,
// aucune armoire, données fictives. Lancé à la demande :
//   GUIDE_SCREENSHOTS=1 npx playwright test e2e/guide-screenshots.spec.js --project desktop
// puis scripts/sync-guide-screenshots.sh copie les images dans le guide du portail.

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../guide-screenshots');
const USER = { id: 1, email: 'demo@essensys.fr', role: 'user', first_name: 'Démo', last_name: 'Portail', provider: 'email',
    linked_machine_id: 1, linked_gateway_id: 'demo-gateway' };

test.skip(!process.env.GUIDE_SCREENSHOTS, 'captures du guide : lancer avec GUIDE_SCREENSHOTS=1');

async function markers(page, items) {
    const boxes = [];
    for (const [n, locator] of items) {
        await expect(locator, `repère ${n} introuvable : mettre à jour le guide`).toBeVisible();
        const b = await locator.boundingBox();
        boxes.push({ n, x: Math.max(16, b.x - 18), y: b.y + b.height / 2 });
    }
    await page.evaluate((list) => {
        for (const { n, x, y } of list) {
            const el = document.createElement('div');
            el.textContent = String(n);
            Object.assign(el.style, { position: 'absolute', left: `${x - 14 + window.scrollX}px`, top: `${y - 14 + window.scrollY}px`,
                width: '28px', height: '28px', borderRadius: '50%', background: '#E11D48', color: '#fff',
                font: '700 15px/28px system-ui, sans-serif', textAlign: 'center', zIndex: 2147483647,
                boxShadow: '0 0 0 3px #fff, 0 2px 6px rgba(0,0,0,.35)', pointerEvents: 'none' });
            document.body.appendChild(el);
        }
    }, boxes);
}

async function shot(page, name) {
    fs.mkdirSync(OUT, { recursive: true });
    await page.screenshot({ path: path.join(OUT, `${name}-desktop.png`) });
}

async function signIn(page) {
    await page.addInitScript(() => {
        localStorage.setItem('adminToken', 'guide-token');
        localStorage.setItem('adminRole', 'user');
        localStorage.setItem('cookieConsent', 'false');
    });
}

test.beforeEach(async ({ page }) => {
    // Garde-fou : rien ne sort de localhost.
    await page.route('**/*', (route) => {
        const host = new URL(route.request().url()).hostname;
        return host === 'localhost' || host === '127.0.0.1' ? route.fallback() : route.abort();
    });
});

test('guide : connexion', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('cookieConsent', 'false'));
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo@essensys.fr');
    await markers(page, [
        [1, page.getByLabel('Email')],
        [2, page.getByLabel('Mot de passe', { exact: true })],
        [3, page.getByRole('button', { name: 'Se connecter' })],
        [4, page.getByRole('link', { name: /oublié/ }).first()],
    ]);
    await shot(page, 'connexion');
});

test('guide : mot de passe temporaire', async ({ page }) => {
    await signIn(page);
    await page.goto('/change-password');
    await markers(page, [
        [1, page.locator('#change-current')],
        [2, page.locator('#change-new')],
        [3, page.locator('#change-confirm')],
        [4, page.getByRole('button', { name: 'Enregistrer' })],
    ]);
    await shot(page, 'changement-mot-de-passe');
});

test('guide : profil', async ({ page }) => {
    await signIn(page);
    await page.route('**/api/profile', (r) => r.fulfill({ json: USER }));
    await page.route('**/api/devices/nearby', (r) => r.fulfill({ json: { machines: [{ id: 1, no_serie: 'DEMO-0001', ip: '192.0.2.10' }],
        gateways: [{ hostname: 'demo-gateway', ip: '192.0.2.20' }], user_ip: '192.0.2.50' } }));
    await page.route('**/api/admin/audit**', (r) => r.fulfill({ json: [] }));
    await page.route('**/api/support/reports', (r) => r.fulfill({ json: { reports: [
        { ref: 'R-DEMO0001', kind: 'bug', title: 'Volets du salon figés', status: 'resolved', created_at: '2026-10-08T09:00:00Z',
          issue_url: 'https://github.com/essensys-hub/essensys-support-site/issues/1' },
    ] } }));
    await page.goto('/profile');
    await markers(page, [
        [1, page.getByRole('heading', { name: 'Mes Appareils' })],
        [2, page.getByRole('heading', { name: 'Modifier mes informations' })],
        [3, page.getByRole('heading', { name: 'Gestion des données (RGPD)' })],
        [4, page.getByRole('heading', { name: 'Mes signalements' })],
    ]);
    fs.mkdirSync(OUT, { recursive: true });
    await page.screenshot({ path: path.join(OUT, 'profil-desktop.png'), fullPage: true });
});

test('guide : signaler un problème', async ({ page }) => {
    await signIn(page);
    await page.goto('/signaler?type=bug');
    await markers(page, [
        [1, page.getByRole('radio', { name: 'Bug logiciel' })],
        [2, page.getByTestId('report-warning')],
        [3, page.getByLabel('Application concernée')],
        [4, page.getByRole('button', { name: 'Envoyer le signalement' })],
    ]);
    fs.mkdirSync(OUT, { recursive: true });
    await page.screenshot({ path: path.join(OUT, 'signaler-desktop.png'), fullPage: true });
});
