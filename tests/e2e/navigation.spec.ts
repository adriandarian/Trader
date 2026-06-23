import { expect, test } from "@playwright/test";

const routes = [
  { href: "/overview", label: "Overview", testId: "nav-overview" },
  { href: "/markets", label: "Markets", testId: "nav-markets" },
  { href: "/portfolio", label: "Portfolio", testId: "nav-portfolio" },
  { href: "/trade", label: "Trade", testId: "nav-trade" },
  { href: "/journal", label: "Journal", testId: "nav-journal" },
  { href: "/cash", label: "Deposits & Cash", testId: "nav-cash" },
  { href: "/performance", label: "Performance", testId: "nav-performance" },
  { href: "/settings", label: "Settings", testId: "nav-settings" },
] as const;

test.describe("left navigation routes", () => {
  test("clicking every sidebar item changes URL, heading, and active state", async ({ page }) => {
    await page.goto("/overview");
    await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();

    for (const route of routes) {
      await page.getByTestId(route.testId).click();
      await expect(page).toHaveURL(new RegExp(`${route.href}$`));
      await expect(page.getByRole("heading", { level: 1, name: route.label })).toBeVisible();
      await expect(page.getByTestId(route.testId)).toHaveAttribute("aria-current", "page");
      await expect(page.getByTestId(route.testId)).toHaveAttribute("data-active", "true");
      await expect(page.getByTestId("route-content")).toContainText(route.label);
      await expect(page.getByText("coming soon", { exact: false })).toHaveCount(0);
    }
  });

  test("direct route loads return 200 and meaningful visible content", async ({ page, request }) => {
    for (const route of routes) {
      const response = await request.get(route.href);
      expect(response.status(), route.href).toBe(200);

      await page.goto(route.href);
      await expect(page.getByRole("heading", { level: 1, name: route.label })).toBeVisible();
      await expect(page.getByTestId("route-content")).toBeVisible();
      await expect(page.getByTestId("route-content")).not.toHaveText(/^\s*$/);
      await expect(page.getByText("coming soon", { exact: false })).toHaveCount(0);
    }
  });

  test("browser back and forward move route and active sidebar state", async ({ page }) => {
    await page.goto("/overview");
    await page.getByTestId("nav-markets").click();
    await expect(page).toHaveURL(/\/markets$/);
    await page.getByTestId("nav-portfolio").click();
    await expect(page).toHaveURL(/\/portfolio$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/markets$/);
    await expect(page.getByRole("heading", { level: 1, name: "Markets" })).toBeVisible();
    await expect(page.getByTestId("nav-markets")).toHaveAttribute("aria-current", "page");

    await page.goForward();
    await expect(page).toHaveURL(/\/portfolio$/);
    await expect(page.getByRole("heading", { level: 1, name: "Portfolio" })).toBeVisible();
    await expect(page.getByTestId("nav-portfolio")).toHaveAttribute("aria-current", "page");
  });
});
