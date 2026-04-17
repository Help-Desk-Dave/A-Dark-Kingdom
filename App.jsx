import React, { useState, useEffect, useRef } from 'react';
import { Settings, Users, Building, Map as MapIcon, AlertTriangle, Coins, Wheat, UserPlus, LogOut } from 'lucide-react';

const STRUCTURES_DB = {
    "academy": { "lots": 2, "cost_rp": 52, "traits": ["building", "edifice"], "desc": "An institution where advanced study in many fields can be pursued.", "type": "2x1" },
    "alchemy laboratory": { "lots": 1, "cost_rp": 18, "traits": ["building"], "desc": "A factory for alchemists crafting elixirs and items.", "type": "1x1" },
    "arena": { "lots": 4, "cost_rp": 40, "traits": ["edifice", "yard"], "desc": "A large public structure for gladiator combats and spectacle.", "type": "2x2" },
    "bank": { "lots": 1, "cost_rp": 28, "traits": ["building"], "desc": "A secure building for storing valuables and granting loans.", "type": "1x1" },
    "barracks": { "lots": 1, "cost_rp": 6, "traits": ["building", "residential"], "desc": "Housing and training for guards and militia. Reduces Unrest.", "type": "1x1" },
    "brewery": { "lots": 1, "cost_rp": 6, "traits": ["building"], "desc": "Crafts alcohol and beverages. Reduces Unrest initially.", "type": "1x1" },
    "castle": { "lots": 4, "cost_rp": 54, "traits": ["building", "edifice", "famous", "infamous"], "desc": "A fortified seat of government. Significantly reduces Unrest.", "type": "2x2" },
    "cathedral": { "lots": 4, "cost_rp": 58, "traits": ["building", "edifice", "famous", "infamous"], "desc": "A focal point of spiritual worship.", "type": "2x2" },
    "cemetery": { "lots": 1, "cost_rp": 4, "traits": ["yard"], "desc": "A plot of land to bury the dead. Mitigates Unrest from dangerous events.", "type": "1x1" },
    "dump": { "lots": 1, "cost_rp": 4, "traits": ["yard"], "desc": "A centralized place for the disposal of refuse.", "type": "1x1" },
    "garrison": { "lots": 2, "cost_rp": 28, "traits": ["building", "residential"], "desc": "A complex for maintaining military forces.", "type": "2x1" },
    "general store": { "lots": 1, "cost_rp": 8, "traits": ["building"], "desc": "A basic shop that provides standard goods to citizens.", "type": "1x1" },
    "granary": { "lots": 1, "cost_rp": 12, "traits": ["building"], "desc": "Silos and warehouses for grain. Increases Food capacity.", "type": "1x1" },
    "hospital": { "lots": 2, "cost_rp": 30, "traits": ["building"], "desc": "Dedicated to healing the sick through magical and mundane means.", "type": "2x1" },
    "houses": { "lots": 1, "cost_rp": 3, "traits": ["building", "residential"], "desc": "Neighborhood dwellings for citizens to prevent overcrowding. Provides 4 capacity.", "type": "1x1", "capacity": 4 },
    "illicit market": { "lots": 1, "cost_rp": 50, "traits": ["building", "infamous"], "desc": "Unregulated and illegal trade. Increases Crime ruin.", "type": "1x1" },
    "inn": { "lots": 1, "cost_rp": 10, "traits": ["building", "residential"], "desc": "A safe place for visitors to rest.", "type": "1x1" },
    "jail": { "lots": 1, "cost_rp": 14, "traits": ["building"], "desc": "Fortified structure that houses criminals. Reduces Crime.", "type": "1x1" },
    "lumberyard": { "lots": 2, "cost_rp": 16, "traits": ["yard"], "desc": "Increases Lumber capacity. Must be built next to water.", "type": "1x2" },
    "marketplace": { "lots": 2, "cost_rp": 48, "traits": ["building", "residential"], "desc": "A large neighborhood of shops around an open area.", "type": "2x1" },
    "park": { "lots": 1, "cost_rp": 5, "traits": ["yard"], "desc": "Undeveloped land set aside for public use.", "type": "1x1" },
    "shrine": { "lots": 1, "cost_rp": 8, "traits": ["building"], "desc": "A small building devoted to a deity or faith.", "type": "1x1" },
    "tavern": { "lots": 1, "cost_rp": 24, "traits": ["building"], "desc": "A respectable establishment for entertainment, eating, and drinking.", "type": "1x1" },
    "tenement": { "lots": 1, "cost_rp": 1, "traits": ["building", "residential"], "desc": "Hastily built shantytowns. Cheap, but increases a Ruin.", "type": "1x1", "capacity": 4 },
    "watchtower": { "lots": 1, "cost_rp": 12, "traits": ["building"], "desc": "A guard post that grants advance warning to events.", "type": "1x1" }
};

