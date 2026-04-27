// tests/muse_lore.js
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const DATA_FILE = path.join(__dirname, 'bot_telemetry.json');
const NARRATIVE_FILE = path.join(__dirname, '../frontend/src/narrative.js');

async function generateFlavorText() {
    console.log("[THE MUSE] Consulting the ether...");
    
    // 1. Read what happened in the last bot run
    let lastRun = "The founder just arrived in the swamp.";
    if (fs.existsSync(DATA_FILE)) {
        const rawData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        const run = rawData[rawData.length - 1];
        if (run.deathSpiralDetected) {
            lastRun = "The founder starved to death surrounded by unrefined timber.";
        } else if (run.stageReached >= 2) {
            lastRun = "The founder successfully built a settlement and survived the early days.";
        }
    }

    // 2. Prompt Gemini to write new flavor text
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
    You are The Muse 🌀, the creative director for a dark, gritty text-based kingdom simulator.
    In the latest simulation, this happened: "${lastRun}"
    
    Write 3 new, highly atmospheric, single-sentence flavor text logs that reflect this outcome. 
    Make them gritty, mysterious, and fitting for a dark swamp environment.
    Return ONLY a valid JSON array of strings. Do not use markdown blocks.
    Example: ["The mud here smells of old blood.", "A crow watches you from the dead cypress."]
    `;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const newLore = JSON.parse(text);

        console.log("[THE MUSE] New Lore Generated:", newLore);

        // 3. Append the new lore to a ledger for review (or inject directly)
        const ledgerPath = path.join(__dirname, '../docs/VIBE_LEDGER.md');
        const ledgerUpdate = `\n### 🌀 Muse Injection (${new Date().toLocaleDateString()})\n* ${newLore.join('\n* ')}\n`;
        fs.appendFileSync(ledgerPath, ledgerUpdate);
        
        console.log("[THE MUSE] Lore appended to VIBE_LEDGER.md");

    } catch (err) {
        console.error("[!] The Muse is silent:", err.message);
    }
}

generateFlavorText();
