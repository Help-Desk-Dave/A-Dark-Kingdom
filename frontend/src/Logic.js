export const FLAVORS = {
    "swamp": {
        "Forest": " Ѱ ",
        "Plain": " . ",
        "Mountain": " ▲ ",
        "Hill": " m ",
        "Swamp": " ~ ",
        "color": "green",
        "text_suffix": "of the Glades"
    },
    "icy": {
        "Forest": " ❄ ",
        "Plain": " _ ",
        "Mountain": " 🏔 ",
        "Hill": " ^ ",
        "Swamp": " 🧊 ",
        "color": "cyan",
        "text_suffix": "of the Frozen North"
    },
    "necromancy": {
        "Forest": " ✝ ",
        "Plain": " ☠ ",
        "Mountain": " ⚰ ",
        "Hill": " ☖ ",
        "Swamp": " ☣ ",
        "color": "magenta",
        "text_suffix": "of the Grave"
    },
    "desert": {
        "Forest": " 🌵 ",
        "Plain": " . ",
        "Mountain": " ▲ ",
        "Hill": " n ",
        "Swamp": " ♒ ",
        "color": "yellow",
        "text_suffix": "of the Burning Sands"
    }
};

export const STRUCTURES_DB = {
    "houses": {"lots": 1, "cost_rp": 3, "traits": ["building", "residential"], "desc": "Neighborhood dwellings for citizens. Supports 4 Pops."},
    "academy": {"lots": 2, "cost_rp": 52, "traits": ["building", "edifice"], "desc": "An institution where advanced study in many fields can be pursued."},
    "castle": {"lots": 4, "cost_rp": 54, "traits": ["building", "edifice", "famous", "infamous"], "desc": "A fortified seat of government. Significantly reduces Unrest."},
    "farm": {"lots": 1, "cost_rp": 10, "traits": ["yard"], "desc": "Provides +5 Food per month. Primary way to sustain population."},
    "granary": {"lots": 1, "cost_rp": 12, "traits": ["building"], "desc": "Increases storage capacity, +2 stability during Crop Failure."},
    "marketplace": {"lots": 2, "cost_rp": 48, "traits": ["building", "residential"], "desc": "Provides +10% bonus to total BP production."},
    "lumberyard": {"lots": 2, "cost_rp": 16, "traits": ["yard"], "desc": "Doubles Forest hex BP contribution."}
};

const CITIZEN_NAMES = ["Urist", "Bomvur", "Elara", "Mila", "Finn", "Grog", "Kael", "Zora"];

export class Pop {
    constructor() {
        this.name = CITIZEN_NAMES[Math.floor(Math.random() * CITIZEN_NAMES.length)] + " " + Math.floor(Math.random() * 1000);
        this.strength = Math.floor(Math.random() * 6) + 8; // 8-13 base
        this.intelligence = Math.floor(Math.random() * 6) + 8;
        this.charisma = Math.floor(Math.random() * 6) + 8;
    }
<<<<<<< HEAD

=======

>>>>>>> jules-7468165478531852990-94aa9d18
    getModifier(stat) {
        return Math.floor((stat - 10) / 2);
    }
}

export function generateWorld() {
    const terrainTypes = ["Forest", "Plain", "Mountain", "Hill", "Swamp"];
    const world = [];
    for (let y = 0; y < 10; y++) {
        const row = [];
        for (let x = 0; x < 10; x++) {
            row.push({
                x, y,
                terrain: terrainTypes[Math.floor(Math.random() * terrainTypes.length)],
                status: 0, // 0: Hidden, 1: Reconnoitered, 2: Claimed
                feature: null
            });
        }
        world.push(row);
    }
    // Set starting position
    world[5][5].status = 2; // Capital is claimed
    return world;
}

export function generateCapitalGrid() {
    const grid = [];
    for (let y = 0; y < 5; y++) {
        const row = [];
        for (let x = 0; x < 5; x++) {
            row.push(null); // null means empty lot
        }
        grid.push(row);
    }
    return grid;
}

export const INITIAL_STATE = {
    name: "The Sunken Glades",
    flavor: "swamp",
    bp: 60,
    food: 40,
    unrest: 0,
    xp: 0,
    level: 1,
    world: generateWorld(),
    capitalGrid: generateCapitalGrid(),
    pops: [],
    advisors: {
        general: null,   // Strength
        treasurer: null, // Intelligence
        diplomat: null   // Charisma
    },
    log: ["Expedition landed of the Glades.", "Capital founded."],
    tickCount: 0
};

