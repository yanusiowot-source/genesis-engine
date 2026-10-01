import { devices, webkit } from "playwright";

const url = process.env.WEBKIT_URL ?? "http://127.0.0.1:8080/";
const browser = await webkit.launch({ headless: true });
const context = await browser.newContext({ ...devices["iPhone 13"], locale: "ru-RU" });
await context.addInitScript(() => {
  localStorage.setItem("genesis-engine-onboarded-v5", "1");
});

async function openOnce() {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error).slice(0, 200)));
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForSelector("h1", { timeout: 20_000 });
    const info = await page.evaluate(() => ({
      title: document.title,
      ua: navigator.userAgent,
      w: window.innerWidth,
      h: window.innerHeight,
    }));
    return { info, errors };
  } finally {
    await page.close();
  }
}

let result = await openOnce();
if (result.errors.length) result = await openOnce();
console.log(JSON.stringify({ version: browser.version(), url, ...result.info, errors: result.errors }, null, 2));
await browser.close();
if (result.errors.length) process.exit(1);
