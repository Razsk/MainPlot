import os
from playwright.sync_api import sync_playwright

def run_tests():
    port = os.environ.get("PORT", "8000")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            # 1. Navigate to the app and wait for it to load
            page.goto(f"http://localhost:{port}")
            page.locator("#projectTitle").wait_for(timeout=10000)

            print("App loaded successfully.")

            # 2. Verify all required IDs are present
            required_ids = [
                'left', 'right', 'tree', 'addFolder', 'addScene', 'backup', 'restore',
                'restoreFile', 'title', 'scene', 'preview', 'notes', 'style', 'tone',
                'creativity', 'outline', 'outlineEnabled', 'copyPrompt', 'toggleLeft',
                'toggleRight', 'helpBtn', 'helpModal', 'helpClose', 'backupStatus',
                'backupManual', 'optionsStrip'
            ]

            missing_ids = []
            for element_id in required_ids:
                if page.locator(f"#{element_id}").count() == 0:
                    missing_ids.append(element_id)

            if missing_ids:
                print(f"FAIL: Missing required elements: {missing_ids}")
                exit(1)
            else:
                print("PASS: All required UI elements found.")

            # 3. Verify buildPrompt functionality
            # Click the 'Continue' button which triggers buildPrompt('continue')
            # and populates #preview
            continue_btn = page.locator("button[data-action='continue']")
            if continue_btn.count() == 0:
                print("FAIL: Continue button not found")
                exit(1)

            continue_btn.click()

            # Wait for preview to be populated
            preview_area = page.locator("#preview")
            preview_area.wait_for()

            # Check content
            content = preview_area.input_value()
            if "TASK: Continue" in content:
                print("PASS: Prompt generation works (preview populated correctly).")
            else:
                print(f"FAIL: Preview content unexpected. Got: {content[:100]}...")
                exit(1)

        except Exception as e:
            print(f"ERROR: Test execution failed: {e}")
            exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    run_tests()
