import re
from playwright.sync_api import Page, expect, sync_playwright

def test_profile_system(page: Page):
    page.goto("http://localhost:5173/azos-second-edition/resume")

    # Wait for a known desktop icon to appear, indicating the desktop is ready
    expect(page.locator('.desktop-icon[data-app-id="my-computer"]')).to_be_visible(timeout=60000)

    # Wait for the PDF viewer to appear and verify its title
    pdf_viewer_window = page.locator('[id="pdfviewer-files/Resume.pdf"]')
    expect(pdf_viewer_window).to_be_visible(timeout=30000)
    expect(pdf_viewer_window.locator(".window-title")).to_have_text("Resume.pdf - PDF Viewer")

    # Wait for Clippy to appear using the new test ID
    clippy_agent = page.locator('[data-testid="clippy-agent"]')
    expect(clippy_agent).to_be_visible(timeout=30000)

    # Take a screenshot for verification
    page.screenshot(path="/home/jules/verification/profile_system.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_profile_system(page)
        finally:
            browser.close()
