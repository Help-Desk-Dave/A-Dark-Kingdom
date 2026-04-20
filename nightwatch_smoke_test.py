import time
import re
import subprocess
from playwright.sync_api import sync_playwright

def run_test():
    # Start the Vite development server in the background
    server_process = subprocess.Popen(
        ["pnpm", "dev", "--host", "0.0.0.0", "--port", "3000"],
        cwd="frontend",
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        env={"__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS": ".com", "PATH": subprocess.os.environ["PATH"]}
    )

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()

            print("Navigating to app...")
            page.goto("http://localhost:3000")
            time.sleep(2)

            # Bypass Hero Selection directly to Stage 0
            print("Setting up localStorage state for Stage 0...")
            page.evaluate("""
                localStorage.clear();
                localStorage.setItem('adk_ruler', JSON.stringify({name: 'NightwatchTester', failMod: 0}));
                localStorage.setItem('adk_stage', '0');
                localStorage.setItem('adk_sticks', '0');
            """)
            page.goto("http://localhost:3000")
            time.sleep(2)

            print("--- STAGE 0: The Wilderness ---")
            gather_sticks_btn = page.locator("button", has_text="Gather Sticks")
            if not gather_sticks_btn.is_visible():
                print("[!] ERROR: 'Gather Sticks' button not found.")
                return

            print("Clicking 'Gather Sticks' to unlock 'Build Fire'...")
            clicks = 0
            while True:
                if not gather_sticks_btn.is_visible(): break
                start_time = time.time()
                gather_sticks_btn.click()
                # Wait for the button to re-enable (progress bar completes)
                page.wait_for_function('Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Gather Sticks")) ? !Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Gather Sticks")).disabled : true', timeout=15000)
                end_time = time.time()
                clicks += 1
                print(f"  Gather {clicks} took {end_time - start_time:.2f} seconds.")

            build_fire_btn = page.get_by_role('button', name='Build Fire')
            if build_fire_btn.is_visible():
                print("[+] 'Build Fire' button appeared successfully.")
                build_fire_btn.click()
                time.sleep(1)
            else:
                print("[!] ERROR: 'Build Fire' button did not appear.")
                print('Current DOM:', page.content()[-1000:])
                return

            print("--- STAGE 1: Survival ---")
            # We should now see Gather Timber, Hunt Rations, Gather Stone
            timber_btn = page.locator("button", has_text="Gather Timber")
            rations_btn = page.locator("button", has_text="Hunt Rations")
            stone_btn = page.locator("button", has_text="Gather Stone")

            if timber_btn.is_visible() and rations_btn.is_visible() and stone_btn.is_visible():
                print("[+] All gathering buttons for Stage 1 are visible.")
            else:
                print("[!] ERROR: Missing Stage 1 gathering buttons.")
                return

            # Test Heavy Rep for Timber
            print("Gathering Timber to test 'Heavy Rep' metric...")
            start_time = time.time()
            timber_btn.click()
            page.wait_for_function('Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Gather Timber")) ? !Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Gather Timber")).disabled : true', timeout=15000)
            end_time = time.time()
            print(f"  One 'Gather Timber' action took {end_time - start_time:.2f} seconds.")

            print("Simulating gathering up to threshold (5 Timber, 5 Rations)...")
            page.evaluate("""
                localStorage.setItem('adk_timber', '5');
                localStorage.setItem('adk_rations', '5');
            """)
            page.goto("http://localhost:3000")
            time.sleep(2)

            establish_camp_btn = page.locator("button", has_text="Establish Camp")
            if establish_camp_btn.is_visible():
                print("[+] 'Establish Camp' button appeared successfully.")
                establish_camp_btn.click()
                time.sleep(1)
            else:
                print("[!] ERROR: 'Establish Camp' button did not appear.")
                return

            print("--- STAGE 2: The First Companions ---")
            # We are in Stage 2 now.
            print("Verifying Ruler's Actions menu existence...")
            rulers_actions_btn = page.locator("button", has_text="Ruler's Actions")
            if rulers_actions_btn.is_visible():
                print("[+] Ruler's Actions menu is accessible.")
            else:
                print("[!] ERROR: Ruler's Actions menu not found in Stage 2.")

            print("\nSmoke test complete.")
            browser.close()
    finally:
        server_process.terminate()

if __name__ == "__main__":
    run_test()
