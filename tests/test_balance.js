import fs from 'fs';

// Constants
const HOUSING_CAPACITY = 4;
const ACTION_TICK_MS = 50;
const ACTIONS_PER_SECOND = 1000 / ACTION_TICK_MS; // 20
const TICKS_REQUIRED = 100;
const SECONDS_PER_GATHER = (ACTION_TICK_MS * TICKS_REQUIRED) / 1000;

console.log("=== Simulation 1: Manual Gather Sweat Equity ===");
console.log(`Action interval: ${ACTION_TICK_MS}ms. Ticks to completion: ${TICKS_REQUIRED}.`);
console.log(`Time per gather: ${SECONDS_PER_GATHER} seconds.`);

const houseCost = { timber: 6, rations: 6, stone: 3 };
const totalActions = houseCost.timber + houseCost.rations + houseCost.stone;
console.log(`A House costs ${houseCost.timber} Timber, ${houseCost.rations} Rations, ${houseCost.stone} Stone (${totalActions} actions).`);

// Stone is slower, 80ms
const STONE_TICK_MS = 80;
const SECONDS_PER_STONE = (STONE_TICK_MS * TICKS_REQUIRED) / 1000;

let totalTimeSeconds =
  (houseCost.timber * SECONDS_PER_GATHER) +
  (houseCost.rations * SECONDS_PER_GATHER) +
  (houseCost.stone * SECONDS_PER_STONE);

console.log(`Total real-time wait to gather House materials: ${totalTimeSeconds} seconds.`);
if (totalTimeSeconds > 60) {
    console.log("[FAIL] Sweat Equity is too high! Building a basic house requires >1 minute of non-stop waiting/clicking.");
} else {
    console.log("[PASS] Sweat equity is acceptable.");
}

// Simulate building a Castle
const castleCost = { timber: 108, rations: 108, stone: 54 };
let castleTime =
  (castleCost.timber * SECONDS_PER_GATHER) +
  (castleCost.rations * SECONDS_PER_GATHER) +
  (castleCost.stone * SECONDS_PER_STONE);
console.log(`Total real-time wait to gather Castle materials: ${castleTime} seconds (${(castleTime/60).toFixed(2)} minutes).`);

console.log("\n=== Simulation 2: Death Spiral & Upkeep ===");
const ANNUAL_UPKEEP = 25;
let state = { bp: 0, unrest: 0, populationGrowthActive: true };

// Simulate 15 years where player fails to pay upkeep
for (let year = 1; year <= 15; year++) {
    state.bp -= ANNUAL_UPKEEP; // player tries to pay
    if (state.bp < 0) {
        state.unrest += 1;
        state.bp = 0; // reset to 0 debt
    }

    if (state.unrest >= 10 && state.populationGrowthActive) {
        state.populationGrowthActive = false;
        console.log(`[YEAR ${year}] FATAL: Unrest hit ${state.unrest}. Population growth halted. Immigration disabled.`);
    }
}
console.log(`After 15 years of failing upkeep: Unrest is ${state.unrest}. Can grow? ${state.populationGrowthActive}`);

console.log("\n=== Simulation 3: Soft-Lock Prevention (Stage 0/1) ===");
let stage0_sticks = 0;
// Player gathers 10 times
for (let i = 0; i < 15; i++) {
    stage0_sticks += 1; // 100% success rate without ruler failMod
}
console.log(`Stage 0 Sticks: ${stage0_sticks}. Can progress? ${stage0_sticks >= 10}`);
