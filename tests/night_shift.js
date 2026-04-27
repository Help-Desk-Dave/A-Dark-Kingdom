// tests/night_shift.js
const shell = require('shelljs');
const cron = require('node-cron');

console.log("=== THE NIGHT SHIFT IS ACTIVE ===");
console.log("Waiting for scheduled execution...");

// Run this workflow every night at 2:00 AM
cron.schedule('0 2 * * *', () => {
    console.log(`\n[${new Date().toISOString()}] Initiating Master Pipeline...`);

    // 1. Run the Playtest Bot
    console.log("\n--- Phase 1: Nightwatch (Playtesting) ---");
    shell.exec('node bot.js');

    // 2. Analyze Telemetry
    console.log("\n--- Phase 2: Equinox (Economic Analysis) ---");
    shell.exec('node analyze_telemetry.js');

    // 3. Generate Flavor Text
    console.log("\n--- Phase 3: The Muse (Atmospherics) ---");
    shell.exec('node muse_lore.js');

    // 4. Implement Code Changes
    console.log("\n--- Phase 4: Mason (Implementation) ---");
    shell.exec('node implement_patch.js');
    
    // 5. (Optional) Run your Vite build to ensure nothing broke
    console.log("\n--- Phase 5: The Blacksmith (Build Check) ---");
    const build = shell.exec('cd ../frontend && pnpm run build');
    
    if (build.code !== 0) {
        console.error("[!] THE FORGE IS BROKEN. BUILD FAILED.");
        // Here you could trigger a Discord webhook or email yourself to wake up and fix it.
    } else {
        console.log("[+] The Kingdom rests safely. All systems green.");
    }
});
