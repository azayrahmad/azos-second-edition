import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Listen for and print browser console messages for debugging
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))

        # Ensure the output directory exists
        os.makedirs("jules-scratch", exist_ok=True)

        try:
            # 1. Initial Load
            print("Navigating to page...")
            await page.goto("http://localhost:8000/plus-screensavers/index.html")

            print("Waiting for selector...")
            await page.wait_for_selector('.monitor-preview-content')

            print("Selector found. Taking screenshot.")
            await page.screenshot(path="jules-scratch/01_initial_load.png")
            print("Step 1/4: Initial load screenshot captured.")

            # 2. Select "Space" from the dropdown
            await page.select_option('select#screensaver-select', 'space')
            await asyncio.sleep(1)
            await page.screenshot(path="jules-scratch/02_space_selected.png")
            print("Step 2/4: 'Space' screensaver selected and screenshot captured.")

            # 3. Click "Preview" to enter fullscreen
            await page.click('button#preview-button')
            await page.wait_for_selector('#fullscreen-preview', state='visible')
            await asyncio.sleep(1)
            await page.screenshot(path="jules-scratch/03_fullscreen_preview.png")
            print("Step 3/4: Fullscreen preview entered and screenshot captured.")

            # 4. Click the fullscreen OVERLAY to exit, not the iframe
            await page.click('#fullscreen-overlay')
            await page.wait_for_selector('#fullscreen-preview', state='detached')
            await page.screenshot(path="jules-scratch/04_exit_fullscreen.png")
            print("Step 4/4: Exited fullscreen and screenshot captured.")

        except Exception as e:
            print(f"An error occurred: {e}")
            # On failure, save the page content to a file for inspection
            content = await page.content()
            with open("jules-scratch/error_page.html", "w", encoding="utf-8") as f:
                f.write(content)
            print("Saved failing page content to jules-scratch/error_page.html")

        finally:
            await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
