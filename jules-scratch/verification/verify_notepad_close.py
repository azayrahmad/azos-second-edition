from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:5174/azos-second-edition/", timeout=60000)

        # Wait for the desktop to be ready
        expect(page.locator(".desktop-icon").first).to_be_visible(timeout=30000)

        # Double-click the Notepad icon to launch it
        notepad_icon = page.locator(".desktop-icon", has_text="Notepad")
        notepad_icon.dblclick()

        # Wait for the Notepad window to appear
        notepad_window = page.locator(".window.os-window:has-text('Untitled - Notepad')")
        expect(notepad_window).to_be_visible(timeout=10000)

        # Type text to make the document dirty
        textarea = notepad_window.locator("textarea.codeInput")
        textarea.type("Some unsaved text.")
        expect(notepad_window.locator(".window-title")).to_contain_text("*Untitled - Notepad")

        # Click the close button
        close_button = notepad_window.locator(".window-close-button")
        close_button.click()

        # Wait for the dialog and click "No"
        dialog = page.locator(".window.os-window:has(.dialog-content)")
        no_button = dialog.get_by_role("button", name="No")
        expect(no_button).to_be_visible()
        no_button.click(force=True)

        # Assert that the Notepad window is now closed
        expect(notepad_window).not_to_be_visible()

        # Take a screenshot of the desktop to confirm the window is gone
        page.screenshot(path="jules-scratch/verification/verification.png")

        print("Verification script ran successfully and confirmed window closure.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)