const CONSENT_KEY = 'cookieConsent';

function isEnabled() {
  return import.meta.env.VITE_NEW_RELIC_ENABLED === 'true';
}

export function isAnalyticsAllowed() {
  return localStorage.getItem(CONSENT_KEY) === 'true';
}

function beacons() {
  const region = (import.meta.env.VITE_NEW_RELIC_REGION ?? 'EU').toUpperCase();
  if (region === 'EU') {
    return { beacon: 'bam.eu01.nr-data.net', errorBeacon: 'bam.eu01.nr-data.net' };
  }
  return { beacon: 'bam.nr-data.net', errorBeacon: 'bam.nr-data.net' };
}

function getAgent() {
  return window.newrelic;
}

let initStarted = false;

export function initNewRelic() {
  if (!isEnabled() || !isAnalyticsAllowed() || initStarted) {
    return;
  }

  const licenseKey = import.meta.env.VITE_NEW_RELIC_LICENSE_KEY;
  const applicationID = import.meta.env.VITE_NEW_RELIC_APPLICATION_ID;
  const accountID = import.meta.env.VITE_NEW_RELIC_ACCOUNT_ID;

  if (!licenseKey || !applicationID || !accountID) {
    console.warn('New Relic Browser: missing VITE_NEW_RELIC_* build variables');
    return;
  }

  initStarted = true;

  import('@newrelic/browser-agent/loaders/browser-agent')
    .then(({ BrowserAgent }) => {
      const { beacon, errorBeacon } = beacons();
      new BrowserAgent({
        init: {
          distributed_tracing: { enabled: true },
          privacy: { cookies_enabled: true },
          ajax: { deny_list: [] },
        },
        info: {
          beacon,
          errorBeacon,
          licenseKey,
          applicationID,
          sa: 1,
        },
        loader_config: {
          accountID,
          trustKey: import.meta.env.VITE_NEW_RELIC_TRUST_KEY ?? accountID,
          agentID: import.meta.env.VITE_NEW_RELIC_AGENT_ID ?? applicationID,
          licenseKey,
          applicationID,
        },
      });
    })
    .catch((err) => {
      initStarted = false;
      console.warn('New Relic Browser init failed', err);
    });
}

export function trackPageView(pathname) {
  if (!isEnabled() || !isAnalyticsAllowed()) {
    return;
  }
  getAgent()?.setCurrentRouteName(pathname);
}

function linkType(href) {
  if (!href) {
    return 'action';
  }
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return 'external';
  }
  if (href.startsWith('/api/')) {
    return 'api';
  }
  return 'internal';
}

function linkLabel(element, href) {
  const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
  if (text) {
    return text.slice(0, 120);
  }
  if (href) {
    return href.slice(0, 120);
  }
  return element.getAttribute('aria-label') ?? 'unknown';
}

export function trackLinkClick({ href, label, page, element, linkType: type }) {
  if (!isEnabled() || !isAnalyticsAllowed()) {
    return;
  }

  const nr = getAgent();
  if (!nr) {
    return;
  }

  nr.addPageAction('support_link_click', {
    href: href ?? '',
    label,
    page,
    element,
    linkType: type,
  });
}

export function resolveClickTarget(target) {
  const anchor = target.closest('a[href]');
  if (anchor) {
    return {
      element: 'a',
      href: anchor.getAttribute('href') ?? '',
      label: linkLabel(anchor, anchor.getAttribute('href')),
      linkType: linkType(anchor.getAttribute('href')),
    };
  }

  const button = target.closest('button');
  if (button) {
    return {
      element: 'button',
      href: '',
      label: linkLabel(button, ''),
      linkType: 'action',
    };
  }

  const clickable = target.closest('[role="link"], .clickable, .support-doc-link, .report-card');
  if (clickable) {
    return {
      element: clickable.tagName.toLowerCase(),
      href: clickable.getAttribute('href') ?? '',
      label: linkLabel(clickable, clickable.getAttribute('href')),
      linkType: linkType(clickable.getAttribute('href')),
    };
  }

  return null;
}
