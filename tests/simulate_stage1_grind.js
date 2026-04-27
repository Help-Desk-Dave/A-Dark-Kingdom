const ACTION_TICK_MS = 80;
const TIMBER_REQ = 3;
const RATIONS_REQ = 3;

// Player alternates clicking between Timber and Rations
// Assume they click exactly when progress finishes (optimistic)
let totalTicks = 0;
let currentTimber = 0;
let currentRations = 0;

console.log("=== Simulation: Stage 1 to Stage 2 Grind with Reduced Requirements ===");

while (currentTimber < TIMBER_REQ || currentRations < RATIONS_REQ) {
    if (currentTimber < TIMBER_REQ) {
        // Gathering Timber
        totalTicks += 100; // Takes 100 ticks (80ms per tick) to gather 1 Timber (if yield is 1) at Stage 1
        currentTimber += Math.max(1, 1 * 2); // In App.jsx yieldAmount = Math.max(1, stage * 2) -> Math.max(1, 1 * 2) = 2. But we only gather once.
        console.log(`Gathered Timber. Current Timber: ${currentTimber}, Total Ticks: ${totalTicks}`);
    }
    if (currentRations < RATIONS_REQ) {
        // Hunting Rations
        totalTicks += 100;
        currentRations += Math.max(1, 1 * 2); // yieldAmount = 2
        console.log(`Gathered Rations. Current Rations: ${currentRations}, Total Ticks: ${totalTicks}`);
    }
}

console.log(`Total Ticks required: ${totalTicks}`);
console.log(`Total real-time seconds: ${(totalTicks * ACTION_TICK_MS) / 1000}`);
