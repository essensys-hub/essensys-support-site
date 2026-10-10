// @feature: android-portal-refresh-2026-10-002
// @devices: desktop,iphone,ipad
// Page /android : lien vers l'APK publié et contournement Play Protect (essensys-android-phone-apps#9).
// NR: NR-site-5 essensys-hub/essensys-android-phone-apps#9

import { test, expect } from '@playwright/test';

test.describe('Page Android', () => {
    test('NR-site-5 lien APK publié et contournement Play Protect visibles', async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem('cookieConsent', 'false'));
        await page.goto('/android');
        await expect(page.getByTestId('download-link')).toHaveAttribute('href',
            'https://github.com/essensys-hub/essensys-android-phone-apps/releases/download/android-v2.0.0/essensys-android-2.0.0.apk');
        const steps = page.locator('.install-steps');
        await expect(steps).toContainText('Play Protect');
        await expect(steps).toContainText('Plus de détails');
        await expect(steps).toContainText('Installer quand même');
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
    });

    test('la page iOS reste sans lien tant que rien n est publié', async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem('cookieConsent', 'false'));
        await page.goto('/ios');
        await expect(page.getByRole('button', { name: /En cours de test/ })).toBeDisabled();
    });
});
