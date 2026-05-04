import { STRUCTURES_DB } from '../frontend/src/library.js';

const startingResources = {
    timber: 5,
    lumber: 0,
    rations: 0,
    stone: 0
};

// "Mock a kingdom state with 1 Pier and 1 Sawmill"
const structureCounts = {
    "sawmill": 1, // 1 cell = 1 sawmill
    "pier": 1        // 1 cell = 1 pier
};

let maxTimber = 100;
let maxLumber = 100;
let maxRations = 100;
let maxStone = 100;

Object.entries(structureCounts).forEach(([structName, cellCount]) => {
    const structData = STRUCTURES_DB[structName];
    if (structData && structData.storage_cap) {
        const lots = structData.lots || 1;
        const actualCount = Math.floor(cellCount / lots);
        for (let i = 0; i < actualCount; i++) {
            if (structData.storage_cap.timber) maxTimber += structData.storage_cap.timber;
            if (structData.storage_cap.lumber) maxLumber += structData.storage_cap.lumber;
            if (structData.storage_cap.rations) maxRations += structData.storage_cap.rations;
            if (structData.storage_cap.stone) maxStone += structData.storage_cap.stone;
        }
    }
});

let resources = { ...startingResources };

console.log("=== 📦 Quartermaster Production Simulation ===");
console.log(`[Start] Timber: ${resources.timber}/${maxTimber}, Lumber: ${resources.lumber}/${maxLumber}, Rations: ${resources.rations}/${maxRations}, Stone: ${resources.stone}/${maxStone}`);

for (let tick = 1; tick <= 24; tick++) {
    let dailyTimber = 0;
    let dailyLumber = 0;
    let dailyRations = 0;
    let dailyStone = 0;

    Object.entries(structureCounts).forEach(([structName, cellCount]) => {
        const structData = STRUCTURES_DB[structName];
        if (structData) {
            const lots = structData.lots || 1;
            const actualCount = Math.floor(cellCount / lots);
            for (let i = 0; i < actualCount; i++) {
                let canProduce = true;

                if (structData.consumes) {
                    if (structData.consumes.timber && resources.timber + dailyTimber < structData.consumes.timber) canProduce = false;
                    if (structData.consumes.lumber && resources.lumber + dailyLumber < structData.consumes.lumber) canProduce = false;
                    if (structData.consumes.rations && resources.rations + dailyRations < structData.consumes.rations) canProduce = false;
                    if (structData.consumes.stone && resources.stone + dailyStone < structData.consumes.stone) canProduce = false;
                }

                if (canProduce) {
                    if (structData.consumes) {
                        if (structData.consumes.timber) dailyTimber -= structData.consumes.timber;
                        if (structData.consumes.lumber) dailyLumber -= structData.consumes.lumber;
                        if (structData.consumes.rations) dailyRations -= structData.consumes.rations;
                        if (structData.consumes.stone) dailyStone -= structData.consumes.stone;
                    }

                    const produces = structData.produces || structData.production;
                    if (produces) {
                        if (produces.timber) dailyTimber += produces.timber;
                        if (produces.lumber) dailyLumber += produces.lumber;
                        if (produces.rations) dailyRations += produces.rations;
                        if (produces.stone) dailyStone += produces.stone;
                    }
                }
            }
        }
    });

    resources.timber = Math.min(Math.max(0, resources.timber + dailyTimber), maxTimber);
    resources.lumber = Math.min(Math.max(0, resources.lumber + dailyLumber), maxLumber);
    resources.rations = Math.min(Math.max(0, resources.rations + dailyRations), maxRations);
    resources.stone = Math.min(Math.max(0, resources.stone + dailyStone), maxStone);
}

console.log(`[End]   Timber: ${resources.timber}/${maxTimber}, Lumber: ${resources.lumber}/${maxLumber}, Rations: ${resources.rations}/${maxRations}, Stone: ${resources.stone}/${maxStone}`);

const netTimber = resources.timber - startingResources.timber;
const netLumber = resources.lumber - startingResources.lumber;
const netRations = resources.rations - startingResources.rations;
const netStone = resources.stone - startingResources.stone;

console.log("\n[Daily Yield]");
console.log(`Timber:  ${netTimber > 0 ? '+' : ''}${netTimber}`);
console.log(`Lumber:  ${netLumber > 0 ? '+' : ''}${netLumber}`);
console.log(`Rations: ${netRations > 0 ? '+' : ''}${netRations}`);
console.log(`Stone:   ${netStone > 0 ? '+' : ''}${netStone}`);
