from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    Verifies the UI improvements: theme switcher, SVG icons, and delete confirmation.
    """
    # 1. Navigate to the app and wait for it to load
    page.goto("http://localhost:8000")

    # Wait for a key element to be visible, indicating the app has loaded.
    expect(page.locator("#projectTitle")).to_be_visible(timeout=10000)

    # 2. Verify default dark theme and SVG icons
    page.screenshot(path="jules-scratch/verification/01_dark_theme_with_icons.png")

    # 3. Click the theme toggle and verify light theme
    theme_toggle_button = page.locator("#themeToggle")
    expect(theme_toggle_button).to_have_text("☀️")
    theme_toggle_button.click()

    # Wait for the class to be applied to the body
    expect(page.locator("body")).to_have_class("light-theme")
    expect(theme_toggle_button).to_have_text("🌙")

    page.screenshot(path="jules-scratch/verification/02_light_theme.png")

    # 4. Verify the delete confirmation modal
    # Find the first delete button in the tree and click it
    delete_button = page.locator(".node .ops button[data-op='delete']").first
    delete_button.click()

    # Wait for the confirmation modal to appear
    confirm_modal = page.locator("#confirmModal")
    expect(confirm_modal).to_be_visible()

    # Check for the correct title and message
    expect(confirm_modal.locator("#confirmTitle")).to_have_text("Delete folder")
    expect(confirm_modal.locator("#confirmMessage")).to_contain_text("Are you sure you want to delete")

    page.screenshot(path="jules-scratch/verification/03_delete_confirmation.png")

    # Close the modal
    confirm_modal.locator("#confirmCancel").click()
    expect(confirm_modal).not_to_be_visible()
    print("Verification script completed successfully.")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()
