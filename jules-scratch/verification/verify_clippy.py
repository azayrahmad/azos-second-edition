
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:5173/azos-second-edition/")

        # Wait for the desktop to load
        page.wait_for_selector(".desktop-icon")

        # Double-click the Clippy icon to launch it
        clippy_icon = page.locator('.desktop-icon:has-text("Clippy")')
        clippy_icon.dblclick()

        page.wait_for_timeout(4000)

        # Click on Clippy to open the input balloon
        clippy_agent = page.locator(".clippy")
        clippy_agent.click()

        # Wait for the balloon to appear
        page.wait_for_selector(".clippy-balloon")

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/clippy_balloon.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
