from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173")
        page.wait_for_load_state("networkidle")


        # Open Notepad
        page.dblclick('text="Notepad"')

        # Wait for the window to appear
        page.wait_for_selector('.window[data-app-id="notepad"]', timeout=60000)

        # Type some text
        textarea = page.locator('.window[data-app-id="notepad"] .codeInput')
        textarea.type("This is some initial text.")

        # Click "File" -> "New"
        page.click('.window[data-app-id="notepad"] .menu-bar-item:has-text("File")')
        page.click('.menu[data-owner-id*="File"] .menu-item:has-text("New")')

        # Verify the content is cleared
        assert textarea.input_value() == ''

        # Add text to clipboard
        page.evaluate('() => navigator.clipboard.writeText("Pasted from clipboard!")')

        # Paste some text
        page.click('.window[data-app-id="notepad"] .menu-bar-item:has-text("Edit")')
        page.click('.menu[data-owner-id*="Edit"] .menu-item:has-text("Paste")')

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

        browser.close()

run()