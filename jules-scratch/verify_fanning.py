
import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # Navigate to the game
            await page.goto("http://localhost:5173/azos-second-edition/", wait_until="networkidle")

            # Wait for the boot screen to finish
            await page.wait_for_selector("#boot-screen", state="hidden", timeout=120000)

            # Launch Klondike (Solitaire)
            solitaire_icon = page.locator(".desktop-icon[data-app-id='solitaire']")
            await solitaire_icon.wait_for(state="visible", timeout=120000)
            await solitaire_icon.dblclick()

            # Wait for the game window and stock pile to be ready
            game_window = page.locator(".window.os-window[id='solitaire']")
            await game_window.wait_for(state="visible", timeout=10000)
            stock_pile = game_window.locator(".stock-pile")
            await stock_pile.wait_for(state="visible", timeout=10000)

            # Deal enough cards to create a fanned waste pile
            for _ in range(9): # This will result in 8 cards in waste, 1 in drawn
                await stock_pile.click()
                await page.wait_for_timeout(100)

            # Take a screenshot for visual verification
            await page.screenshot(path="jules-scratch/klondike_fanning_verification.png")
            print("Screenshot taken for fanning verification.")

        except Exception as e:
            print(f"An error occurred during verification: {e}")
            await page.screenshot(path="jules-scratch/klondike_fanning_verification_error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
