from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:5173/", wait_until='networkidle')

        # Wait for the desktop to load
        expect(page.locator(".desktop")).to_be_visible(timeout=60000)

        # Open Notepad
        page.dblclick('.desktop-icon:has-text("Notepad")')

        # Wait for Notepad window to appear
        notepad_window_selector = "div.window:has-text('Untitled - Notepad')"
        expect(page.locator(notepad_window_selector)).to_be_visible()

        # Open HTML Preview
        page.click(f"{notepad_window_selector} .menu-button:has-text('View')")
        page.click(".menu-item:has-text('HTML Preview')")

        # Wait for preview window to appear
        preview_window_selector = "div.window:has-text('HTML/Markdown Preview')"
        expect(page.locator(preview_window_selector)).to_be_visible()

        # Type in Notepad
        notepad_textarea_selector = f"{notepad_window_selector} .codeInput"
        page.fill(notepad_textarea_selector, '# Hello, World!')

        # Assert that the preview window has the correct content
        preview_content_selector = f"{preview_window_selector} .markdown-preview h1"
        preview_content_locator = page.locator(preview_content_selector)
        expect(preview_content_locator).to_have_text("Hello, World!")

        # Take screenshot of the preview window
        preview_window_locator = page.locator(preview_window_selector)
        preview_window_locator.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)