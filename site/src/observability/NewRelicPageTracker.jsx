import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initNewRelic, trackPageView } from './newrelic';

/** Page views SPA + init NR après consentement cookies. */
export default function NewRelicPageTracker() {
  const location = useLocation();

  useEffect(() => {
    initNewRelic();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return null;
}
