
import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("http://localhost:5173/win98-web/")

        # Wait for the system to be ready
        await page.wait_for_function("window.System && window.System.launchApp")

        # Launch FreeCell
        await page.evaluate("window.System.launchApp('freecell')")

        # Wait for the FreeCell window to appear
        freecell_window = page.locator(".window[data-app-id='freecell']")
        await expect(freecell_window).to_be_visible()

        # Hover over the free cells
        free_cells_area = freecell_window.locator(".free-cells")
        await free_cells_area.hover()
        await page.wait_for_timeout(200) # wait for image to potentially change

        # Hover over the foundations
        foundations_area = freecell_window.locator(".foundations")
        await foundations_area.hover()
        await page.wait_for_timeout(200) # wait for image to potentially change

        # Take a screenshot
        await page.screenshot(path="verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
