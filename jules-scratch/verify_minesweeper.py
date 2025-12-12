
from playwright.sync_api import sync_playwright, expect
import time

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            page.goto("http://localhost:5174/azos-second-edition/")

            # Wait for the desktop to be ready
            expect(page.locator(".desktop-icon[data-app-id='minesweeper']")).to_be_visible(timeout=30000)

            # Launch Minesweeper
            page.dblclick(".desktop-icon[data-app-id='minesweeper']")

            # Wait for the app to launch
            minesweeper_window = page.locator(".os-window[id='minesweeper']")
            expect(minesweeper_window).to_be_visible(timeout=15000)

            # Give it a moment to render fully
            time.sleep(1)

            # Take final screenshot for verification
            page.screenshot(path="jules-scratch/verification.png")

            print("Verification script finished successfully.")

        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="jules-scratch/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    main()
