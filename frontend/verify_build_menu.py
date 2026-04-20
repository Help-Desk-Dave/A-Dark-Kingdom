from playwright.sync_api import sync_playwright
import time
import os
import json

os.makedirs('/home/jules/verification', exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    page.goto('http://localhost:3000')
    time.sleep(2)

    hero_card = page.locator('.border-gray-700.cursor-pointer').first
    if hero_card.count() > 0 and hero_card.is_visible():
        hero_card.click()
        time.sleep(1)

    world_state = []
    for y in range(10):
        row = []
        for x in range(10):
            cell = {"id": f"{x}-{y}", "status": 0, "terrain": "plains", "explored": False, "poi": None}
            if x == 5 and y == 5:
                cell["status"] = 2
                cell["explored"] = True
                cell["settlement"] = {
                    "name": "Settlement",
                    "grid": [[None]*5 for _ in range(5)],
                    "buildings": []
                }
            row.append(cell)
        world_state.append(row)

    world_json = json.dumps(world_state)

    page.evaluate(f'''() => {{
        localStorage.setItem("adk_stage", "2");
        localStorage.setItem("adk_timber", "1000");
        localStorage.setItem("adk_rations", "1000");
        localStorage.setItem("adk_stone", "1000");
        localStorage.setItem("adk_bp", "100");
        localStorage.setItem("adk_world", `{world_json}`);
    }}''')
    page.reload()
    time.sleep(2)

    return_to_camp = page.locator('text="Return to Camp"')
    if return_to_camp.count() > 0 and return_to_camp.is_visible():
        return_to_camp.click()
        time.sleep(1)

    # Click exactly the middle cell by coordinates relative to the viewport or by text
    # The cell is a div with class "w-10 h-10 bg-gray-900 border border-gray-700..."
    # Inside it is `[ ]`
    page.locator('text="[ ]"').first.click()
    time.sleep(1)
    page.screenshot(path='/home/jules/verification/build_menu_overlay.png', full_page=True)

    category_btn = page.locator('button:has-text("Residential")').first
    if category_btn.count() > 0:
        category_btn.click()
        time.sleep(1)
        page.screenshot(path='/home/jules/verification/build_menu_items_new.png', full_page=True)
        print("Screenshot of build menu items captured.")

        back_btn = page.locator('button:has-text("Back to Categories")').first
        if back_btn.count() > 0:
            back_btn.click()
            time.sleep(1)

            yard_btn = page.locator('button:has-text("Yard")').first
            if yard_btn.count() > 0:
                yard_btn.click()
                time.sleep(1)
                page.screenshot(path='/home/jules/verification/build_menu_yard.png', full_page=True)
                print("Screenshot of yard menu items captured.")
    else:
        print("Could not find Residential button.")

    browser.close()
