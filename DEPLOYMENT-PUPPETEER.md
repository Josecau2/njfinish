Puppeteer deployment notes

Goal: Avoid Chromium download during `npm install` (common in CI/Docker with restricted egress) while keeping PDF/email features working.

What changed
- Switched dependency to `puppeteer-core` (no bundled browser)
- Added `utils/puppeteerLauncher.js` to resolve a system Chromium and safe launch flags
- Updated controllers to use the helper

Runtime requirements
- Install a system Chromium/Chrome in the image/host
- Optionally set `PUPPETEER_EXECUTABLE_PATH` to the browser path

Docker example (Debian/Ubuntu base)
```
RUN apt-get update && \
    apt-get install -y chromium && \
    rm -rf /var/lib/apt/lists/*

# Optional explicit path (varies by distro)
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

Alpine example
```
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

If you prefer the bundled download
- Replace `puppeteer-core` with `puppeteer` in package.json
- Ensure outbound access to storage.googleapis.com during npm install
- Optionally set `PUPPETEER_SKIP_DOWNLOAD=false`

Flags used
- `--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu`
