from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:5173/azos-second-edition/")

        # Wait for the first desktop icon to be visible
        expect(page.locator(".desktop-icon").first).to_be_visible()

        # Double click the "Resume.pdf" icon
        resume_icon = page.locator('div.desktop-icon[title="Resume.pdf"]')
        expect(resume_icon).to_be_visible()
        resume_icon.dblclick()

        # Wait for the PDF viewer content to appear
        pdf_viewer_content = page.locator('.pdf-viewer-content')
        expect(pdf_viewer_content).to_be_visible()

        # Take a screenshot of the desktop with the PDF viewer open
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)