/**
 * Shared by Login.jsx and ChangePassword.jsx: both end a successful auth
 * step (login, or a forced password change) holding the same token/role and
 * needing to land the visitor on the same destination — either back into
 * this SPA, or across origins onto the portal (mon.essensys.fr), which
 * cannot read this origin's localStorage, so the token travels in the URL
 * fragment instead.
 */
export function redirectAfterAuth(returnTo, token, role, navigate) {
    if (returnTo.startsWith('http://') || returnTo.startsWith('https://')) {
        const target = new URL(returnTo);
        target.hash = `token=${encodeURIComponent(token)}&role=${encodeURIComponent(role)}`;
        window.location.href = target.toString();
        return;
    }
    if (returnTo.startsWith('/')) {
        window.location.href = returnTo;
        return;
    }
    navigate(returnTo);
}
