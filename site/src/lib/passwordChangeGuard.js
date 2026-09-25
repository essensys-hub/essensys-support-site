/**
 * Global rattrapage for spec forced-password-change-ui: "409
 * password_change_required sur une session existante ramène à
 * /change-password", from any page.
 *
 * The SPA has no shared fetch wrapper — every page calls the global
 * `fetch()` directly (Admin.jsx, UserManager.jsx, Profile.jsx, …) — so
 * patching `window.fetch` once, here, is the only way to catch this
 * response uniformly without editing every call site. 409 is also used for
 * unrelated conflicts elsewhere in the API (duplicate account on register,
 * "already forbidden", "cannot remove the last global admin"), so this only
 * acts when the body's `error` field is exactly `password_change_required` —
 * never on status code alone.
 */
export function installPasswordChangeGuard() {
    if (typeof window === 'undefined' || window.fetch.__passwordChangeGuardInstalled) {
        return;
    }

    const originalFetch = window.fetch.bind(window);

    const guardedFetch = async (...args) => {
        const response = await originalFetch(...args);

        if (response.status === 409 && window.location.pathname !== '/change-password') {
            try {
                const data = await response.clone().json();
                if (data && data.error === 'password_change_required') {
                    window.location.href = data.redirect || '/change-password';
                }
            } catch {
                // Not a JSON body, or already consumed by the time we peeked —
                // nothing to act on.
            }
        }

        return response;
    };

    guardedFetch.__passwordChangeGuardInstalled = true;
    window.fetch = guardedFetch;
}
