from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Give the server a moment to start up
    time.sleep(5)

    page.goto("http://localhost:5173/")
    page.wait_for_load_state("networkidle")

    # Click the start button
    page.click(".start-button")

    # Wait for the start menu to appear
    page.wait_for_selector("#start-menu")

    # Click the shutdown button
    page.click('[data-action="shutdown"]')

    # Wait for the dialog to appear
    page.wait_for_selector(".window")

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png", full_page=True)

    browser.close()

with sync_playwright() as playwright:
    run(playwright)