from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    base_url = "http://localhost:5174/azos-second-edition/"

    try:
        # 1. Navigate to the application
        page.goto(base_url)
        page.wait_for_load_state('networkidle')

        desktop = page.locator('.desktop')

        # --- Test Blue Theme ---
        # 2. Open context menu and select "Blue" theme
        desktop.click(button='right', position={'x': 200, 'y': 200})
        theme_menu_item = page.locator('.menu-item', has_text='Theme')
        expect(theme_menu_item).to_be_visible()
        theme_menu_item.hover()
        expect(page.locator('.menu-popup')).to_have_count(2, timeout=2000)
        submenu = page.locator('.menu-popup', has_text="Blue")
        blue_option = submenu.locator('.menu-item', has_text="Blue")
        expect(blue_option).to_be_visible()
        blue_option.click()

        # 3. Take screenshot of Blue theme
        page.wait_for_timeout(500) # Wait for theme to apply
        page.screenshot(path="jules-scratch/verification/01_blue_theme_applied.png")
        # Click outside to close the menu
        desktop.click(position={'x': 0, 'y': 0})
        expect(page.locator('.menu-popup')).to_have_count(0)


        # --- Test Peggy's Pastels Theme ---
        # 4. Open context menu and select "Peggy's Pastels"
        desktop.click(button='right', position={'x': 200, 'y': 200})
        theme_menu_item = page.locator('.menu-item', has_text='Theme')
        theme_menu_item.hover()
        expect(page.locator('.menu-popup')).to_have_count(2, timeout=2000)
        submenu = page.locator('.menu-popup', has_text="Peggy's Pastels")
        pastels_option = submenu.locator('.menu-item', has_text="Peggy's Pastels")
        expect(pastels_option).to_be_visible()
        pastels_option.click()

        # 5. Take screenshot of Peggy's Pastels theme
        page.wait_for_timeout(500) # Wait for theme to apply
        page.screenshot(path="jules-scratch/verification/02_pastels_theme_applied.png")
        # Click outside to close the menu
        desktop.click(position={'x': 0, 'y': 0})
        expect(page.locator('.menu-popup')).to_have_count(0)

        # --- Verify Checkmark Logic ---
        # 6. Re-open menu to check state
        desktop.click(button='right', position={'x': 200, 'y': 200})
        theme_menu_item = page.locator('.menu-item', has_text='Theme')
        theme_menu_item.hover()

        # 7. Expect "Peggy's Pastels" to be checked
        expect(page.locator('.menu-popup')).to_have_count(2, timeout=2000)
        submenu = page.locator('.menu-popup', has_text="Peggy's Pastels")
        pastels_option_checked = submenu.locator('.menu-item', has_text="Peggy's Pastels")
        expect(pastels_option_checked).to_have_attribute('aria-checked', 'true')

        # 8. Expect "Blue" and "Default" to not be checked
        blue_option_unchecked = submenu.locator('.menu-item', has_text="Blue")
        expect(blue_option_unchecked).to_have_attribute('aria-checked', 'false')
        default_option_unchecked = submenu.locator('.menu-item', has_text="Default")
        expect(default_option_unchecked).to_have_attribute('aria-checked', 'false')

        # 9. Take final screenshot
        page.screenshot(path="jules-scratch/verification/03_checkmark_verification.png")

        # 10. Revert to default theme for a clean state
        default_option_unchecked.click()
        page.wait_for_timeout(500)
        page.screenshot(path="jules-scratch/verification/04_default_theme_restored.png")


        print("Verification script completed successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as p:
    run(p)