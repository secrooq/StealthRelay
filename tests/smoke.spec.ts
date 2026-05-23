import { test, expect } from '@playwright/test';

test.describe('Production Smoke Test', () => {
  test('homepage loads and shows core elements', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/StealthRelay/);

    // Check for logo
    const logo = page.locator('text=StealthRelay').first();
    await expect(logo).toBeVisible();

    // Check for "Sign In" button
    const signInButton = page.locator('a:has-text("Sign In"):visible, button:has-text("Sign In"):visible').first();
    await expect(signInButton).toBeVisible();
  });

  test('support widget opens correctly', async ({ page }) => {
    await page.goto('/');

    // Locate the trigger button
    const trigger = page.locator('button[aria-label="Open Support Terminal"]');
    await expect(trigger).toBeVisible();

    // Click it
    await trigger.click();

    // Check if the hub is visible
    await expect(page.locator('h3:has-text("Tactical Hub")')).toBeVisible();

    // Switch to ticket tab
    await page.click('button:has-text("Secure Ticket")');

    // Check for form fields
    await expect(page.locator('label:has-text("Return Signal (Email)")')).toBeVisible();
    
    // Check for Turnstile (might take a second to load)
    const turnstile = page.locator('.turnstile-container').last();
    await expect(turnstile).toBeVisible();
  });

  test('stealthrelay terminal login loads', async ({ page }) => {
    await page.goto('/');

    // Click sign in
    await page.click('a:has-text("Sign In"):visible');

    // Verify it redirects/navigates to /login
    await page.waitForURL(/login/);
    
    // Check for our beautiful Cyberpunk terminal login panel elements
    const termLabel = page.locator('label:has-text("OPERATIVE EMAIL")');
    await expect(termLabel).toBeVisible();
  });
});
