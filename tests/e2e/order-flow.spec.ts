import { devices, expect, test, type Browser, type Page } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local" });
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const rest = (path: string, init: RequestInit = {}) =>
  fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=representation", ...init.headers } });

// The shop is only "open" 11am-9pm, so pin the hours open all day for a deterministic run, then restore them.
let savedHours: unknown[] = [];
test.beforeAll(async () => {
  savedHours = await (await rest("hours?select=*")).json();
  await rest("hours?dow=gte.0", { method: "PATCH", body: JSON.stringify({ is_closed: false, opens: "00:00", closes: "23:59" }) });
});
test.afterAll(async () => {
  await rest("hours", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify(savedHours) });
});

async function adminPage(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("/admin/login");
  await page.getByRole("button", { name: "Demo login" }).click();
  await expect(page.getByRole("heading", { name: "Today's orders" })).toBeVisible();
  await expect(page.getByText("Live", { exact: true })).toBeVisible(); // realtime connected
  return page;
}

test("a mock order travels customer → admin board → back to the customer, live", async ({ browser }) => {
  const admin = await adminPage(browser);

  // Customer on a phone
  const phone = await browser.newContext({ ...devices["iPhone 13"] });
  const cust = await phone.newPage();
  await cust.goto("/menu");
  await cust.getByRole("button", { name: /Customize Falafel Saj Wrap/ }).click();
  await cust.getByRole("button", { name: /^Add ·/ }).click();
  await cust.getByRole("button", { name: /^Order/ }).last().click();
  await cust.getByRole("button", { name: "Choose pickup time" }).click();
  await cust.getByLabel("Name").fill("Test Customer");
  await cust.getByLabel(/Phone/).fill("705 555 0123");
  await cust.getByLabel(/Email/).fill("customer@example.com");
  await cust.getByRole("button", { name: /^Pay \$/ }).click();

  // Fake pay sheet, then the live status page
  await expect(cust).toHaveURL(/\/pay\/mock\//);
  await cust.getByRole("button", { name: /^Pay \$/ }).click();
  await expect(cust).toHaveURL(/\/order\//);
  await expect(cust.getByRole("heading", { name: /Order in, Test/ })).toBeVisible();
  const orderNo = (await cust.getByText(/^Order #\d+$/).first().textContent())!.replace("Order #", "");

  // It pops onto the admin board with no refresh
  const card = admin.getByRole("article").filter({ hasText: `#${orderNo}` });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Accept" }).click();

  // …and the customer's page moves without a refresh
  await expect(cust.getByRole("heading", { name: "It's on the grill." })).toBeVisible();
  await admin.getByRole("article").filter({ hasText: `#${orderNo}` }).getByRole("button", { name: /Ready/ }).click();
  await expect(cust.getByRole("heading", { name: /Ready for pickup, Test/ })).toBeVisible();

  // The "ready" message landed in the outbox
  await admin.goto("/admin/outbox");
  await expect(admin.getByText("order ready").first()).toBeVisible();
});

test("sold-out, prep time and pause switch live on the public site", async ({ browser }) => {
  const admin = await adminPage(browser);
  const pubCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pub = await pubCtx.newPage();
  await pub.goto("/menu");
  await pub.getByRole("button", { name: "Sides and salads" }).click();
  const tabouli = pub.getByRole("article").filter({ hasText: "Tabouli" });
  await expect(tabouli.getByRole("button", { name: /Add Tabouli/ })).toBeEnabled();

  // wait for the public page's realtime connection (loads when the page is idle)
  await pub.waitForTimeout(3000);

  await admin.getByRole("switch", { name: "Tabouli available" }).click();
  await expect(tabouli.getByRole("button", { name: /Sold out Tabouli/ })).toBeDisabled();
  await admin.getByRole("switch", { name: "Tabouli available" }).click();
  await expect(tabouli.getByRole("button", { name: /Add Tabouli/ })).toBeEnabled();

  // pause closes ordering instantly
  await admin.getByRole("switch", { name: "Online ordering" }).click();
  await expect(tabouli.getByRole("button", { name: /Paused Tabouli/ })).toBeDisabled();
  await admin.getByRole("switch", { name: "Online ordering" }).click();
  await expect(tabouli.getByRole("button", { name: /Add Tabouli/ })).toBeEnabled();

  // prep time shows on the home page chip
  await pub.goto("/");
  await pub.mouse.click(10, 10); // a first interaction starts the public realtime connection
  await pub.waitForTimeout(3000);
  const before = Number((await pub.getByText(/Ready in ~\d+ min/).first().textContent())!.match(/\d+/)![0]);
  await admin.getByRole("button", { name: "More prep time" }).click();
  await expect(pub.getByText(`Ready in ~${before + 5} min`).first()).toBeVisible();
  await admin.getByRole("button", { name: "Less prep time" }).click();
  await expect(pub.getByText(`Ready in ~${before} min`).first()).toBeVisible();
});
