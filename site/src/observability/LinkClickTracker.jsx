import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isAnalyticsAllowed, resolveClickTarget, trackLinkClick } from './newrelic';

/** Enregistre chaque clic sur lien/bouton actionnable pour NR PageAction `support_link_click`. */
export default function LinkClickTracker() {
  const location = useLocation();

  useEffect(() => {
    const onClick = (event) => {
      if (!isAnalyticsAllowed()) {
        return;
      }

      const resolved = resolveClickTarget(event.target);
      if (!resolved) {
        return;
      }

      trackLinkClick({
        ...resolved,
        page: location.pathname,
      });
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [location.pathname]);

  return null;
}
