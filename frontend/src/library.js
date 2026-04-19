export const RECON_COST = 5;
export const CLAIM_COST = 10;
export const ANNUAL_UPKEEP = 25;
export const HOUSING_CAPACITY = 4;

export const FLAVORS = {
    swamp: {
        Forest: " Ѱ ",
        Plain: " . ",
        Mountain: " ▲ ",
        Hill: " m ",
        Swamp: " ~ ",
        color: "text-green-500",
        border: "border-green-800",
        hover: "hover:border-green-400",
        text_suffix: "of the Glades"
    },
    icy: {
        Forest: " ❄ ",
        Plain: " _ ",
        Mountain: " 🏔 ",
        Hill: " ^ ",
        Swamp: " 🧊 ",
        color: "text-cyan-500",
        border: "border-cyan-800",
        hover: "hover:border-cyan-400",
        text_suffix: "of the Frozen North"
    },
    necromancy: {
        Forest: " ✝ ",
        Plain: " ☠ ",
        Mountain: " ⚰ ",
        Hill: " ☖ ",
        Swamp: " ☣ ",
        color: "text-fuchsia-500",
        border: "border-fuchsia-800",
        hover: "hover:border-fuchsia-400",
        text_suffix: "of the Grave"
    },
    desert: {
        Forest: " 🌵 ",
        Plain: " . ",
        Mountain: " ▲ ",
        Hill: " n ",
        Swamp: " ♒ ",
        color: "text-yellow-500",
        border: "border-yellow-800",
        hover: "hover:border-yellow-400",
        text_suffix: "of the Burning Sands"
    }
};

export const SETTLEMENT_NAMES = [
    "Alligator's End", "Mangrove Reach", "The Glades", "Sawgrass Outpost",
    "Ever-Mist", "Cypress Stand", "Keys of Chaos", "Spanish Moss Manor",
    "Restov", "Pitax", "Oleg's Rest", "Staglord's Folly", "Tuskdale",
    "Greenbelt Heart", "Varnhold", "Hooktongue Slough", "Lake Reykal", "Golushkin"
];

export const KINGMAKER_BACKGROUNDS = [
    {"name": "Borderlands Pioneer", "skill": "Nature", "attribute": "Strength", "desc": "You have long lived along the southern border of Brevoy.", "failMod": 0.1},
    {"name": "Brevic Noble", "skill": "Society", "attribute": "Charisma", "desc": "You claim a connection to one of Brevoy's noble families (Garess, Lebeda, Lodovka, Medvyed, Orlovsky, Surtova).", "failMod": 0.25},
    {"name": "Brevic Outcast", "skill": "Politics", "attribute": "Charisma", "desc": "You have noble blood but no proof, seeking to make a name of your own.", "failMod": 0.2},
    {"name": "Issian Patriot", "skill": "Society", "attribute": "Intelligence", "desc": "You grew up in northern Brevoy, answering the call for heroes.", "failMod": 0.15},
    {"name": "Local Brigand", "skill": "Intimidation", "attribute": "Strength", "desc": "You hail from the lawless reaches and are looking to lie low.", "failMod": 0.15},
    {"name": "Rostlander", "skill": "Athletics", "attribute": "Strength", "desc": "Raised in the south of Brevoy, you come from hardy stock.", "failMod": 0.1},
    {"name": "Sword Scion", "skill": "Warfare", "attribute": "Strength", "desc": "You grew up on tales of the legendary Aldori swordlords.", "failMod": 0.15}
];

