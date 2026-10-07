// @feature: essensys-temporary-password-2026-09-040
// @spec: essensys-memory/openspec/changes/essensys-temporary-password-2026-09-040/specs/admin-temporary-password-issue/spec.md
// @spec: essensys-memory/openspec/changes/essensys-temporary-password-2026-09-040/specs/forced-password-change-ui/spec.md
// @devices: desktop,iphone,ipad
//
// The backend for this feature has no route-mocking harness of its own in
// this repo (Playwright specs here don't stand up the Go server + Postgres —
// see support-responsive.spec.js, which only ever hits static content). This
// spec mocks the API boundary with page.route() instead, so it runs against
// `vite preview` alone. The real end-to-end path (actual backend, actual
// Postgres, actual browser click-through, including the bug this surfaced —
// see the "sections 6-7" commit) was verified manually once during
// implementation; this spec is what re-runs on every CI build afterward.

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.resolve(__dirname, '../ux-evidence/screenshots');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const ADMIN_USER = {
    id: 1,
    email: 'admin@e2e.test',
    role: 'admin_global',
    first_name: 'Admin',
    last_name: 'E2E',
    provider: 'email',
    linked_machine_id: null,
    linked_gateway_id: null,
    linked_armoire_id: null,
};

const TARGET_USER_ROW = (marked) => ({
    id: 2,
    email: 'target@e2e.test',
    first_name: 'Target',
    last_name: 'User',
    role: 'user',
    provider: 'email',
    linked_machine_id: null,
    linked_gateway_id: null,
    linked_armoire_id: null,
    forbidden_at: null,
    ...(marked
        ? {
              password_change_required_at: '2026-09-25T10:00:00Z',
              temp_password_expires_at: '2026-09-28T10:00:00Z',
          }
        : {}),
});

const ISSUED_PASSWORD = 'Ab3xTe9QrkPn';
const EXPIRES_AT = '2026-09-28T10:00:00.000Z';

