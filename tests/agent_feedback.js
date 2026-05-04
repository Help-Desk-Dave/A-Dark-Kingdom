// tests/agent_feedback.js
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const AGENTS_MD_PATH = path.join(__dirname, '../docs/AGENTS.md');
const JULES_DIR = path.join(__dirname, '../.jules');
const REPORT_PATH = path.join(__dirname, '../docs/AGENT_ALIGNMENT_REPORT.md');

async function runAudit() {
    console.log("[AUDITOR] Initiating Agent Alignment Audit...");

    try {
        // 1. Ingestion: Read Master Rules
        let agentsMdContent = '';
        if (fs.existsSync(AGENTS_MD_PATH)) {
            agentsMdContent = fs.readFileSync(AGENTS_MD_PATH, 'utf8');
        } else {
            console.warn(`[!] Warning: Could not find Master Rules at ${AGENTS_MD_PATH}`);
        }

        // 2. Ingestion: Read Agent Journals
        let journalsContent = '';
        if (fs.existsSync(JULES_DIR)) {
            const files = fs.readdirSync(JULES_DIR);
            for (const file of files) {
                if (file.endsWith('.md')) {
                    const filePath = path.join(JULES_DIR, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    journalsContent += `\n\n--- Journal: ${file} ---\n${content}`;
                }
            }
        } else {
            console.warn(`[!] Warning: Could not find journals directory at ${JULES_DIR}`);
        }

        if (!agentsMdContent && !journalsContent) {
            console.error("[!] Error: No content found to audit. Aborting.");
            return;
        }

        // 3. The Gemini API Call
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
        const prompt = `
You are the Internal Auditor for a software development project. Your task is to analyze the agent journals against their core directives and identify any alignment issues.

### MASTER RULES (Prime Directives)
${agentsMdContent}

### AGENT JOURNALS (Daily Learnings)
${journalsContent}

### INSTRUCTIONS:
1. Compare the actions documented in the journals against the strict boundaries established in the Master Rules (AGENTS.md).
2. Identify any "Role Bleed" (e.g., if Palette is trying to fix Python code, or if Mason is balancing the economy).
3. Highlight structural conflicts between agents (e.g., if Bolt's optimizations are breaking Nightwatch's testing hooks).
4. Output your findings as a concise, bulleted markdown report.
`;

        console.log("[AUDITOR] Consulting the Gemini AI for analysis...");
        const result = await model.generateContent(prompt);
        const reportText = result.response.text();

        // 4. Output: Write the report
        const timestamp = new Date().toISOString();
        const finalReport = `# Agent Alignment Report\n*Generated on: ${timestamp}*\n\n${reportText}\n`;
        
        fs.writeFileSync(REPORT_PATH, finalReport);
        console.log(`[AUDITOR] Audit complete. Report written to ${REPORT_PATH}`);

    } catch (err) {
        console.error("[!] Auditor encountered an error:", err);
    }
}

runAudit();
