
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:8000/")

        # Wait for the desktop to be ready
        await page.wait_for_selector(".desktop")

        # Launch Webamp
        await page.dblclick('div.desktop-icon[title="Winamp"]')

        # Launch Notepad
        await page.dblclick('div.desktop-icon[title="Notepad"]')

        # Wait for both windows to be visible
        await page.wait_for_selector("#webamp")
        await page.wait_for_selector(".window:has-text('Untitled - Notepad')")

        # Bring Webamp to front
        await page.click("#webamp-container")

        # Take a screenshot to verify
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

asyncio.run(main())