async function json(route, body, status = 200) {
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

/**
 * Mocks the whole API surface this feature's screens touch. `state` is
 * mutated across calls within one test so the admin-users list can reflect
 * an issuance without a real backend.
 */
async function mockApi(page, { loginResponse } = {}) {
    const state = { targetMarked: false };

    await page.route('**/api/auth/login', async (route) => {
        const body = route.request().postDataJSON();
        if (loginResponse) {
            await json(route, loginResponse(body));
            return;
        }
        if (body.email === ADMIN_USER.email) {
            await json(route, { token: 'admin-token', user: ADMIN_USER, password_change_required: false });
            return;
        }
        if (body.email === TARGET_USER_ROW(false).email && body.password === ISSUED_PASSWORD) {
            await json(route, {
                token: 'target-token',
                user: TARGET_USER_ROW(true),
                password_change_required: true,
            });
            return;
        }
        await json(route, { error: 'invalid_credentials' }, 401);
    });

    await page.route('**/api/admin/users/2/temporary-password', async (route) => {
        state.targetMarked = true;
        await json(route, { password: ISSUED_PASSWORD, expires_at: EXPIRES_AT, email_sent: false });
    });

    await page.route('**/api/admin/users', async (route) => {
        if (route.request().method() !== 'GET') {
            await route.fallback();
            return;
        }
        await json(route, [TARGET_USER_ROW(state.targetMarked), ADMIN_USER]);
    });

    await page.route('**/api/auth/password/change', async (route) => {
        await json(route, { message: 'Mot de passe mis à jour.' });
    });

    // Everything else this dashboard touches on mount: keep it quiet and
    // empty so the screens under test render without unrelated console
    // noise or indefinite spinners.
    const emptyGet = async (route) => {
        if (route.request().method() !== 'GET') {
            await route.fallback();
            return;
        }
        await json(route, []);
    };
    await page.route('**/api/admin/stats', (route) => json(route, { connected_clients: 0, total_machines: 0, total_gateways: 0 }));
    await page.route('**/api/admin/audit**', emptyGet);
    await page.route('**/api/admin/subscribers', emptyGet);
    await page.route('**/api/admin/machines', emptyGet);
    await page.route('**/api/admin/gateways', emptyGet);
    await page.route('**/api/portal/admin/gateway-sessions', emptyGet);
    await page.route('**/api/portal/admin/link-requests**', emptyGet);

    return state;
}

async function loginAsAdmin(page) {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.getByPlaceholder('exemple@email.com').fill(ADMIN_USER.email);
    await page.getByPlaceholder('Votre mot de passe').fill('whatever-the-mock-ignores');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await page.waitForURL('**/admin');
}

async function openUsersTab(page) {
    await page.getByRole('tab', { name: 'Utilisateurs' }).click();
    await expect(page.getByRole('heading', { name: 'Liste des utilisateurs' })).toBeVisible();
}

// ── Desktop: the admin-facing flows ─────────────────────────────────────────
test.describe('Desktop — émission admin', () => {
    // eslint-disable-next-line no-empty-pattern -- Playwright requires the object destructuring form here.
    test.beforeEach(async ({}, testInfo) => {
        // This admin console isn't a mobile surface — restrict to the
        // desktop project rather than a viewport-width heuristic, which the
        // iPad Pro project (1024px) would also pass.
        test.skip(testInfo.project.name !== 'desktop');
    });

    test('menu action, confirmation, affichage unique, badge', async ({ page }) => {
        await mockApi(page);
        await loginAsAdmin(page);
        await openUsersTab(page);

        const row = page.locator('tbody tr', { hasText: TARGET_USER_ROW(false).email });
        await row.getByRole('button', { name: '⋯' }).click();
        await page.getByRole('menuitem', { name: /Définir un mot de passe temporaire/ }).click();

        // Confirmation step: email named (in the modal heading — the same
        // address also appears in the table row behind it, so scope the
        // match to avoid a strict-mode ambiguity), checkbox unchecked.
        await expect(page.getByRole('heading', { name: `Mot de passe temporaire — ${TARGET_USER_ROW(false).email}` })).toBeVisible();
        const sendEmailCheckbox = page.getByRole('checkbox', { name: 'Envoyer aussi par email' });
        await expect(sendEmailCheckbox).not.toBeChecked();

        await page.getByRole('button', { name: 'Définir le mot de passe temporaire' }).click();

        // Result step: password shown once, expiry, "not requested" status.
        await expect(page.getByText(ISSUED_PASSWORD)).toBeVisible();
        await expect(page.getByText(/non envoyé \(non demandé\)/)).toBeVisible();

        await page.getByRole('button', { name: 'Fermer' }).click();

        // Password gone from the DOM once closed, badge now present.
        await expect(page.getByText(ISSUED_PASSWORD)).toHaveCount(0);
        await expect(row.getByText('MDP temporaire')).toBeVisible();
    });

    test("case d'envoi email non cochée par défaut, motif affiché en cas d'échec", async ({ page }) => {
        await mockApi(page);
        await page.route('**/api/admin/users/2/temporary-password', async (route) => {
            await json(route, { password: ISSUED_PASSWORD, expires_at: EXPIRES_AT, email_sent: false, reason: 'SMTP not configured' });
        });
        await loginAsAdmin(page);
        await openUsersTab(page);

        const row = page.locator('tbody tr', { hasText: TARGET_USER_ROW(false).email });
        await row.getByRole('button', { name: '⋯' }).click();
        await page.getByRole('menuitem', { name: /Définir un mot de passe temporaire/ }).click();
        await page.getByRole('checkbox', { name: 'Envoyer aussi par email' }).check();
        await page.getByRole('button', { name: 'Définir le mot de passe temporaire' }).click();

        await expect(page.getByText(/Email non envoyé : SMTP not configured/)).toBeVisible();
    });

    test('compte interdit : confirmation refusée avec le motif serveur', async ({ page }) => {
        await mockApi(page);
        await page.route('**/api/admin/users/2/temporary-password', async (route) => {
            await json(route, { error: 'account_forbidden' }, 409);
        });
        await loginAsAdmin(page);
        await openUsersTab(page);

        const row = page.locator('tbody tr', { hasText: TARGET_USER_ROW(false).email });
        await row.getByRole('button', { name: '⋯' }).click();
        await page.getByRole('menuitem', { name: /Définir un mot de passe temporaire/ }).click();
        await page.getByRole('button', { name: 'Définir le mot de passe temporaire' }).click();

        await expect(page.getByText(/compte est interdit/)).toBeVisible();
        await expect(page.getByText(ISSUED_PASSWORD)).toHaveCount(0);
    });
});

// ── Desktop: the forced-change screen ───────────────────────────────────────
test.describe('Desktop — connexion et changement forcé', () => {
    // eslint-disable-next-line no-empty-pattern -- Playwright requires the object destructuring form here.
    test.beforeEach(async ({}, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop');
    });

    test('connexion avec mot de passe temporaire redirige vers /change-password', async ({ page }) => {
        await mockApi(page);
        await page.goto('/login', { waitUntil: 'networkidle' });
        await page.getByPlaceholder('exemple@email.com').fill(TARGET_USER_ROW(false).email);
        await page.getByPlaceholder('Votre mot de passe').fill(ISSUED_PASSWORD);
        await page.getByRole('button', { name: 'Se connecter' }).click();

        await page.waitForURL('**/change-password**');
        await expect(page.getByRole('heading', { name: 'Mot de passe temporaire' })).toBeVisible();
        // No navigation to another page of the connected app — scoped to the
        // auth card, since the cookie-consent banner (shown on every page,
        // signed in or not) legitimately carries its own "En savoir plus"
        // link to /privacy and is not part of what this spec is guarding.
        await expect(page.locator('.auth-card').getByRole('link')).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Se déconnecter' })).toBeVisible();
    });

    test('confirmation divergente bloquée sans requête réseau', async ({ page }) => {
        await mockApi(page);
        await page.goto('/login', { waitUntil: 'networkidle' });
        await page.getByPlaceholder('exemple@email.com').fill(TARGET_USER_ROW(false).email);
        await page.getByPlaceholder('Votre mot de passe').fill(ISSUED_PASSWORD);
        await page.getByRole('button', { name: 'Se connecter' }).click();
        await page.waitForURL('**/change-password**');

        let changeCalled = false;
        await page.route('**/api/auth/password/change', async (route) => {
            changeCalled = true;
            await route.fallback();
        });

        await page.locator('#change-current').fill(ISSUED_PASSWORD);
        await page.locator('#change-new').fill('BrandNewPassword1');
        await page.locator('#change-confirm').fill('SomethingElseEntirely');

        // The mismatch shows as a live inline hint, and the submit button is
        // disabled by the same `incomplete` check — there is no click to
        // make here, the form refuses to leave the page in this state.
        await expect(page.getByText('Les mots de passe ne correspondent pas')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
        expect(changeCalled).toBe(false);
    });

    test('mot de passe temporaire expiré affiché comme tel, pas comme identifiant incorrect', async ({ page }) => {
        await mockApi(page, {
            loginResponse: () => ({ error: 'temporary_password_expired' }),
        });
        await page.route('**/api/auth/login', async (route) => {
            await json(route, { error: 'temporary_password_expired' }, 401);
        });

        await page.goto('/login', { waitUntil: 'networkidle' });
        await page.getByPlaceholder('exemple@email.com').fill(TARGET_USER_ROW(false).email);
        await page.getByPlaceholder('Votre mot de passe').fill('some-expired-temp-password');
        await page.getByRole('button', { name: 'Se connecter' }).click();

        await expect(page.getByText(/mot de passe temporaire a expiré/)).toBeVisible();
        await expect(page.getByText('Identifiants invalides')).toHaveCount(0);
    });

    test('changement réussi mène à /admin sans reconnexion', async ({ page }) => {
        await mockApi(page);
        await page.goto('/login', { waitUntil: 'networkidle' });
        await page.getByPlaceholder('exemple@email.com').fill(TARGET_USER_ROW(false).email);
        await page.getByPlaceholder('Votre mot de passe').fill(ISSUED_PASSWORD);
        await page.getByRole('button', { name: 'Se connecter' }).click();
        await page.waitForURL('**/change-password**');

        await page.locator('#change-current').fill(ISSUED_PASSWORD);
        await page.locator('#change-new').fill('BrandNewPassword1');
        await page.locator('#change-confirm').fill('BrandNewPassword1');
        await page.getByRole('button', { name: 'Enregistrer' }).click();

        await page.waitForURL('**/admin**');
        const token = await page.evaluate(() => localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
        // Same token as the one the temporary-password login already issued —
        // no second POST /api/auth/login happened as part of this redirect.
        expect(token).toBe('target-token');
    });
});

// ── Global 409 guard, any authenticated page ────────────────────────────────
test.describe('Verrou global — 409 password_change_required', () => {
    // eslint-disable-next-line no-empty-pattern -- Playwright requires the object destructuring form here.
    test.beforeEach(async ({}, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop');
    });

    test('un 409 sur une session existante ramène à /change-password', async ({ page }) => {
        await mockApi(page);
        await loginAsAdmin(page);

        // Simulate the account being locked mid-session by an admin action
        // elsewhere: a deliberately-triggered fetch (not one incidental to
        // whatever Admin.jsx happens to load on mount, whose timing this
        // test shouldn't depend on) comes back 409, exactly as the server
        // would once enforceActiveUser starts refusing this account.
        await page.route('**/api/e2e-guard-check', async (route) => {
            await json(route, { error: 'password_change_required', redirect: '/change-password' }, 409);
        });
        await page.evaluate(() => fetch('/api/e2e-guard-check'));

        await page.waitForURL('**/change-password**');
    });
});

// ── Responsive: no horizontal scroll on iPhone, both surfaces reachable on
//    every device (spec forced-password-change-ui, "Couverture multi-appareils") ──
test.describe('Réactivité — modale et écran de changement', () => {
    test('page /change-password : rendu + captures + pas de scroll horizontal', async ({ page }, testInfo) => {
        await mockApi(page);
        await page.goto('/login', { waitUntil: 'networkidle' });
        await page.getByPlaceholder('exemple@email.com').fill(TARGET_USER_ROW(false).email);
        await page.getByPlaceholder('Votre mot de passe').fill(ISSUED_PASSWORD);
        await page.getByRole('button', { name: 'Se connecter' }).click();
        await page.waitForURL('**/change-password**');

        await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeVisible();

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

        ensureDir(SCREENSHOTS_DIR);
        // testInfo.project.name, not a viewport-width guess: the iPad Pro
        // preset (1024px) is as wide as many desktop windows, so inferring
        // the label from width alone silently collapsed ipad into desktop.
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `change-password-${testInfo.project.name}.png`), fullPage: true });
    });

    test('modale d\'émission : lisible et sans scroll horizontal', async ({ page }, testInfo) => {
        await mockApi(page);
        await loginAsAdmin(page);
        await openUsersTab(page);

        const row = page.locator('tbody tr', { hasText: TARGET_USER_ROW(false).email });
        await row.getByRole('button', { name: '⋯' }).click();
        await page.getByRole('menuitem', { name: /Définir un mot de passe temporaire/ }).click();

        await expect(page.getByRole('button', { name: 'Définir le mot de passe temporaire' })).toBeVisible();

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

        ensureDir(SCREENSHOTS_DIR);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `temp-password-modal-${testInfo.project.name}.png`) });
    });
});
