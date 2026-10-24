/**
 * Vercel Routing Middleware: reports AI crawler reads and visits sent by AI assistants to the
 * platform's Visibility(TM) (POST /api/public/visibility/ingest), which counts them per page per day
 * for its Traffic screen.
 *
 * IT NEVER DELAYS A PAGE. It returns nothing, so the request continues to the static file
 * untouched, and the report is handed to waitUntil to finish after the response. Ordinary visitors
 * are not reported at all: only a user agent naming an AI crawler, or a visit whose referrer or
 * utm_source is an AI assistant. The platform decides which bot or assistant it was; this list is
 * the cheap pre-filter and may be wider than the platform's, never narrower.
 *
 * Unset VISIBILITY_INGEST_KEY (as in a local build or a preview without it) means it reports nothing.
 */

export const config = {
  // Pages only: no file with an extension (scripts, images, sitemap.xml, llms.txt) and no /assets.
  matcher: ["/((?!assets/|img/)[^.]*)"],
};

const BOTS =
  /GPTBot|OAI-SearchBot|ChatGPT-User|PerplexityBot|Perplexity-User|ClaudeBot|Claude-User|anthropic-ai|Google-Extended|Googlebot|bingbot|Amazonbot|Bytespider|Applebot|meta-externalagent/i;
const ASSISTANTS = /(^|\.)(chatgpt\.com|chat\.openai\.com|perplexity\.ai|gemini\.google\.com|claude\.ai|copilot\.microsoft\.com|meta\.ai|grok\.com|you\.com)$/i;

function fromAssistant(referer, url) {
  try {
    if (referer && ASSISTANTS.test(new URL(referer).hostname)) return true;
  } catch {
    // An unreadable referrer is not an assistant.
  }
  const tag = url.searchParams.get("utm_source");
  return Boolean(tag && ASSISTANTS.test(tag.replace(/^https?:\/\//, "").split("/")[0]));
}

export default function middleware(request, context) {
  const key = process.env.VISIBILITY_INGEST_KEY;
  if (!key) return;
  const ua = request.headers.get("user-agent") ?? "";
  const referer = request.headers.get("referer");
  const url = new URL(request.url);
  if (!BOTS.test(ua) && !fromAssistant(referer, url)) return;

  const report = fetch(process.env.VISIBILITY_INGEST_URL || "https://admin.cash4itnow.com/api/public/visibility/ingest", {
    method: "POST",
    headers: { "content-type": "application/json", "x-visibility-key": key },
    body: JSON.stringify({ ua: ua.slice(0, 500), url: url.toString().slice(0, 2000), referer: referer?.slice(0, 2000) ?? null }),
  }).catch(() => undefined);
  context?.waitUntil?.(report);
}