const CITIZEN_NAMES = ["Urist", "Bomvur", "Elara", "Mila", "Finn", "Grog", "Kael", "Zora"];

const generatePop = (isHero = false) => ({
    id: Math.random().toString(36).substr(2, 9),
    name: isHero ? "The Hero" : CITIZEN_NAMES[Math.floor(Math.random() * CITIZEN_NAMES.length)],
    strength: Math.floor(Math.random() * 11) + 8, // 8-18
    intelligence: Math.floor(Math.random() * 11) + 8, // 8-18
    charisma: Math.floor(Math.random() * 11) + 8, // 8-18
});

const generateEmptyMap = () => Array(10).fill(null).map(() => Array(10).fill({ state: 'hidden' })); // hidden, recon, claimed
const generateEmptyUrbanGrid = () => Array(5).fill(null).map(() => Array(5).fill(null));

const App = () => {
    const [gameState, setGameState] = useState(() => {
        const saved = localStorage.getItem('darkKingdomState');
        if (saved) return JSON.parse(saved);

        return {
            stage: 1, // 1: Awakening, 2: Survival, 3: Expansion
            resources: { bp: 50, food: 50 },
            pops: [generatePop(true)],
            unrest: 0,
            logs: [{ text: "You awaken in the wilderness. The night is cold.", time: new Date().toLocaleTimeString() }],
            worldMap: generateEmptyMap(),
            urbanGrid: generateEmptyUrbanGrid(),
            advisors: { General: null, Treasurer: null, Diplomat: null },
            tickCount: 0,
            urbanViewOpen: false
        };
    });

    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [activeTab, setActiveTab] = useState('Map');
    const logsEndRef = useRef(null);

    // Save to local storage on state change
    useEffect(() => {
        localStorage.setItem('darkKingdomState', JSON.stringify(gameState));
    }, [gameState]);

    // Auto-scroll logs
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [gameState.logs]);

    const addLog = (text) => {
        setGameState(prev => ({
            ...prev,
            logs: [...prev.logs, { text, time: new Date().toLocaleTimeString() }]
        }));
    };

    const handleMapClick = (r, c) => {
        setGameState(prev => {
            const hex = prev.worldMap[r][c];
            const newState = { ...prev, worldMap: [...prev.worldMap.map(row => [...row])] };

            if (hex.state === 'hidden' && prev.resources.bp >= 5) {
                newState.resources.bp -= 5;
                newState.worldMap[r][c] = { state: 'recon' };
                newState.logs.push({ text: `Reconnaissance of hex (${r},${c}) complete.`, time: new Date().toLocaleTimeString() });
            } else if (hex.state === 'recon' && prev.resources.bp >= 10) {
                newState.resources.bp -= 10;
                newState.worldMap[r][c] = { state: 'claimed' };
                newState.logs.push({ text: `Claimed hex (${r},${c}) for the Kingdom.`, time: new Date().toLocaleTimeString() });
            } else if (hex.state === 'claimed' && r === 5 && c === 5) {
                newState.urbanViewOpen = true;
            } else if ((hex.state === 'hidden' && prev.resources.bp < 5) || (hex.state === 'recon' && prev.resources.bp < 10)) {
                newState.logs.push({ text: "Not enough BP to perform that action.", time: new Date().toLocaleTimeString() });
            }

            return newState;
        });
    };

    const handleUrbanGridClick = (r, c) => {
        if (!selectedBuilding) return;

        setGameState(prev => {
            const bldgData = STRUCTURES_DB[selectedBuilding];
            if (prev.resources.bp < bldgData.cost_rp) {
                return { ...prev, logs: [...prev.logs, { text: `Not enough BP for ${selectedBuilding}.`, time: new Date().toLocaleTimeString() }] };
            }

            // Check dimensions based on type (1x1, 1x2, 2x1, 2x2)
            const [w, h] = bldgData.type.split('x').map(Number);

            if (r + h > 5 || c + w > 5) {
                return { ...prev, logs: [...prev.logs, { text: "Building does not fit here.", time: new Date().toLocaleTimeString() }] };
            }

            // Check if space is free
            for (let i = 0; i < h; i++) {
                for (let j = 0; j < w; j++) {
                    if (prev.urbanGrid[r + i][c + j] !== null) {
                        return { ...prev, logs: [...prev.logs, { text: "Space is already occupied.", time: new Date().toLocaleTimeString() }] };
                    }
                }
            }

            // Build it
            const newGrid = prev.urbanGrid.map(row => [...row]);
            for (let i = 0; i < h; i++) {
                for (let j = 0; j < w; j++) {
                    // We store the building name in the top-left cell, and a reference or part in the others,
                    // but for simplicity let's just mark the primary cell with the name, and others with a continuation mark
                    newGrid[r + i][c + j] = (i === 0 && j === 0) ? selectedBuilding : `${selectedBuilding}-part`;
                }
            }

            return {
                ...prev,
                urbanGrid: newGrid,
                resources: { ...prev.resources, bp: prev.resources.bp - bldgData.cost_rp },
                logs: [...prev.logs, { text: `Built ${selectedBuilding}.`, time: new Date().toLocaleTimeString() }]
            };
        });
        setSelectedBuilding(null);
    };

    const assignAdvisor = (role, popId) => {
        setGameState(prev => ({
            ...prev,
            advisors: { ...prev.advisors, [role]: popId }
        }));
    };

    // The Tick System
    useEffect(() => {
        if (gameState.stage < 2) return;

        const interval = setInterval(() => {
            setGameState(prev => {
                const newState = { ...prev, tickCount: prev.tickCount + 1 };
                let logMessages = [];
                let newBP = prev.resources.bp;
                let newFood = prev.resources.food;
                let newPops = [...prev.pops];
                let newUnrest = prev.unrest;

                // 1. Food Consumption & Starvation (1 Food per Pop)
                const foodNeeded = newPops.length;
                if (newFood >= foodNeeded) {
                    newFood -= foodNeeded;
                } else {
                    newFood = 0;
                    if (newPops.length > 1) { // Hero can't starve initially for gameplay sake, but others can
                        newPops.pop();
                        logMessages.push("A citizen has starved and left or died.");
                        newUnrest += 1;
                    } else {
                        logMessages.push("You are starving.");
                    }
                }

                // 2. Base Resource Production
                // In a real sim, buildings/hexes provide this, but here's base:
                // Base BP = $2 + Pop // 2
                const bpProduction = 2 + Math.floor(newPops.length / 2);
                newBP += bpProduction;

                // Add basic food production for survival stage (e.g. foraging)
                newFood += 2;

                // Advisor Bonuses
                if (prev.advisors.Treasurer) {
                   const treasurer = newPops.find(p => p.id === prev.advisors.Treasurer);
                   if (treasurer) {
                       const mod = Math.floor(treasurer.intelligence / 4);
                       newBP += mod;
                   }
                }

                // 3. Annual Upkeep (every 12 ticks)
                if (newState.tickCount % 12 === 0) {
                    if (newBP >= 25) {
                        newBP -= 25;
                        logMessages.push("Paid annual upkeep of 25 BP.");
                    } else {
                        newBP = 0;
                        newUnrest += 2;
                        logMessages.push("Failed to pay annual upkeep! Unrest increases.");
                    }
                }

                // 4. Migration (30% chance if housing available and unrest < 5)
                let housingCapacity = 0;
                for(let r = 0; r < 5; r++) {
                    for(let c = 0; c < 5; c++) {
                        const bldgName = prev.urbanGrid[r][c];
                        if (bldgName) {
                            const bldg = STRUCTURES_DB[bldgName];
                            if (bldg.capacity) housingCapacity += bldg.capacity;
                        }
                    }
                }

                if (housingCapacity > newPops.length && newUnrest < 5 && Math.random() < 0.3) {
                    const numMigrants = Math.random() < 0.5 ? 1 : 2;
                    for(let i=0; i<numMigrants; i++) {
                        if (housingCapacity > newPops.length) {
                            newPops.push(generatePop());
                            logMessages.push("A new migrant has arrived!");
                        }
                    }
                }

                if (logMessages.length > 0) {
                     newState.logs = [...prev.logs, ...logMessages.map(text => ({ text, time: new Date().toLocaleTimeString() }))];
                }

                newState.resources = { bp: newBP, food: newFood };
                newState.pops = newPops;
                newState.unrest = newUnrest;

                // Check for Stage 3 progression
                if (prev.stage === 2 && housingCapacity > 0 && newPops.length > 1) {
                    newState.stage = 3;
                    newState.logs = [...newState.logs, { text: "The settlement grows. New administrative duties arise.", time: new Date().toLocaleTimeString() }];
                }

                return newState;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [gameState.stage]);

    // Calculate housing capacity for warnings
    let housingCapacity = 0;
    for(let r = 0; r < 5; r++) {
        for(let c = 0; c < 5; c++) {
            const bldgName = gameState.urbanGrid[r][c];
            if (bldgName && !bldgName.endsWith('-part')) {
                const bldg = STRUCTURES_DB[bldgName];
                if (bldg && bldg.capacity) housingCapacity += bldg.capacity;
            }
        }
    }
    const isOvercrowded = gameState.pops.length > housingCapacity;
    const isBPLow = gameState.resources.bp < 15;

    // Stage 1: Awakening
    if (gameState.stage === 1) {
        return (
            <div className="min-h-screen bg-black text-slate-300 flex flex-col items-center justify-center font-mono">
                <div className="w-full max-w-2xl h-64 overflow-y-auto mb-8 p-4 border border-slate-800 rounded">
                    {gameState.logs.map((log, i) => (
                        <div key={i} className="mb-2"><span className="text-slate-600">[{log.time}]</span> {log.text}</div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
                <button
                    onClick={() => {
                        setGameState(prev => {
                            const newMap = prev.worldMap.map(row => [...row]);
                            newMap[5][5] = { state: 'claimed' };
                            return {
                                ...prev,
                                stage: 2,
                                worldMap: newMap,
                                logs: [...prev.logs, { text: "Camp established. Survival begins.", time: new Date().toLocaleTimeString() }]
                            };
                        });
                    }}
                    className="px-6 py-3 border border-slate-600 hover:bg-slate-800 hover:text-white transition-colors"
                >
                    Establish Camp
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col font-mono text-sm">
            {/* Top Bar */}
            <div className="bg-slate-950 border-b border-slate-800 p-3 flex justify-between items-center">
                <div className="flex gap-6">
                    <div className={`flex items-center gap-2 ${isBPLow ? 'text-red-500 font-bold' : 'text-yellow-500'}`}>
                        <Coins size={16} /> {gameState.resources.bp} BP
                    </div>
                    <div className="flex items-center gap-2 text-green-500">
                        <Wheat size={16} /> {gameState.resources.food} Food
                    </div>
                    <div className="flex items-center gap-2 text-blue-400">
                        <Users size={16} /> {gameState.pops.length} Pops
                    </div>
                </div>
                {isOvercrowded && gameState.stage > 2 && (
                    <div className="text-red-500 animate-pulse font-bold flex items-center gap-2">
                        <AlertTriangle size={16} /> OVERCROWDED
                    </div>
                )}
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Content */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center">
                    {/* Tabs for Stage 3 */}
                    {gameState.stage === 3 && !gameState.urbanViewOpen && (
                        <div className="flex gap-4 mb-6">
                            {['Map', 'Advisors'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 border ${activeTab === tab ? 'border-slate-400 bg-slate-800' : 'border-slate-800 text-slate-500'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Urban View */}
                    {gameState.urbanViewOpen ? (
                        <div className="w-full max-w-3xl">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl">Urban Grid</h2>
                                <button onClick={() => setGameState(p => ({...p, urbanViewOpen: false}))} className="flex items-center gap-2 hover:text-slate-300">
                                    <MapIcon size={16}/> Back to Map
                                </button>
                            </div>

                            <div className="flex gap-6">
                                {/* The 5x5 Grid */}
                                <div className="grid grid-cols-5 gap-1 bg-slate-800 p-2 border border-slate-700">
                                    {gameState.urbanGrid.map((row, r) =>
                                        row.map((cell, c) => (
                                            <div
                                                key={`${r}-${c}`}
                                                onClick={() => handleUrbanGridClick(r, c)}
                                                className={`w-16 h-16 border ${cell ? 'border-blue-500 bg-blue-900/30' : 'border-slate-700 hover:bg-slate-700'} flex items-center justify-center text-xs text-center cursor-pointer`}
                                            >
                                                {cell && cell.replace('-part', '')}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Building Selection */}
                                <div className="flex-1 h-96 overflow-y-auto border border-slate-800 p-2">
                                    <h3 className="mb-2 font-bold text-slate-400">Available Structures</h3>
                                    {Object.entries(STRUCTURES_DB).map(([name, data]) => (
                                        <div
                                            key={name}
                                            onClick={() => setSelectedBuilding(name)}
                                            className={`p-2 mb-2 border cursor-pointer ${selectedBuilding === name ? 'border-yellow-500 bg-slate-800' : 'border-slate-800 hover:border-slate-600'}`}
                                        >
                                            <div className="flex justify-between">
                                                <span className="capitalize font-bold">{name}</span>
                                                <span className="text-yellow-500">{data.cost_rp} BP</span>
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1">{data.desc}</div>
                                            <div className="text-xs text-slate-500 mt-1">Size: {data.type}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Map or Advisors View
                        activeTab === 'Map' ? (
                            <div className="flex flex-col items-center">
                                <div className="grid grid-cols-10 gap-1 bg-slate-950 p-2 border border-slate-800">
                                    {gameState.worldMap.map((row, r) =>
                                        row.map((cell, c) => {
                                            // Only reveal (5,5) in Stage 2 initially, unless reconned
                                            const isCenter = r === 5 && c === 5;
                                            const isHidden = cell.state === 'hidden' && !isCenter;

                                            let bgClass = "bg-slate-900";
                                            if (cell.state === 'recon') bgClass = "bg-slate-700";
                                            if (cell.state === 'claimed') bgClass = "bg-green-900/30 border-green-700";
                                            if (isCenter && cell.state === 'claimed') bgClass = "bg-blue-900/40 border-blue-500"; // Capital

                                            return (
                                                <div
                                                    key={`${r}-${c}`}
                                                    onClick={() => handleMapClick(r, c)}
                                                    className={`w-10 h-10 border ${bgClass} ${isHidden ? 'border-slate-900' : 'border-slate-700'} hover:border-slate-400 cursor-pointer flex items-center justify-center text-xs`}
                                                    title={`Hex (${r},${c}) - ${cell.state}`}
                                                >
                                                    {isHidden ? '?' : ''}
                                                    {isCenter && cell.state === 'claimed' ? '★' : ''}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                <div className="mt-4 text-slate-500 text-xs">
                                    Click hidden to Recon (5 BP). Click Recon to Claim (10 BP). Click Capital (★) to open Urban View.
                                </div>
                            </div>
                        ) : (
                            // Advisors View (Stage 3 only)
                            <div className="w-full max-w-2xl">
                                <h2 className="text-xl mb-4">Advisors & Population</h2>
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    {['General', 'Treasurer', 'Diplomat'].map(role => (
                                        <div key={role} className="border border-slate-700 p-4">
                                            <div className="font-bold mb-2">{role}</div>
                                            <select
                                                className="w-full bg-slate-800 border border-slate-600 p-1 text-sm"
                                                value={gameState.advisors[role] || ''}
                                                onChange={(e) => assignAdvisor(role, e.target.value)}
                                            >
                                                <option value="">-- Unassigned --</option>
                                                {gameState.pops.map(pop => (
                                                    <option key={pop.id} value={pop.id}>{pop.name}</option>
                                                ))}
                                            </select>
                                            {gameState.advisors[role] && (
                                                <div className="mt-2 text-xs text-slate-400">
                                                    Mod: +{Math.floor(gameState.pops.find(p => p.id === gameState.advisors[role])?.intelligence / 4 || 0)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <h3 className="mb-2 border-b border-slate-800 pb-1">Citizens ({gameState.pops.length})</h3>
                                    <div className="max-h-48 overflow-y-auto">
                                        {gameState.pops.map(pop => (
                                            <div key={pop.id} className="flex justify-between py-1 border-b border-slate-800/50 text-xs">
                                                <span>{pop.name}</span>
                                                <span className="text-slate-500">STR:{pop.strength} INT:{pop.intelligence} CHA:{pop.charisma}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </div>

                {/* Event Log Sidebar */}
                <div className="w-80 bg-slate-950 border-l border-slate-800 p-4 flex flex-col">
                    <h3 className="font-bold text-slate-400 mb-4 border-b border-slate-800 pb-2">Event Log</h3>
                    <div className="flex-1 overflow-y-auto flex flex-col gap-2 text-xs">
                        {gameState.logs.map((log, i) => (
                            <div key={i} className="text-slate-300">
                                <span className="text-slate-600 block mb-0.5">[{log.time}]</span>
                                {log.text}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;