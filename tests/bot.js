const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// --- BOT CONFIGURATION ---
// Assuming the Vite dev server is running locally on port 5173
const TARGET_URL = 'http://localhost:5173';
const MAX_TICKS = 500; // How many actions the bot will attempt before stopping
const DATA_FILE = path.join(__dirname, 'bot_telemetry.json');

// The bot's "brain" - mapping available actions by stage
const ACTION_PRIORITIES = {
    0: [
        { selector: 'button:has-text("Gather Sticks")', weight: 1.0 }
        ,
        { selector: 'button:has-text("Build Fire")', weight: 1.0 }
    ],
    1: [
        { selector: 'button:has-text("Hunt Rations")', weight: 0.6 },
        { selector: 'button:has-text("Gather Timber")', weight: 1.0 },
        { selector: 'button:has-text("Establish Camp")', weight: 1.0 }
    ]
};

async function runBot() {
    console.log(`[BOT] Initiating Playtest Run. Target: ${MAX_TICKS} ticks.`);
    
    // Launch browser (set headless: false to actually watch it play)
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    let telemetry = {
        runDate: new Date().toISOString(),
        ticksCompleted: 0,
        resources: { timber: 0, rations: 0, sticks: 0 },
        stageReached: 0,
        failures: 0
    };

    try {
        await page.goto(TARGET_URL);
        // Explicitly set a mock ruler in localStorage to bypass the Hero Selection overlay
        await page.evaluate("localStorage.setItem('adk_ruler', JSON.stringify({name: 'Test'}));");
        await page.goto(TARGET_URL);
        
        // Wait for the game to load (looking for the title or initial log)
        await page.waitForTimeout(1000);
        console.log("[BOT] Game Loaded. Starting action loop...");

        for (let tick = 0; tick < MAX_TICKS; tick++) {
            telemetry.ticksCompleted = tick;
            
            // 1. Read Current State
            // (We scrape the DOM to find the current stage and resources)
            const stageText = await page.evaluate(() => {
                // This is a naive scrape; we should add data-testid attributes to App.jsx later for robustness
                const logDiv = document.querySelector('.overflow-y-auto');
                return logDiv ? logDiv.innerText : "";
            });
            
            let currentStage = 0;
            if (stageText.includes("A small comfort in the dark")) currentStage = 1;

            if (stageText.includes("Camp established at (5,5)")) currentStage = 2;
            telemetry.stageReached = Math.max(telemetry.stageReached, currentStage);

            // 2. Decide Action
            const availableActions = ACTION_PRIORITIES[currentStage] || [];
            if (availableActions.length === 0) {
                console.log(`[BOT] No actions mapped for Stage ${currentStage}. Idling.`);
                await page.waitForTimeout(1000); // Wait 1 second and try again
                continue;
            }

            // Simple RNG to pick an action based on weight
            let actionTaken = false;

            // Randomize action order to prevent getting stuck on the first one
            const shuffledActions = [...availableActions].sort(() => Math.random() - 0.5);

            for (const action of shuffledActions) {
                const button = await page.$(action.selector);
                if (button) {
                    const isDisabled = await button.evaluate(b => b.disabled);
                    if (!isDisabled) {
                        await button.click();
                        console.log(`[BOT] Tick ${tick}: Clicked '${action.selector}'`);
                        actionTaken = true;
                        
                        // Wait for the progress bar to finish (simulated effort)
                        // Assuming tasks take 1-3 seconds
                        await page.waitForTimeout(1500); 
                        break;
                    }
                }
            }

            if (!actionTaken) {
                // If the bot couldn't click anything (e.g., activeTask is running, or starving)
                telemetry.failures++;
                await page.waitForTimeout(500); // Small wait before polling again
            }

            // Scrape resources occasionally to update telemetry
            if (tick % 10 === 0) {
                 const resources = await page.evaluate(() => {
                     // Hacky scraping - will be much easier when we add data-testids
                     const text = document.body.innerText;
                     const tMatch = text.match(/Gather Timber \((\d+)\)/);
                     const rMatch = text.match(/Hunt Rations \((\d+)\)/);
                     const sMatch = text.match(/Gather Sticks \((\d+)\/10\)/);
                     return {
                         timber: tMatch ? parseInt(tMatch[1]) : 0,
                         rations: rMatch ? parseInt(rMatch[1]) : 0,
                         sticks: sMatch ? parseInt(sMatch[1]) : 0
                     };
                 });
                 telemetry.resources = resources;
                 console.log(`[BOT] Stats Update: Sticks=${resources.sticks}, Timber=${resources.timber}, Rations=${resources.rations}`);
            }
        }

    } catch (err) {
        console.error("[BOT] Fatal Error during playtest:", err);
    } finally {
        // Save Telemetry
        let history = [];
        if (fs.existsSync(DATA_FILE)) {
            history = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }
        history.push(telemetry);
        fs.writeFileSync(DATA_FILE, JSON.stringify(history, null, 2));
        
        console.log(`[BOT] Run Complete. Data saved to ${DATA_FILE}. Stage Reached: ${telemetry.stageReached}`);
        await browser.close();
    }
}

runBot();
