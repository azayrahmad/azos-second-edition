
import time
from playwright.sync_api import sync_playwright

def verify_restart_game(page):
    # Wait for the dev server to start
    time.sleep(30)

    # Navigate to the app
    page.goto("http://localhost:5173/win98-web/")

    # Launch Spider Solitaire
    page.dblclick(".desktop-icon[data-app-id='spidersolitairenew']")

    # Wait for the game window to appear
    game_window = page.locator("#spidersolitairenew")
    game_window.wait_for(state="visible")

    # Make a move to change the game state
    # This is a bit tricky without knowing the game logic, so I'll just click on a card
    # and then on another pile to simulate a move.
    page.click(".card.face-up", timeout=60000)
    page.click(".tableau-pile", timeout=60000)

    # Click on the "Game" menu
    page.click("text=Game", timeout=60000)

    # Click on the "Restart this game" menu item
    page.click("text=Restart this game", timeout=60000)

    # Take a screenshot to verify the game has restarted
    page.screenshot(path="jules-scratch/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_restart_game(page)
        finally:
            browser.close()
