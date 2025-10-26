
from playwright.sync_api import sync_playwright

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Navigate to the app
        page.goto("http://localhost:5173/azos-second-edition/")

        # Double-click the Notepad icon to launch the app
        page.dblclick('.desktop-icon[data-app-id="notepad"]')

        # Wait for the Notepad window to appear
        page.wait_for_selector('.window[id="notepad"]')

        # Click the "Code" menu, then "Theme" to open the theme submenu
        page.click('.menu-button:has-text("Code")')
        page.hover('.menu-item:has-text("Theme")')

        # Click a theme to apply it
        page.click('.menu-item:has-text("atom-one-dark")')

        # Take a screenshot to verify the theme is applied with a transparent background
        page.screenshot(path="jules-scratch/verification/notepad-theme-verification.png")

        browser.close()

if __name__ == "__main__":
    run_verification()
