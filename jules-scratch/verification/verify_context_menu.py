from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Navigate to the application
    page.goto("http://localhost:5173/azos-second-edition/")

    # Wait for the page to be fully loaded and for the desktop area to be present
    desktop_area = page.locator('.desktop')
    expect(desktop_area).to_be_visible()
    page.wait_for_load_state('networkidle')

    # Dispatch the contextmenu event directly on the desktop element
    desktop_area.dispatch_event('contextmenu', {'button': 2})

    # Wait for the menu to appear
    menu = page.locator('.menu-popup')
    expect(menu).to_be_visible()

    # Take a screenshot for verification
    page.screenshot(path="jules-scratch/verification/context_menu.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)