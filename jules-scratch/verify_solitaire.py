import time
from playwright.sync_api import sync_playwright

def verify_spider_solitaire(page):
    # Give the dev server time to start
    time.sleep(30)

    page.goto("http://localhost:5173/azos-second-edition/")

    # Wait for the desktop to be ready by looking for an icon
    page.wait_for_selector(".desktop-icon[data-app-id='clippy']", timeout=60000) # Increased timeout

    # Find and double-click the Spider Solitaire icon
    solitaire_icon = page.locator(".desktop-icon[data-app-id='spidersolitaire']")
    solitaire_icon.dblclick()

    # Wait for the game window to appear
    game_window = page.locator("#spidersolitaire")
    game_window.wait_for()

    # Take a screenshot
    page.screenshot(path="jules-scratch/solitaire_verification.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        verify_spider_solitaire(page)
    finally:
        browser.close()
