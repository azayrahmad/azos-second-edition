
import asyncio
from playwright.async_api import async_playwright, TimeoutError
import time

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Give the dev server time to start up
        await asyncio.sleep(10)

        try:
            await page.goto("http://localhost:5173/azos-second-edition/", timeout=60000)
        except TimeoutError:
            print("Initial page load timed out. Retrying...")
            await asyncio.sleep(5)
            await page.goto("http://localhost:5173/azos-second-edition/", timeout=60000)


        # Close the "Tip of the Day" window if it appears
        try:
            tip_window = page.locator('#tipOfTheDay')
            await tip_window.wait_for(state="visible", timeout=10000)
            close_button = tip_window.locator('button[aria-label="Close"]')
            await close_button.click(force=True, timeout=5000)
            await tip_window.wait_for(state="hidden", timeout=5000)
        except TimeoutError:
            pass # Tip of the day window did not appear or could not be closed in time.

        # Open the desktop context menu
        await page.locator('.desktop').click(button='right')

        # Hover over "Arrange Icons" to reveal the submenu
        await page.locator('text=Arrange Icons').hover()

        # Wait for the submenu item to be visible before clicking
        await page.locator('.menu-popup .menu-item:has-text("Name")').wait_for(state="visible", timeout=2000)

        # Click the "Name" radio button
        await page.locator('.menu-popup .menu-item:has-text("Name")').click()

        # Wait for the menu to disappear to confirm the fix
        await page.locator('body > .os-gui.menu-list').wait_for(state="hidden", timeout=2000)

        await page.screenshot(path="jules-scratch/verification/verification.png")
        await browser.close()

asyncio.run(main())
