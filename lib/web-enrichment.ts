const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
};

const MAX_TEXT_LENGTH = 6000;

type WebPageSummary = {
  url: string;
  title: string;
  text: string;
};

function withTimeout(ms: number) {
  return AbortSignal.timeout(ms);
}

function ensureProtocol(url: string) {
  if (!url.trim()) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `https://${url}`;
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|h5|h6|br)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function extractTitle(html: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) {
    return stripHtml(titleMatch[1]).slice(0, 200);
  }

  const ogTitleMatch = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i
  );

  return ogTitleMatch?.[1] ? stripHtml(ogTitleMatch[1]).slice(0, 200) : "";
}

function extractMetaDescription(html: string) {
  const metaMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i
  );

  if (metaMatch?.[1]) {
    return stripHtml(metaMatch[1]).slice(0, 320);
  }

  const ogMatch = html.match(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i
  );

  return ogMatch?.[1] ? stripHtml(ogMatch[1]).slice(0, 320) : "";
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: DEFAULT_HEADERS,
    redirect: "follow",
    signal: withTimeout(10000)
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  const html = await response.text();
  return {
    finalUrl: response.url,
    html
  };
}

async function fetchPageSummary(url: string): Promise<WebPageSummary | null> {
  try {
    const { finalUrl, html } = await fetchHtml(url);
    const text = stripHtml(html);
    const meta = extractMetaDescription(html);
    const mergedText = [meta, text].filter(Boolean).join("\n").slice(0, MAX_TEXT_LENGTH);

    return {
      url: finalUrl,
      title: extractTitle(html),
      text: mergedText
    };
  } catch {
    return null;
  }
}

function uniqueByUrl(pages: WebPageSummary[]) {
  const seen = new Set<string>();
  return pages.filter((page) => {
    if (seen.has(page.url)) {
      return false;
    }
    seen.add(page.url);
    return true;
  });
}

function extractSearchResultUrls(html: string) {
  const urls: string[] = [];
  const matches = html.matchAll(/https?:\/\/[^\s"'<>]+/g);

  for (const match of matches) {
    const url = match[0]
      .replace(/&amp;/g, "&")
      .replace(/[),.;]+$/g, "");

    if (
      url.includes("duckduckgo.com") ||
      url.includes("javascript:void") ||
      url.includes("/y.js")
    ) {
      continue;
    }

    urls.push(url);
  }

  return Array.from(new Set(urls)).slice(0, 5);
}

async function searchCompanyPages(company: string) {
  const query = encodeURIComponent(`${company} official website company about`);
  const url = `https://html.duckduckgo.com/html/?q=${query}`;

  try {
    const { html } = await fetchHtml(url);
    return extractSearchResultUrls(html);
  } catch {
    return [];
  }
}

export async function collectCompanyContext(company: string, website: string) {
  const candidates: string[] = [];
  const normalizedWebsite = ensureProtocol(website);

  if (normalizedWebsite) {
    const trimmed = normalizedWebsite.replace(/\/+$/, "");
    candidates.push(trimmed, `${trimmed}/about`, `${trimmed}/about-us`, `${trimmed}/company`);
  }

  if (candidates.length === 0) {
    const searchResults = await searchCompanyPages(company);
    candidates.push(...searchResults);
  }

  const pageResults = await Promise.all(candidates.slice(0, 5).map(fetchPageSummary));
  const pages = uniqueByUrl(pageResults.filter((page): page is WebPageSummary => Boolean(page)));

  return {
    normalizedWebsite,
    pages
  };
}
