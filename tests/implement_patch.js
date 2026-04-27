// tests/implement_patch.js
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const LIBRARY_FILE = path.join(__dirname, '../frontend/src/library.js');
const LEDGER_FILE = path.join(__dirname, '../docs/BALANCE_LEDGER.md');

async function implementPatch() {
    console.log("[MASON] Reviewing the Architect's blueprints...");
    
    if (!fs.existsSync(LEDGER_FILE)) return console.log("No balance ledger found.");
    
    const currentLibraryCode = fs.readFileSync(LIBRARY_FILE, 'utf8');
    const ledgerNotes = fs.readFileSync(LEDGER_FILE, 'utf8');

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Pro is better for coding but Flash avoids rate limits here
    const prompt = `
    You are Mason 🧱, the lead developer. 
    Here is the current code for library.js:
    ---
    ${currentLibraryCode}
    ---
    Here are the latest balance adjustments requested by the economist:
    ---
    ${ledgerNotes}
    ---
    Rewrite library.js to apply these specific numerical changes. 
    Return ONLY the raw, complete javascript code. Do not include markdown formatting like \`\`\`javascript.
    `;

    try {
        const result = await model.generateContent(prompt);
        let newCode = result.response.text().replace(/```javascript/gi, '').replace(/```/g, '').trim();
        
        // Overwrite the file with the AI's new code
        fs.writeFileSync(LIBRARY_FILE, newCode);
        console.log("[MASON] Successfully patched library.js with new balance data.");
        
        // Optional: Clear the ledger so it doesn't get processed twice
        fs.writeFileSync(LEDGER_FILE, "# Balance Ledger\n\n*(Cleared after implementation)*");

    } catch (err) {
        console.error("[!] Mason failed to implement patch:", err.message);
    }
}

implementPatch();
