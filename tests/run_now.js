const shell = require('shelljs');
const { spawn } = require('child_process');

console.log("=== INITIATING IMMEDIATE PLAYTHROUGH ===");

console.log("\n--- Phase 0: Starting Dev Server ---");
const devServer = spawn('npm', ['run', 'dev'], {
    cwd: '../frontend',
    shell: true,
    stdio: 'ignore'
});

setTimeout(() => {
    console.log("\n--- Phase 1: Nightwatch (Playtesting) ---");
    shell.exec('node bot.js');

    console.log("\n--- Phase 2: Equinox (Economic Analysis) ---");
    shell.exec('node analyze_telemetry.js');

    console.log("\n--- Phase 3: The Muse (Atmospherics) ---");
    shell.exec('node muse_lore.js');

    console.log("\n--- Phase 4: Mason (Implementation) ---");
    shell.exec('node implement_patch.js');

    console.log("\n--- Phase 5: The Blacksmith (Build Check) ---");
    const build = shell.exec('cd ../frontend && npm run build');

    if (build.code !== 0) {
        console.error("[!] THE FORGE IS BROKEN. BUILD FAILED.");
    } else {
        console.log("[+] The Kingdom rests safely. All systems green.");
    }

    // Cleanup Dev Server
    console.log("\n--- Shutting Down Dev Server ---");
    devServer.kill();
    process.exit(0);

}, 3000); // Give Vite 3 seconds to start up
