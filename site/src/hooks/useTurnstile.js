import { useCallback, useEffect, useRef, useState } from 'react';

export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

/**
 * Renders a Cloudflare Turnstile widget into the returned ref and exposes its
 * token.
 *
 * The script tag is shared across pages via the data-essensys-turnstile marker:
 * loading it twice leaves window.turnstile half-initialised and the widget never
 * renders. When no site key is baked into the build the hook stays inert, so a
 * local build without secrets still shows a usable form.
 *
 * @returns {{widgetRef: object, token: string, ready: boolean, reset: function}}
 */
export default function useTurnstile() {
    const [token, setToken] = useState('');
    const widgetRef = useRef(null);
    const widgetIdRef = useRef(null);

    const reset = useCallback(() => {
        setToken('');
        if (window.turnstile && widgetIdRef.current != null) {
            try {
                window.turnstile.reset(widgetIdRef.current);
            } catch {
                /* widget already gone */
            }
        }
    }, []);

    useEffect(() => {
        if (!TURNSTILE_SITE_KEY) {
            return undefined;
        }

        const renderWidget = () => {
            if (!widgetRef.current || !window.turnstile || widgetIdRef.current != null) {
                return;
            }
            widgetIdRef.current = window.turnstile.render(widgetRef.current, {
                sitekey: TURNSTILE_SITE_KEY,
                callback: (value) => setToken(value || ''),
                'expired-callback': () => setToken(''),
                'error-callback': () => setToken(''),
            });
        };

        if (window.turnstile) {
            renderWidget();
            return undefined;
        }

        const existing = document.querySelector('script[data-essensys-turnstile]');
        if (existing) {
            existing.addEventListener('load', renderWidget);
            return () => existing.removeEventListener('load', renderWidget);
        }

        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.dataset.essensysTurnstile = '1';
        script.addEventListener('load', renderWidget);
        document.head.appendChild(script);
        return () => script.removeEventListener('load', renderWidget);
    }, []);

    return {
        widgetRef,
        token,
        // Whether the form may be submitted: a build without a site key has no
        // captcha to satisfy.
        ready: !TURNSTILE_SITE_KEY || Boolean(token),
        reset,
    };
}
