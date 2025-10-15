import time
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    console_logs = []
    page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

    try:
        page.goto("http://localhost:5173/", timeout=60000)

        # Open Clippy
        clippy_icon = page.locator('div[data-app-id="clippy"]')
        clippy_icon.click()

        # Wait for the agent to appear
        page.wait_for_selector(".clippy", timeout=15000)
        clippy_agent = page.locator(".clippy")

        # Right-click on Clippy to open the context menu
        clippy_agent.click(button="right")

        # Wait for the context menu to appear
        page.wait_for_selector(".menu-popup", timeout=5000)

        # Hover over the "Agent" menu item to reveal the submenu
        agent_menu_item = page.get_by_text("Agent")
        agent_menu_item.hover()

        # Wait for the submenu to appear
        time.sleep(0.5)
        page.wait_for_selector(".menu-popup .menu-popup", timeout=5000)
        page.screenshot(path="jules-scratch/verification/clippy_context_menu_with_submenu.png")

        # Switch to Genius
        genius_menu_item = page.get_by_text("Genius")
        genius_menu_item.click()

        # Wait for the new agent to appear and take a screenshot
        page.wait_for_selector(".clippy", timeout=15000)
        page.screenshot(path="jules-scratch/verification/genius_agent.png")

    except Exception as e:
        print(f"An error occurred during Playwright execution: {e}")
    finally:
        browser.close()
        print("\n--- Console Logs ---")
        for log in console_logs:
            print(log)
        print("--------------------\n")

with sync_playwright() as playwright:
    run(playwright)