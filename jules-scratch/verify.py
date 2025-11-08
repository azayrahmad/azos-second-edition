from playwright.sync_api import sync_playwright
import time

def run_verification(page):
    # Wait for the app to be ready
    page.wait_for_function("window.System && window.System.launchApp")

    # Launch the Desktop Themes app
    page.evaluate("console.log('Launching app...'); window.System.launchApp('desktopthemes')")

    # Wait for the app to open and take a screenshot
    page.wait_for_selector('.desktopthemes-app', timeout=60000)
    page.screenshot(path="jules-scratch/initial_state.png")

    # Select a new theme to trigger the progress window
    page.select_option('#theme-selector', 'the-blues')

    # Click the apply button
    page.click('button:has-text("Apply")')

    # Wait for the progress window to appear and take a screenshot
    page.wait_for_selector('.os-window:has-text("Applying theme...")')
    page.screenshot(path="jules-scratch/progress_window.png")

    # Wait for the progress to complete and the window to close
    page.wait_for_selector('.os-window:has-text("Applying theme...")', state='hidden', timeout=10000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("console", lambda msg: print(msg.text))
        page.goto("http://localhost:5173/azos-second-edition/")
        try:
            run_verification(page)
        finally:
            browser.close()
