/**
 * Default apply URL used by nearly all programs.
 */
export const DEFAULT_PROGRAM_APPLY_LINK = 'https://calstate.cas.myliaison.com/applicant/login';

/**
 * Program-specific one-off overrides keyed by Program URI.
 * Example key format: '/programs/ms-taxation/'
 */
export const PROGRAM_APPLY_LINK_OVERRIDES = {
  // '/program/example-program/': 'https://www.calpoly.edu/apply-example',
  '/program/business-analytics': 'https://calstate2026.cas.myliaison.com/applicant-ux/#/login',
  '/program/quantitative-economics': 'https://calstate2026.cas.myliaison.com/applicant-ux/#/login',
  '/program/graduate-certificate-in-emergency-management-at-cal-poly-maritime-academy': 'https://forms.office.com/Pages/ResponsePage.aspx?id=7FxEXsesV0-_0uMHcy0HBNHbpWxz32VJqPMOgGC_rLFUMVhRU0hFNUxMTE5HMEZTSkw3OVFKRjk0OC4u&wdLOR=cDF830F7A-0ED2-4EE2-B9C1-724FFCF25065',
};

function normalizeProgramUri(value) {
  if (!value) return '';

  const raw = String(value).trim().toLowerCase();
  const withoutDomain = raw.replace(/^https?:\/\/[^/]+/i, '');
  const withoutQueryOrHash = withoutDomain.split('#')[0].split('?')[0];
  const ensuredLeadingSlash = withoutQueryOrHash.startsWith('/')
    ? withoutQueryOrHash
    : `/${withoutQueryOrHash}`;
  const collapsedSlashes = ensuredLeadingSlash.replace(/\/{2,}/g, '/');

  return collapsedSlashes.replace(/\/+$/, '');
}

export function getProgramApplyLink(program) {
  const normalizedUri = normalizeProgramUri(program?.uri);
  if (normalizedUri) {
    const overrides = Object.fromEntries(
      Object.entries(PROGRAM_APPLY_LINK_OVERRIDES).map(([key, value]) => [
        normalizeProgramUri(key),
        value,
      ])
    );

    if (overrides[normalizedUri]) {
      return overrides[normalizedUri];
    }
  }

  return DEFAULT_PROGRAM_APPLY_LINK;
}
