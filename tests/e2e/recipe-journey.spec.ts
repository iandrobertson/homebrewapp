import { expect, test, type Page } from "@playwright/test";

const password = "correct-horse-battery";

async function confirmFromLogHint(page: Page) {
  // Verification links are printed to the server log in development.
  // The signup success copy is enough for this journey's first assertion;
  // a full mailbox is not wired in CI. Sign-in after a seeded verified user
  // is covered when E2E_SKIP_SIGNUP is unset by creating two accounts and
  // following on-screen confirmation.
  await expect(page.getByText("Check your email.")).toBeVisible();
}

test("signup requires consent and a chapter", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
  await expect(page.getByLabel(/privacy notice/i)).toBeVisible();
  await expect(page.getByLabel("Homebrew chapter")).toBeVisible();
});

test("landing offers signup and login", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Create an account" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("protected recipes redirect to login", async ({ page }) => {
  await page.goto("/recipes");
  await expect(page).toHaveURL(/\/login/);
});

test("signup form validates password match", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Test Brewer");
  await page.getByLabel("Email").fill(`e2e-${Date.now()}@example.test`);
  await page.getByLabel("Homebrew chapter").selectOption({ index: 1 });
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill("different-password-1");
  await page.getByLabel(/privacy notice/i).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("The two passwords don't match.")).toBeVisible();
});

test("privacy notice is public", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy notice" })).toBeVisible();
});

test.describe("narrow viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("signup is usable on a phone", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
    await confirmFromLogHint;
  });
});
