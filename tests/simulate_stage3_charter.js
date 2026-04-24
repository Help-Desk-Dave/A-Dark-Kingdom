const HOUSING_CAPACITY = 4;
const CHARTER_REQ = 5;

let resLots = 1; // Player built 1 house to trigger Stage 3
let popCapacity = resLots * HOUSING_CAPACITY;

console.log("=== Simulation: Stage 3 Charter Soft-Lock ===");
console.log(`Starting Stage 3. Residential Lots built: ${resLots}`);
console.log(`Current Population Capacity: ${popCapacity}`);
console.log(`Charter Requirement: ${CHARTER_REQ}`);

let ticksToWait = 1000;
let arrivedPop = 0;

for (let tick = 0; tick < ticksToWait; tick++) {
    // Attempt population growth
    if (arrivedPop < popCapacity) {
        arrivedPop++;
    }
}

console.log(`After ${ticksToWait} macro-ticks, actual population is ${arrivedPop}`);
if (arrivedPop < CHARTER_REQ) {
    console.log(`[FATAL SOFT-LOCK] Population maxes at ${arrivedPop}, which is strictly less than ${CHARTER_REQ}. Charter can never be signed without intuitively building another house without a prompt.`);
} else {
    console.log(`[PASS] Charter can be signed.`);
}

console.log("\n=== Alternative 1: Set HOUSING_CAPACITY = 5 ===");
popCapacity = resLots * 5;
arrivedPop = 0;
for (let tick = 0; tick < ticksToWait; tick++) {
    if (arrivedPop < popCapacity) arrivedPop++;
}
console.log(`Capacity: ${popCapacity}. Arrived: ${arrivedPop}. Can sign? ${arrivedPop >= CHARTER_REQ}`);
