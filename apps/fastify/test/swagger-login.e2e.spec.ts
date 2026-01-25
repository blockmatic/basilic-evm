import { expect, test } from '@playwright/test'

const TEST_EMAIL = 'test@example.com'
const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001'

/**
 * Helper function to extract magic link token from test endpoint
 */
async function extractToken(page: ReturnType<typeof test>['page']): Promise<string | null> {
  try {
    const response = await page.request.get(`${API_URL}/test/magic-link/last`)
    if (!response.ok()) {
      return null
    }
    const data = await response.json()
    return data.token || null
  } catch {
    return null
  }
}

test.describe('Scalar UI Login Flow', () => {
  test('should complete full login flow through Scalar UI', async ({ page, context }) => {
    // Step 1: Navigate to Scalar UI
    await page.goto(`${API_URL}/reference`)
    await page.waitForLoadState('networkidle')

    // Step 2: Verify login button is visible
    const loginButton = page.locator('#login-button')
    await expect(loginButton).toBeVisible()
    await expect(loginButton).toHaveText('Login')

    // Step 3: Click login button to open modal
    await loginButton.click()

    // Step 4: Verify modal is visible
    const modalOverlay = page.locator('#modal-overlay')
    await expect(modalOverlay).toBeVisible()

    // Step 5: Enter email in modal
    const emailInput = page.locator('#email')
    await expect(emailInput).toBeVisible()
    await emailInput.fill(TEST_EMAIL)

    // Step 6: Submit form to request magic link
    const submitButton = page.locator('#submit-button')
    await submitButton.click()

    // Step 7: Wait for success message
    const successMessage = page.locator('#email-success')
    await expect(successMessage).toBeVisible({ timeout: 10000 })
    await expect(successMessage).toContainText('Check your email')

    // Step 8: Extract token from test endpoint
    const token = await extractToken(page)
    expect(token).toBeTruthy()
    expect(typeof token).toBe('string')

    if (!token) {
      throw new Error('Failed to extract magic link token')
    }

    // Step 9: Set up message listener before opening callback (not used but kept for future enhancement)

    // Step 10: Open callback URL in new page to verify token
    const callbackUrl = `${API_URL}/reference/callback?token=${token}`
    const callbackPage = await context.newPage()
    await callbackPage.goto(callbackUrl)
    await callbackPage.waitForLoadState('networkidle')

    // Step 11: Wait for callback page to send postMessage
    await callbackPage.waitForTimeout(2000)
    await callbackPage.close()

    // Step 12: Check that token is stored in localStorage of main page
    const tokenInStorage = await page.evaluate(() => localStorage.getItem('scalar-token'))
    expect(tokenInStorage).toBeTruthy()

    // Step 12: Verify login button text changed to "Logout"
    await expect(loginButton).toHaveText('Logout', { timeout: 5000 })

    // Step 13: Close callback page
    await callbackPage.close()

    // Step 14: Interact with authenticated endpoint through Scalar UI
    // Find the test/authed endpoint in Scalar UI and try to execute it
    // This is a bit tricky since we need to interact with Scalar's UI
    // For now, we'll verify the token is set and can be used for API calls

    // Step 15: Verify we can call the authenticated endpoint directly with the token
    const authedResponse = await page.request.get(`${API_URL}/test/authed`, {
      headers: {
        authorization: `Bearer ${tokenInStorage}`,
      },
    })

    expect(authedResponse.ok()).toBeTruthy()
    const authedData = await authedResponse.json()
    expect(authedData.user).toBeDefined()
    expect(authedData.user.email).toBe(TEST_EMAIL)
  })

  test('should handle logout correctly', async ({ page }) => {
    // First, login (reuse logic from previous test)
    await page.goto(`${API_URL}/reference`)
    await page.waitForLoadState('networkidle')

    const loginButton = page.locator('#login-button')
    await loginButton.click()

    const emailInput = page.locator('#email')
    await emailInput.fill(TEST_EMAIL)

    const submitButton = page.locator('#submit-button')
    await submitButton.click()

    await page.waitForSelector('#email-success', { timeout: 10000 })

    const token = await extractToken(page)
    if (!token) {
      throw new Error('Failed to extract token')
    }

    const callbackUrl = `${API_URL}/reference/callback?token=${token}`
    const callbackPage = await page.context().newPage()
    await callbackPage.goto(callbackUrl)
    await callbackPage.waitForTimeout(2000)
    await callbackPage.close()

    // Wait for token to be set
    await page.waitForTimeout(1000)

    // Verify logged in state
    await expect(loginButton).toHaveText('Logout')

    // Click logout
    await loginButton.click()

    // Verify page reloads and token is cleared
    await page.waitForLoadState('networkidle')
    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('scalar-token'))
    expect(tokenAfterLogout).toBeNull()

    // Verify login button is back
    const loginButtonAfterLogout = page.locator('#login-button')
    await expect(loginButtonAfterLogout).toHaveText('Login')
  })
})
