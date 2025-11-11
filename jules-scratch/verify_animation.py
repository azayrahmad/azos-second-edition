
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Enable console logging
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

        try:
            # Go to the dev server URL
            await page.goto("http://localhost:5173/azos-second-edition/", timeout=90000)

            # Wait for the desktop to be ready
            await page.wait_for_selector('.desktop', timeout=60000)

            # Wait for the System object to be initialized before we try to use it
            await page.wait_for_function('window.System && window.System.launchApp', timeout=60000)

            # Launch Explorer
            await page.evaluate('window.System.launchApp("explorer")')

            # Wait for the window to appear and take a screenshot
            await page.wait_for_selector('.os-window[data-app-id="explorer"] .animated-logo-container', timeout=60000)
            await asyncio.sleep(2) # Wait for animation to loop once
            await page.screenshot(path="/home/jules/verification/explorer_animation_final.png")

            # Launch Internet Explorer
            await page.evaluate('window.System.launchApp("internet-explorer")')

            # Wait for the window to appear and take a screenshot
            await page.wait_for_selector('.os-window[data-app-id="internet-explorer"] .animated-logo-container', timeout=60000)
            await asyncio.sleep(2) # Wait for animation to loop once
            await page.screenshot(path="/home/jules/verification/ie_animation_final.png")

            print("Screenshots taken successfully.")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
