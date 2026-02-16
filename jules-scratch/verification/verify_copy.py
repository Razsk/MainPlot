from playwright.sync_api import sync_playwright

def verify_copy(page):
    print("Navigating to app...")
    page.goto("http://localhost:8000")

    print("Waiting for app to load...")
    page.wait_for_selector("#copyPrompt")

    # Set text in preview
    print("Setting text in preview...")
    page.evaluate("document.getElementById('preview').value = 'Hello world to copy'")

    print("Clicking Copy Prompt button...")
    page.click("#copyPrompt")

    # Wait for status update
    page.wait_for_timeout(1000)

    # Take screenshot
    print("Taking screenshot...")
    page.screenshot(path="jules-scratch/verification/copy_verification.png")

    # Check if status message appeared
    status = page.text_content("#copyStatus")
    print(f"Status message: {status}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    # Grant clipboard permissions if possible, though localhost usually allows it.
    context = browser.new_context(permissions=['clipboard-read', 'clipboard-write'])
    page = context.new_page()
    try:
        verify_copy(page)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()
