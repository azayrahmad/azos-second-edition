from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    # Listen for console events and print them
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

    page.goto("http://localhost:5173/azos-second-edition/")

    # Wait for the page to be fully loaded
    page.wait_for_load_state("networkidle")

    # Launch the "About" app directly
    page.evaluate('window.appManager.launchApp("about")')

    # Wait for the window to appear
    page.wait_for_selector('.window')

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
