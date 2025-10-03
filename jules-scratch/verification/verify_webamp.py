from playwright.sync_api import sync_playwright, expect
import re

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:5173/azos-second-edition/")

        # Wait for the page to load completely
        page.wait_for_load_state("networkidle")

        # Find the Webamp icon and double-click it
        webamp_icon = page.locator('div[data-app-id="webamp"]')
        expect(webamp_icon).to_be_visible()
        webamp_icon.dblclick()

        # Wait for the Webamp window to appear.
        webamp_window = page.locator('.os-window#webamp')
        expect(webamp_window).to_be_visible(timeout=15000)

        # Verify it's borderless
        expect(webamp_window).to_have_class(re.compile(r'\bno-chrome\b'))

        # Check for the taskbar button
        taskbar_button = page.locator('.taskbar-button[for="webamp"]')
        expect(taskbar_button).to_be_visible()

        # Verify desktop icons are still there
        about_icon = page.locator('div[data-app-id="about"]')
        expect(about_icon).to_be_visible()

        # A short extra wait for animations to complete
        page.wait_for_timeout(2000)

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

        browser.close()

if __name__ == "__main__":
    run_verification()