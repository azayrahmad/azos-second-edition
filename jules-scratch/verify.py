
from playwright.sync_api import sync_playwright

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:5173/azos-second-edition/", timeout=120000)

        # Wait for the desktop to be ready
        page.wait_for_selector(".desktop-icon[data-app-id='my-computer']", timeout=60000)

        # Double-click "My Computer" to open Explorer
        page.dblclick(".desktop-icon[data-app-id='my-computer']")

        # Wait for the Explorer window to appear
        explorer_window = page.locator("#my-computer-explorer")
        explorer_window.wait_for(timeout=30000)

        # Right-click inside the icon container to open the context menu
        icon_container = explorer_window.locator(".explorer-icon-view")
        icon_container.click(button="right")

        # Wait for the context menu to appear
        page.wait_for_selector(".menu-item:has-text('Arrange Icons')", timeout=10000)

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)
