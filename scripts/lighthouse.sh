#!/usr/bin/env bash
# Mobile Lighthouse on the production build. Usage: pnpm build && pnpm start (other terminal), then pnpm lighthouse
set -euo pipefail
BASE="${LH_BASE:-http://localhost:3000}"
CHROME="${CHROME_PATH:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
mkdir -p .lighthouse
for path in "" menu; do
  name="${path:-home}"
  CHROME_PATH="$CHROME" pnpm dlx lighthouse@12 "$BASE/$path" --quiet \
    --chrome-flags="--headless=new --no-sandbox" \
    --only-categories=performance,accessibility,best-practices,seo \
    --output=json --output-path=".lighthouse/$name.json" >/dev/null
  node -e '
    const r = require("./.lighthouse/'"$name"'.json");
    const c = r.categories; const a = r.audits;
    console.log("'"$name"'".padEnd(6),
      "perf", Math.round(c.performance.score*100),
      "a11y", Math.round(c.accessibility.score*100),
      "bp", Math.round(c["best-practices"].score*100),
      "seo", Math.round(c.seo.score*100),
      "| LCP", a["largest-contentful-paint"].displayValue,
      "CLS", a["cumulative-layout-shift"].displayValue,
      "TBT", a["total-blocking-time"].displayValue);
  '
done
