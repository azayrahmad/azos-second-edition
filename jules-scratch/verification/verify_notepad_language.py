from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:5173", wait_until="domcontentloaded")

        # Wait for the desktop icon to be attached to the DOM
        notepad_icon_locator = page.locator('.desktop-icon:has-text("Notepad")')
        notepad_icon_locator.wait_for(state='attached', timeout=15000)

        # Force the double click to open Notepad, bypassing visibility checks
        notepad_icon_locator.dblclick(force=True)

        # Wait for the Notepad window to appear
        notepad_window = page.locator(".window .window-titlebar:has-text('Notepad')")
        expect(notepad_window).to_be_visible(timeout=10000)

        # Click the Language menu
        lang_menu = page.locator(".window:has-text('Notepad') .menu-button:has-text('Language')")
        lang_menu.click()

        # Wait for the Language menu popup to appear
        lang_menu_popup = page.locator(".menu-popup[aria-labelledby*='Language']")
        expect(lang_menu_popup).to_be_visible()

        # Click on Python
        python_menu_item = lang_menu_popup.locator('.menu-item-label:has-text("Python")')
        python_menu_item.click()

        # Let the action complete
        page.wait_for_timeout(500)

        # Re-open the language menu to verify the checkmark
        lang_menu.click()
        expect(lang_menu_popup).to_be_visible()

        # Verify that the Python menu item has the 'aria-checked' attribute set to 'true'
        python_menu_item_row = lang_menu_popup.locator('.menu-item:has-text("Python")')
        expect(python_menu_item_row).to_have_attribute('aria-checked', 'true')

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)