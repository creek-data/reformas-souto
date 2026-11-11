// Capturas en móvil, tablet y escritorio, auditoría de accesibilidad (axe) y
// recorridos completos: calculadora → precio con email → visita, baño → visita, y panel.
// Uso (con `npm run dev` en marcha): BASE_URL=http://localhost:3000 node scripts/screenshots.mjs
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const CHROME = process.env.CHROME_PATH ?? "/usr/bin/google-chrome";
const pages = ["/", "/servicios", "/servicios/alisado-de-gotele", "/servicios/reformas-de-bano", "/calculadora", "/empresa", "/contacto"];
const viewports = { movil: { width: 390, height: 844 }, tablet: { width: 820, height: 1180 }, escritorio: { width: 1440, height: 900 } };

mkdirSync("screenshots", { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const report = [];
const axe = async (page, vp, p) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  if (r.violations.length) report.push({ vp, page: p, violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, target: v.nodes.slice(0, 3).map((x) => x.target.join(" ")) })) });
};

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
    if (vp !== "tablet") await axe(page, vp, p);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (overflow) report.push({ vp, page: p, overflowX: true });
  }

  if (vp !== "tablet") {
    // Calculadora con precio
    await page.goto(BASE + "/calculadora", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Paredes y techos/ }).click();
    await page.getByRole("button", { name: /Continuar/ }).click();
    await page.locator("#q-alisado-gotele").fill("60");
    await page.getByRole("button", { name: "no sé los metros" }).first().click();
    await page.screenshot({ path: `screenshots/${vp}-calc-2-medidas.png`, fullPage: true });
    await page.getByRole("button", { name: /Ver mi precio/ }).click();
    await page.waitForTimeout(3200);
    await page.screenshot({ path: `screenshots/${vp}-calc-3-email.png`, fullPage: true });
    await axe(page, vp, "calc-email");
    await page.locator("#f-email").fill("prueba@correo.test");
    await page.locator("#f-codigoPostal").fill("28019");
    await page.locator('input[name="consentimiento"]').check();
    await page.getByRole("button", { name: /Ver mi precio/ }).click();
    await page.getByText("Precio base").first().waitFor();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `screenshots/${vp}-calc-4-precio.png`, fullPage: true });
    report.push({ vp, precio: await page.locator(".display.tabular-nums").first().textContent() });
    await page.getByRole("button", { name: /Elegir día de visita/ }).first().click();
    await page.locator('button[aria-pressed="false"].tabular-nums, .grid button.tabular-nums').first().waitFor();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `screenshots/${vp}-calc-5-agenda.png`, fullPage: true });
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) report.push({ vp, page: "calc-agenda", overflowX: true });
    await axe(page, vp, "calc-agenda");
    await page.locator(".grid > button.tabular-nums").first().click();
    await page.locator("#f-nombre").fill("Ana Prueba");
    await page.locator("#f-telefono").fill("691567430");
    await page.locator("#f-direccion").fill("Calle Mayor 3, 2ºB");
    await page.getByRole("button", { name: /^Reservar/ }).click();
    await page.getByText("Te esperamos el").waitFor();
    await page.screenshot({ path: `screenshots/${vp}-calc-6-reservada.png`, fullPage: true });
  }

  if (vp === "movil") {
    // Baño: sin precio, directo a la visita
    await page.goto(BASE + "/calculadora?trabajo=banos", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Continuar/ }).click();
    await page.getByRole("button", { name: "Cambiar bañera por plato de ducha" }).click();
    await page.screenshot({ path: `screenshots/${vp}-bano-2-detalles.png`, fullPage: true });
    await page.getByRole("button", { name: /Continuar/ }).click();
    await page.waitForTimeout(3200);
    await page.locator("#f-nombre").fill("Luis Baño");
    await page.locator("#f-telefono").fill("600111222");
    await page.locator("#f-codigoPostal").fill("28025");
    await page.locator('input[name="consentimiento"]').check();
    await page.getByRole("button", { name: /Seguir y elegir día/ }).click();
    await page.getByRole("heading", { name: "Elige día para la visita" }).waitFor();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `screenshots/${vp}-bano-3-agenda.png`, fullPage: true });
  }

  // Panel
  await page.goto(BASE + "/panel", { waitUntil: "networkidle" });
  if (await page.locator('input[name="password"]').count()) {
    await page.locator('input[name="password"]').fill("souto-local");
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.getByText("Por hacer").waitFor();
  }
  await page.screenshot({ path: `screenshots/${vp}-panel-resumen.png`, fullPage: true });
  if (vp !== "tablet") await axe(page, vp, "panel");
  await page.getByRole("button", { name: /^Solicitudes \d/ }).click();
  await page.screenshot({ path: `screenshots/${vp}-panel-solicitudes.png`, fullPage: true });
  await page.locator("tbody tr").first().click();
  await page.getByRole("dialog").waitFor();
  await page.screenshot({ path: `screenshots/${vp}-panel-ficha.png` });
  if (vp !== "tablet") await axe(page, vp, "panel-ficha");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /^Agenda \d/ }).click();
  await page.screenshot({ path: `screenshots/${vp}-panel-agenda.png`, fullPage: true });

  if (errors.length) report.push({ vp, consoleErrors: [...new Set(errors)].slice(0, 10) });
  await ctx.close();
}

await browser.close();
writeFileSync("screenshots/report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 1));