export function processTick(state) {
    let newLog = [];
    let bpChange = 5; // Base BP
    let foodChange = 0;
<<<<<<< HEAD

    // Tax base (1 BP per 2 Pops)
    bpChange += Math.floor(state.pops.length / 2);

=======

    // Tax base (1 BP per 2 Pops)
    bpChange += Math.floor(state.pops.length / 2);

>>>>>>> jules-7468165478531852990-94aa9d18
    // Food Consumption
    foodChange -= state.pops.length;

    // Check Advisors
    if (state.advisors.treasurer) {
        const tMod = Math.floor((state.advisors.treasurer.intelligence - 10) / 2);
        bpChange += tMod;
    }
<<<<<<< HEAD

=======

>>>>>>> jules-7468165478531852990-94aa9d18
    if (state.advisors.general) {
        const gMod = Math.floor((state.advisors.general.strength - 10) / 2);
        if (gMod > 0 && Math.random() < 0.2) { // 20% chance to reduce unrest each month if strong
            state.unrest = Math.max(0, state.unrest - 1);
        }
    }

    let hasMarketplace = false;

    // Process World Map
    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
            const hex = state.world[y][x];
            if (hex.status === 2) { // Claimed
                foodChange += 1; // Base wilderness foraging
<<<<<<< HEAD

=======

>>>>>>> jules-7468165478531852990-94aa9d18
                // Terrain Specialization
                if (hex.terrain === "Mountain" || hex.terrain === "Hill") {
                    bpChange += 1;
                } else if (hex.terrain === "Forest") {
                    bpChange += 1;
                    // Check if lumberyard built (simplification: assume lumberyard affects all forests if one exists? Or map grid?)
<<<<<<< HEAD
                    // The instructions said "Lumberyard: If built in a hex with a Forest...".
=======
                    // The instructions said "Lumberyard: If built in a hex with a Forest...".
>>>>>>> jules-7468165478531852990-94aa9d18
                    // Let's abstract this: if the capital has a lumberyard, all claimed forests get +1 BP.
                } else if (hex.terrain === "Swamp") {
                    foodChange += 2;
                }
            }
        }
    }

    // Process Capital Grid (Buildings)
    let housingCapacity = 0;
    let hasLumberyard = false;

    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            const building = state.capitalGrid[y][x];
            if (building === "houses") housingCapacity += 4;
            if (building === "farm") foodChange += 5;
            if (building === "marketplace") hasMarketplace = true;
            if (building === "lumberyard") hasLumberyard = true;
        }
    }

    if (hasLumberyard) {
        // Double forest BP contribution
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                if (state.world[y][x].status === 2 && state.world[y][x].terrain === "Forest") {
                    bpChange += 1;
                }
            }
        }
    }

    if (hasMarketplace) {
        bpChange = Math.floor(bpChange * 1.10); // +10%
    }

    // Apply resource changes
    state.bp += bpChange;
    state.food += foodChange;
<<<<<<< HEAD

=======

>>>>>>> jules-7468165478531852990-94aa9d18
    if (state.food < 0) {
        state.food = 0;
        state.unrest += 1;
        newLog.push("[-] Starvation! Unrest increases.");
    }

    // Migration Waves
    let newPops = [];
    if (state.pops.length < housingCapacity) {
        // Migration logic: Diplomat increases number of pops that arrive
        let baseMigrants = 1;
        if (state.advisors.diplomat) {
             const dMod = Math.floor((state.advisors.diplomat.charisma - 10) / 2);
             if (dMod > 0) baseMigrants += dMod;
        }
<<<<<<< HEAD

        let spaceLeft = housingCapacity - state.pops.length;
        let migrants = Math.min(spaceLeft, baseMigrants);

=======

        let spaceLeft = housingCapacity - state.pops.length;
        let migrants = Math.min(spaceLeft, baseMigrants);

>>>>>>> jules-7468165478531852990-94aa9d18
        for (let i = 0; i < migrants; i++) {
             let p = new Pop();
             state.pops.push(p);
             newPops.push(p.name);
        }
    }

    if (newPops.length > 0) {
        newLog.push(`[+] Migration Wave: ${newPops.length} new citizens arrived.`);
    }

    // Overcrowded Check is handled in UI, but Unrest could tick up
    if (state.pops.length > housingCapacity) {
        if (Math.random() < 0.2) { // 20% chance to gain unrest if overcrowded
             state.unrest += 1;
             newLog.push("[-] Overcrowded! Unrest increases.");
        }
    }

    // Tick Count and Annual Charter Upkeep
    state.tickCount += 1;
    if (state.tickCount % 12 === 0) {
        state.bp -= 25;
        newLog.push("[-] Annual Charter Upkeep paid (25 BP).");
        if (state.bp < 0) {
             state.bp = 0;
             state.unrest += 2;
             newLog.push("[-] Failed to pay Charter Upkeep! Unrest increases significantly.");
        }
    }

    if (newLog.length > 0) {
        state.log = [...state.log, ...newLog];
    }

    return state;
}