import { getSiteUrl, normalizeCanonicalUrl } from 'utilities';

const SITEMAP_QUERY = `
  query SitemapEntries($first: Int!) {
    contentNodes(first: $first) {
      nodes {
        uri
      }
    }
  }
`;

function getWordPressGraphqlUrl() {
  const wordpressUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;

  if (!wordpressUrl) {
    return undefined;
  }

  return `${wordpressUrl.replace(/\/$/, '')}/graphql`;
}

async function getWordPressUrls() {
  const endpoint = getWordPressGraphqlUrl();

  if (!endpoint) {
    return [];
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: SITEMAP_QUERY,
      variables: { first: 500 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap entries: ${response.status}`);
  }

  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error(payload.errors[0].message);
  }

  return [
    ...(payload?.data?.contentNodes?.nodes ?? []),
  ]
    .map((node) => node?.uri)
    .filter(Boolean);
}

function buildSitemapXml(urls = []) {
  const escapeXml = (value) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');

  const body = urls
    .map(
      (url) => `  <url>
    <loc>${escapeXml(url)}</loc>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

export async function getServerSideProps({ res }) {
  const siteUrl = getSiteUrl();
  const baseUrls = ['/', '/posts/', '/projects/'];

  let contentUrls = [];

  try {
    contentUrls = await getWordPressUrls();
  } catch (error) {
    console.warn('Unable to build full sitemap from WordPress:', error);
  }

  const normalizedUrls = Array.from(
    new Set(
      [...baseUrls, ...contentUrls]
        .map((value) => normalizeCanonicalUrl(value, siteUrl))
        .filter(Boolean)
    )
  );

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.write(buildSitemapXml(normalizedUrls));
  res.end();

  return {
    props: {},
  };
}

export default function SitemapXml() {
  return null;
}
