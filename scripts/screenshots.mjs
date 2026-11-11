// Capturas en móvil, tablet y escritorio + auditoría de accesibilidad (axe).
// Uso: BASE_URL=http://localhost:3000 node scripts/screenshots.mjs
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const CHROME = process.env.CHROME_PATH ?? "/usr/bin/google-chrome";
const pages = ["/", "/servicios", "/servicios/alisado-de-gotele", "/calculadora", "/empresa", "/contacto", "/legal/hoja-informativa"];
const viewports = { movil: { width: 390, height: 844 }, tablet: { width: 820, height: 1180 }, escritorio: { width: 1440, height: 900 } };

mkdirSync("screenshots", { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const report = [];

for (const [vp, size] of Object.entries(viewports)) {
  const ctx = await browser.newContext({ viewport: size, reducedMotion: "reduce", deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  for (const p of pages) {
    await page.goto(BASE + p, { waitUntil: "networkidle" });
    const name = p === "/" ? "inicio" : p.slice(1).replaceAll("/", "_");
    await page.screenshot({ path: `screenshots/${vp}-${name}.png`, fullPage: true });
    if (vp === "escritorio" || vp === "movil") {
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      report.push({ vp, page: p, violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, target: v.nodes.slice(0, 3).map((x) => x.target.join(" ")) })) });
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (overflow) report.push({ vp, page: p, overflowX: true });
  }

  // Recorrido de la calculadora
  await page.goto(BASE + "/calculadora", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Paredes y techos/ }).click();
  await page.getByRole("button", { name: /Continuar/ }).click();
  await page.locator("#q-alisado-gotele").fill("60");
  await page.locator("#q-pintura-liso").fill("25,5");
  await page.screenshot({ path: `screenshots/${vp}-calc-2-medidas.png`, fullPage: true });
  await page.getByRole("button", { name: /Continuar/ }).click();
  await page.getByText("Con grietas o desperfectos").click();
  await page.getByText("Fuera de Madrid capital").click();
  await page.getByText("Vivienda", { exact: true }).click();
  await page.getByRole("button", { name: /Continuar/ }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `screenshots/${vp}-calc-4-estimacion.png`, fullPage: true });
  const total = await page.locator("h2 + div .display, .display.tabular-nums").last().textContent();
  report.push({ vp, calculatorTotal: total });
  await page.getByRole("button", { name: /Pedir presupuesto personalizado/ }).click();
  await page.screenshot({ path: `screenshots/${vp}-calc-5-contacto.png`, fullPage: true });
  if (errors.length) report.push({ vp, consoleErrors: errors });
  await ctx.close();
}

await browser.close();
writeFileSync("screenshots/report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 1));
