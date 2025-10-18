from playwright.sync_api import sync_playwright, expect
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    for i in range(3):
        try:
            page.goto("http://localhost:5173/")
            break
        except Exception as e:
            print(f"Attempt {i+1} failed, retrying in 5 seconds...")
            time.sleep(5)
    else:
        raise Exception("Failed to connect to the server after multiple attempts.")


    # Wait for the page to be ready
    expect(page.locator('body')).to_be_visible()

    # Locate the "My Computer" icon
    my_computer_icon = page.locator('div[data-app-id="explorer"]')

    # Get the initial bounding box of the icon
    initial_box = my_computer_icon.bounding_box()

    # Perform the drag and drop
    my_computer_icon.drag_to(my_computer_icon, target_position={'x': initial_box['x'] + 100, 'y': initial_box['y'] + 100})

    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)