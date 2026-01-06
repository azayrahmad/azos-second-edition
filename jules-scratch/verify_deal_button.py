
import time
from playwright.sync_api import sync_playwright, expect

def run_verification(page):
    # Wait for the server to start
    time.sleep(20)

    print("Navigating to page...")
    page.goto("http://localhost:5173/azos-second-edition/")
    print("Page loaded.")

    # Close the "Tip of the Day" window if it appears
    tip_of_the_day = page.locator("#tipOfTheDay")
    if tip_of_the_day.is_visible():
        print("Closing 'Tip of the Day' window.")
        tip_of_the_day.locator(".window-close-button").click()

    # Launch Spider Solitaire
    print("Launching Spider Solitaire...")
    page.dblclick(".desktop-icon[data-app-id='spidersolitairenew']")
    print("Spider Solitaire launched.")

    # Wait for the window to appear
    solitaire_window = page.locator("#spidersolitairenew")
    expect(solitaire_window).to_be_visible()
    print("Spider Solitaire window is visible.")

    # --- Verification for Enabled State ---
    print("Checking enabled state...")

    # Locate the "Game" menu
    game_menu_button = solitaire_window.locator(".menu-button:has-text('Game')")

    # Click on the "Game" menu to open it
    game_menu_button.click()
    time.sleep(1)

    # Take a screenshot of the initial enabled state
    solitaire_window.screenshot(path="jules-scratch/deal-button-enabled.png")
    print("Enabled state screenshot taken.")

    # --- Verification for Disabled State ---
    print("Checking disabled state...")

    # Locate the "Deal!" button
    deal_button = solitaire_window.locator(".menu-button:has-text('Deal!')")

    # Click the "Deal!" button 5 times to empty the stockpile
    for i in range(5):
        print(f"Clicking 'Deal!' button, iteration {i+1}")
        deal_button.click()

    time.sleep(1) # Wait for UI to update

    # Click on the "Game" menu to open it
    game_menu_button.click()
    time.sleep(1)

    # Take a screenshot of the final disabled state
    solitaire_window.screenshot(path="jules-scratch/deal-button-disabled.png")
    print("Disabled state screenshot taken.")


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run_verification(page)
        finally:
            browser.close()
