
import asyncio
from playwright.async_api import async_playwright
import random
import string

def random_string(length=8):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

APP_TITLE = f"TestApp_{random_string()}"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("http://localhost:5173/azos-second-edition/")

        try:
            tip_of_the_day = await page.wait_for_selector('#tipOfTheDay', timeout=5000)
            if tip_of_the_day:
                await page.click('#tipOfTheDay .window-close-button')
        except:
            print("Tip of the Day window not found, continuing.")

        # 1. Launch AppMaker
        await page.dblclick('.desktop-icon[data-app-id="appmaker"]')
        await page.wait_for_selector('#app-title') # Wait for the content to be ready

        # 2. Create a new custom app
        await page.fill('#app-title', APP_TITLE)
        await page.fill('#app-html', '<p>Hello World</p>')
        await page.click('text=Create App')

        # 3. Verify the new app icon appears
        await page.wait_for_selector(f'.desktop-icon[title="{APP_TITLE}"]')

        # 4. Sort Icons
        await page.click('.desktop', button='right')
        await page.click('text=Sort Icons')

        # 5. Drag the new icon
        icon_selector = f'.desktop-icon[title="{APP_TITLE}"]'
        icon = await page.query_selector(icon_selector)
        box = await icon.bounding_box()

        await page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
        await page.mouse.down()
        await page.mouse.move(box['x'] + box['width'] / 2 + 100, box['y'] + box['height'] / 2 + 100)
        await page.mouse.up()

        # 6. Screenshot after drag
        await page.screenshot(path="jules-scratch/verification/dragged_icon.png")

        # 7. Delete the custom app
        await page.click(icon_selector, button='right')
        await page.click('text=Delete')
        await page.click('text=Yes')

        # 8. Final screenshot
        await page.screenshot(path="jules-scratch/verification/deleted_icon.png")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
