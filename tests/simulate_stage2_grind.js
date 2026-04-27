const fs = require('fs');

const ANNUAL_UPKEEP = 25;
const RECON_COST = 5;

// Mocking the manual labor simulation for Stage 1 -> Stage 2 grind
let timber = 0;
let rations = 0;
let ticks = 0;
let clicks = 0;

// Simulate player clicking to gather
while (timber < 5 || rations < 5) {
    ticks++;
    // Player alternates
    if (ticks % 2 === 0 && timber < 5) {
        timber += 1;
        clicks++;
    } else if (rations < 5) {
        rations += 1;
        clicks++;
    }
}

console.log("Stage 1 -> 2 Grind Simulation:");
console.log(`Ticks to reach 5 Timber and 5 Rations: ${ticks}`);
console.log(`Total manual clicks: ${clicks}`);
