from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    page.goto("http://localhost:5173/")

    # Wait for the desktop to be ready
    page.wait_for_selector(".desktop")

    # Open Notepad
    page.dblclick('[data-app-id="notepad"]')

    # Wait for the notepad window to appear
    notepad_window = page.locator(".window:has-text('Notepad')")
    notepad_window.wait_for()

    # Type some unformatted code
    text_area = notepad_window.locator("textarea.codeInput")
    code = """
function hello() {
console.log("Hello, world!");
}
"""
    text_area.fill(code)

    # Set language to Javascript
    page.keyboard.press("Alt+L")
    page.keyboard.press("ArrowDown")
    page.keyboard.press("Enter")


    # Click the "Format" menu bar item
    page.keyboard.press("Alt+O")
    page.keyboard.press("Enter")


    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification_refactor.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)