export const STRUCTURES_DB = {
    "pier": {lots: 1, cost_timber: 20, cost_rations: 10, cost_stone: 5, traits: ["building"], production: {rations: 2}, desc: "A dock for fishing and small boats. Produces rations daily."},
    "academy": {lots: 2, cost_timber: 104, cost_rations: 104, cost_stone: 52, traits: ["building", "edifice"], desc: "An institution where advanced study in many fields can be pursued."},
    "alchemy laboratory": {lots: 1, cost_timber: 36, cost_rations: 36, cost_stone: 18, traits: ["building"], desc: "A factory for alchemists crafting elixirs and items."},
    "arena": {lots: 4, cost_timber: 80, cost_rations: 80, cost_stone: 40, traits: ["edifice", "yard"], desc: "A large public structure for gladiator combats and spectacle."},
    "bank": {lots: 1, cost_timber: 56, cost_rations: 56, cost_stone: 28, traits: ["building"], desc: "A secure building for storing valuables and granting loans."},
    "barracks": {lots: 1, cost_timber: 12, cost_rations: 12, cost_stone: 6, traits: ["building", "residential"], desc: "Housing and training for guards and militia. Reduces Unrest."},
    "brewery": {lots: 1, cost_timber: 12, cost_rations: 12, cost_stone: 6, traits: ["building"], desc: "Crafts alcohol and beverages. Reduces Unrest initially."},
    "castle": {lots: 4, cost_timber: 108, cost_rations: 108, cost_stone: 54, traits: ["building", "edifice", "famous", "infamous"], desc: "A fortified seat of government. Significantly reduces Unrest."},
    "cathedral": {lots: 4, cost_timber: 116, cost_rations: 116, cost_stone: 58, traits: ["building", "edifice", "famous", "infamous"], desc: "A focal point of spiritual worship."},
    "cemetery": {lots: 1, cost_timber: 8, cost_rations: 8, cost_stone: 4, traits: ["yard"], desc: "A plot of land to bury the dead. Mitigates Unrest from dangerous events."},
    "dump": {lots: 1, cost_timber: 8, cost_rations: 8, cost_stone: 4, traits: ["yard"], desc: "A centralized place for the disposal of refuse."},
    "farm": {lots: 1, cost_timber: 10, cost_rations: 10, cost_stone: 5, traits: ["yard"], desc: "Produces food for your citizens. Essential for survival."},
    "garrison": {lots: 2, cost_timber: 56, cost_rations: 56, cost_stone: 28, traits: ["building", "residential"], desc: "A complex for maintaining military forces."},
    "general store": {lots: 1, cost_timber: 16, cost_rations: 16, cost_stone: 8, traits: ["building"], desc: "A basic shop that provides standard goods to citizens."},
    "granary": {lots: 1, cost_timber: 24, cost_rations: 24, cost_stone: 12, traits: ["building"], desc: "Silos and warehouses for grain. Increases Food capacity."},
    "hospital": {lots: 2, cost_timber: 60, cost_rations: 60, cost_stone: 30, traits: ["building"], desc: "Dedicated to healing the sick through magical and mundane means."},
    "houses": {lots: 1, cost_timber: 6, cost_rations: 6, cost_stone: 3, traits: ["building", "residential"], desc: "Neighborhood dwellings for citizens to prevent overcrowding."},
    "illicit market": {lots: 1, cost_timber: 100, cost_rations: 100, cost_stone: 50, traits: ["building", "infamous"], desc: "Unregulated and illegal trade. Increases Crime ruin."},
    "inn": {lots: 1, cost_timber: 20, cost_rations: 20, cost_stone: 10, traits: ["building", "residential"], desc: "A safe place for visitors to rest."},
    "jail": {lots: 1, cost_timber: 28, cost_rations: 28, cost_stone: 14, traits: ["building"], desc: "Fortified structure that houses criminals. Reduces Crime."},
    "lumberyard": {lots: 2, cost_timber: 32, cost_rations: 32, cost_stone: 16, traits: ["yard"], desc: "Increases Lumber capacity. Must be built next to water."},
    "marketplace": {lots: 2, cost_timber: 96, cost_rations: 96, cost_stone: 48, traits: ["building", "residential"], desc: "A large neighborhood of shops around an open area."},
    "park": {lots: 1, cost_timber: 10, cost_rations: 10, cost_stone: 5, traits: ["yard"], desc: "Undeveloped land set aside for public use."},
    "shrine": {lots: 1, cost_timber: 16, cost_rations: 16, cost_stone: 8, traits: ["building"], desc: "A small building devoted to a deity or faith."},
    "tavern": {lots: 1, cost_timber: 48, cost_rations: 48, cost_stone: 24, traits: ["building"], desc: "A respectable establishment for entertainment, eating, and drinking."},
    "tenement": {lots: 1, cost_timber: 2, cost_rations: 2, cost_stone: 1, traits: ["building", "residential"], desc: "Hastily built shantytowns. Cheap, but increases a Ruin."},
    "watchtower": {lots: 1, cost_timber: 24, cost_rations: 24, cost_stone: 12, traits: ["building"], desc: "A guard post that grants advance warning to events."},
    "pioneer tent": {lots: 1, cost_timber: 20, traits: ["building", "residential"], desc: "A basic shelter for early survival. Increases max population."},
    "supply wagon": {lots: 1, cost_timber: 50, traits: ["building", "storage"], desc: "A reinforced wagon for storing large quantities of resources."}
};

export const PROMINENT_CITIZENS = [
    {name: "Arven", title: "The Fisher", trigger: "Build a Pier", quest: "Wants you to clear a monster from his secret fishing hole."},
    {name: "Stas", title: "The Lumberjack", trigger: "Build a Lumberyard", quest: "Lost his magical spear and needs it retrieved."},
    {name: "Lily Teskertin", title: "The Aristocrat", trigger: "Build a Manor/Craft Luxuries", quest: "Fascinated with elven artistry and ruins."},
    {name: "Edrist Hanvaki", title: "The Merchant", trigger: "Kingdom founded", quest: "His brother Temin travels without guards and needs rescuing."},
    {name: "Jemanda Orlashen", title: "The Detective", trigger: "Random Event", quest: "Seeking an instructor who caused a scandal at the Kitharodian Academy."},
    {name: "Tamerak Elenark", title: "The Scholar", trigger: "Build an Academy or Museum", quest: "Researching the ancient cyclopes empire in Iobaria."},
    {name: "Chundis", title: "The Swamper", trigger: "Claim a swamp hex", quest: "Tells tales of real swamp monsters that need dealing with."},
    {name: "Jennavieve Kensen", title: "The Collector", trigger: "Build a Noble Villa", quest: "Wants to build a stable and collect exotic mounts."},
    {name: "Bixen Libixyten", title: "The Brewer", trigger: "Build 3 Breweries", quest: "Needs a public feat of glory performed after drinking his new blackberry mead."},
    {name: "Loris Shadwest", title: "The Taxidermist", trigger: "Kingdom Level 17", quest: "Wants to taxidermy a real winged owlbear."}
];
