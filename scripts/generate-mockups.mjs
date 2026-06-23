import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const baseURL = process.env.MOCKUP_BASE_URL ?? "http://127.0.0.1:3000";
const outputDir = path.join(process.cwd(), "docs", "mockups");
const viewport = { width: 1478, height: 1024 };

const pages = [
  ["01-overview.png", "/overview"],
  ["02-markets.png", "/markets"],
  ["03-portfolio.png", "/portfolio"],
  ["04-trade.png", "/trade"],
  ["05-journal.png", "/journal"],
  ["06-cash.png", "/cash"],
  ["07-performance.png", "/performance"],
  ["08-settings.png", "/settings"],
];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });

for (const [filename, route] of pages) {
  const url = new URL(route, baseURL);
  url.searchParams.set("__fixture", "design");
  await page.goto(url.toString(), { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outputDir, filename), fullPage: false });
}

const contactImages = await Promise.all(
  pages.map(async ([filename, route]) => {
    const image = await readFile(path.join(outputDir, filename), "base64");

    return `
      <figure>
        <img src="data:image/png;base64,${image}" />
        <figcaption>${route}</figcaption>
      </figure>
    `;
  }),
);

const contactItems = contactImages.join("");

await page.setContent(
  `
    <!doctype html>
    <html>
      <head>
        <style>
          html, body {
            margin: 0;
            width: ${viewport.width}px;
            height: ${viewport.height}px;
            overflow: hidden;
            background: #070b10;
            color: #e7edf4;
            font-family: Arial, sans-serif;
          }
          main {
            box-sizing: border-box;
            width: 100%;
            height: 100%;
            padding: 18px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }
          figure {
            margin: 0;
            border: 1px solid rgba(103, 128, 150, 0.35);
            background: #0d141d;
            overflow: hidden;
            position: relative;
          }
          img {
            width: 100%;
            height: 210px;
            object-fit: cover;
            object-position: top left;
            display: block;
          }
          figcaption {
            border-top: 1px solid rgba(103, 128, 150, 0.25);
            padding: 9px 10px;
            font: 700 13px/1.2 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          }
          .watermark {
            position: fixed;
            right: 18px;
            bottom: 18px;
            border: 1px solid rgba(199, 151, 53, 0.5);
            background: rgba(43, 34, 13, 0.92);
            color: #dfc27c;
            padding: 6px 10px;
            font: 700 11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          }
        </style>
      </head>
      <body>
        <main>${contactItems}</main>
        <div class="watermark">DESIGN FIXTURE - NOT RUNTIME DATA</div>
      </body>
    </html>
  `,
  { waitUntil: "load" },
);
await page.screenshot({ path: path.join(outputDir, "contact-sheet.png"), fullPage: false });

await browser.close();
