# Turnstile and Playwright

There is no dedicated register e2e yet. When adding one:

1. Prefer Cloudflare **always-pass** test keys in CI (do not use production secrets):
   - Site key: `1x00000000000000000000AA`
   - Secret: `1x0000000000000000000000000000000AA`
2. Or stub `window.turnstile` before navigation and set `VITE_TURNSTILE_SITE_KEY` to any non-empty value while the backend uses a mocked `siteverify` / `TURNSTILE_DISABLED=true` with `ENV` ≠ `production`.
3. Assert missing-token register returns 400/403 and does not create a user.
