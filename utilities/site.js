function stripTrailingSlash(value = '') {
  if (!value) {
    return '';
  }

  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function normalizePathname(pathname = '/') {
  if (!pathname || pathname === '/') {
    return '/';
  }

  const normalized = pathname.replace(/\/{2,}/g, '/').replace(/\/$/, '');

  return normalized || '/';
}

const PRODUCTION_SITE_URL = 'https://grad.calpoly.edu';

export function getSiteUrl() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL;

  return stripTrailingSlash(siteUrl);
}

export function toAbsoluteUrl(urlOrPath, base = getSiteUrl()) {
  if (!urlOrPath) {
    return undefined;
  }

  try {
    return new URL(urlOrPath, base).toString();
  } catch {
    return urlOrPath;
  }
}

export function normalizeCanonicalUrl(urlOrPath, base = getSiteUrl()) {
  const absoluteUrl = toAbsoluteUrl(urlOrPath, base);

  if (!absoluteUrl) {
    return undefined;
  }

  try {
    const url = new URL(absoluteUrl);
    url.hash = '';
    url.search = '';
    url.pathname = normalizePathname(url.pathname);
    return url.toString();
  } catch {
    return absoluteUrl;
  }
}

function toBreadcrumbLabel(segment = '') {
  if (!segment) {
    return '';
  }

  if (segment.toLowerCase() === 'program') {
    return 'Programs';
  }

  return decodeURIComponent(segment)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function buildBreadcrumbs(pathOrUrl, currentLabel) {
  if (!pathOrUrl) {
    return [];
  }

  let pathname = pathOrUrl;

  try {
    pathname = new URL(pathOrUrl, getSiteUrl() || 'https://example.com').pathname;
  } catch {
    pathname = String(pathOrUrl).split('?')[0].split('#')[0];
  }

  const segments = pathname.split('/').filter(Boolean);

  if (!segments.length) {
    return [];
  }

  return segments.map((segment, index) => {
    const isLast = index === segments.length - 1;
    const href =
      segment.toLowerCase() === 'program'
        ? '/programs/'
        : `/${segments.slice(0, index + 1).join('/')}/`;

    return {
      href,
      label: isLast && currentLabel ? currentLabel : toBreadcrumbLabel(segment),
    };
  });
}
