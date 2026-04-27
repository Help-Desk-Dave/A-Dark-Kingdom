import { useState, useEffect, useRef } from 'react';

const NAMES = ["Algar", "Bryn", "Cael", "Doran", "Elara", "Fen", "Gael", "Halia", "Ivor", "Jarek"];
const DIALOGUE_CHANCE = 0.05;
const STATE_CHANGE_CHANCE = 0.1;

export const usePopulationEngine = (world, stage, HOUSING_CAPACITY, unrest, ruler, addLog) => {
    const [pops, setPops] = useState(() => {
        const saved = localStorage.getItem('adk_pops');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    return parsed.map(pop => ({
                        bedID: null, // Fallback bedID
                        ...pop
                    }));
                }
                return [];
            } catch (e) {
                console.error("Failed to parse adk_pops:", e);
            }
        }
        return [];
    });

    const [gameTime, setGameTime] = useState(() => {
        const saved = localStorage.getItem('adk_gameTime');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    return {
                        day: 1,
                        hour: 8,
                        ...parsed
                    };
                }
            } catch (e) {
                console.error("Failed to parse adk_gameTime in pops:", e);
            }
        }
        return { day: 1, hour: 8 };
    });

    const popIdCounter = useRef(pops.length > 0 ? Math.max(...pops.map(p => p.id)) + 1 : 0);

    const gameTimeRef = useRef(gameTime);
    useEffect(() => {
        gameTimeRef.current = gameTime;
    }, [gameTime]);


    // ⚡ Bolt Optimization: Use refs for frequent states to prevent setInterval from resetting
    const worldRef = useRef(world);
    const unrestRef = useRef(unrest);
    const addLogRef = useRef(addLog);

    useEffect(() => {
        worldRef.current = world;
        unrestRef.current = unrest;
        addLogRef.current = addLog;
    }, [world, unrest, addLog]);

    // Persist pops and gameTime
    useEffect(() => {
        localStorage.setItem('adk_pops', JSON.stringify(pops));
        localStorage.setItem('adk_gameTime', JSON.stringify(gameTime));
    }, [pops, gameTime]);

    // Initialization / Synchronization with World
    useEffect(() => {
        if (stage < 2) return;

        setPops(prevPops => {
            let nextPops = [...prevPops];
            let popsBySettlement = {};

            // Group existing pops by settlement
            nextPops.forEach(p => {
                const key = `${p.settlementCoords.sx},${p.settlementCoords.sy}`;
                if (!popsBySettlement[key]) popsBySettlement[key] = [];
                popsBySettlement[key].push(p);
            });

            worldRef.current.forEach((row, sy) => {
                row.forEach((hex, sx) => {
                    if (hex.status === 2 && hex.settlement) {
                        const key = `${sx},${sy}`;
                        let currentPops = popsBySettlement[key] || [];

                        // Find all houses in the settlement to assign beds
                        let houseLocations = [];
                        hex.settlement.grid.forEach((sRow, gy) => {
                            sRow.forEach((cell, gx) => {
                                if (cell === "houses") {
                                    houseLocations.push({ x: gx, y: gy });
                                }
                            });
                        });

                        // Default hero location (center or random if full)
                        let defaultHome = { x: 2, y: 2 };

                        // For each pop, make sure they have a home/bedID
                        // If they don't have a bed or it's invalid, assign one if available
                        let newCurrentPops = [];
                        let takenBedsLocal = new Set(currentPops.map(p => p.bedId !== undefined && p.homeCoords ? `${p.homeCoords.x},${p.homeCoords.y}-${p.bedId}` : null));
                        for (let i = 0; i < currentPops.length; i++) {
                            let updatedPop = { ...currentPops[i] };
                            const isHouse = updatedPop.homeCoords && hex.settlement.grid[updatedPop.homeCoords.y] && hex.settlement.grid[updatedPop.homeCoords.y][updatedPop.homeCoords.x] === "houses";
                            const isHero = updatedPop.id === 0;

                            if (!isHouse && !isHero && houseLocations.length > 0) {
                                let availableBeds = [];
                                houseLocations.forEach(hl => {
                                    for(let j=0; j<HOUSING_CAPACITY; j++) {
                                        if (!takenBedsLocal.has(`${hl.x},${hl.y}-${j}`)) {
                                            availableBeds.push({ ...hl, bedId: j });
                                        }
                                    }
                                });

                                if (availableBeds.length > 0) {
                                    const bed = availableBeds[Math.floor(Math.random() * availableBeds.length)];
                                    updatedPop.homeCoords = { x: bed.x, y: bed.y };
                                    updatedPop.bedId = bed.bedId;
                                    takenBedsLocal.add(`${bed.x},${bed.y}-${bed.bedId}`);
                                }
                            }
                            newCurrentPops.push(updatedPop);
                        }
                        currentPops = newCurrentPops;

                        // Add Hero if first settlement and no pops exist
                        if (currentPops.length === 0 && ruler) {
                            currentPops.push({
                                id: popIdCounter.current++,
                                name: ruler.name || NAMES[Math.floor(Math.random() * NAMES.length)],
                                settlementCoords: { sx, sy },
                                homeCoords: defaultHome,
                                workCoords: { x: Math.floor(Math.random() * 5), y: Math.floor(Math.random() * 5) },
                                currentCoords: defaultHome,
                                state: 'home',
                                dialogue: null,
                                dialogueTimer: 0,
                                isHero: true
                            });
                        }

                        // We do NOT spawn new pops instantly based on expectedPopCount anymore.
                        // Organic Growth will handle immigration.
                        // However, we still truncate if there are somehow more pops than housing allows (unlikely unless houses were destroyed).
                        const maxPops = Math.max(1, hex.settlement.resLots * HOUSING_CAPACITY); // At least 1 for hero/camp
                        if (currentPops.length > maxPops && maxPops > 0) {
                             // Note: In Dwarf Fortress style we probably wouldn't delete them, they'd become homeless.
                             // But to keep it simple and match previous logic:
                             // currentPops = currentPops.slice(0, maxPops);
                        }

                        popsBySettlement[key] = currentPops;
                    }
                });
            });

            // Reconstruct flat array
            let updatedPops = [];
            Object.values(popsBySettlement).forEach(pArr => updatedPops.push(...pArr));
            return updatedPops;
        });

    }, [world, stage, HOUSING_CAPACITY, ruler]);

    // The Action Loop & Time Engine
    useEffect(() => {
        if (stage < 2) return;

        const interval = setInterval(() => {
            const currentHour = gameTimeRef.current.hour || 0;
            const currentDay = gameTimeRef.current.day || 1;

            let nextHour = currentHour + 1;
            let nextDay = currentDay;
            if (nextHour >= 24) {
                nextHour = 0;
                nextDay++;
            }
            const nextGameTime = { ...gameTimeRef.current, day: nextDay, hour: nextHour };

            // Instantly update ref so next interval tick has it if React batches slowly
            gameTimeRef.current = nextGameTime;

            // Update states side-by-side instead of nesting to prevent synchronous re-render thrashing
            setGameTime(nextGameTime);

            setPops(prevPops => {
                let nextPops = prevPops.map(pop => {
                        let nextPop = { ...pop };

                        // 1. Dialogue Engine
                        if (nextPop.dialogueTimer > 0) {
                            nextPop.dialogueTimer--;
                            if (nextPop.dialogueTimer <= 0) {
                                nextPop.dialogue = null;
                            }
                        } else if (Math.random() < DIALOGUE_CHANCE) {
                            let messages = [];
                            if (nextPop.state === 'Sleeping') messages = ["Zzz...", "..."];
                            else if (nextPop.state === 'home') messages = ["Resting...", "Home sweet home.", "Reading."];
                            else if (nextPop.state === 'working') messages = ["Work work.", "Hard at work.", "Building the kingdom."];
                            else if (nextPop.state === 'commuting_to_work') messages = ["Off to work.", "Morning commute.", "Late again!"];
                            else if (nextPop.state === 'commuting_to_home') messages = ["Heading home.", "Long day.", "Finally done."];

                            if (messages.length > 0) {
                                nextPop.dialogue = messages[Math.floor(Math.random() * messages.length)];
                                nextPop.dialogueTimer = 3;
                            }
                        }

                        // Circadian Rhythm
                        const isNight = nextGameTime.hour >= 22 || nextGameTime.hour < 6;

                        // 2. State Transitions & Pathfinding
                        if (isNight) {
                            if (nextPop.state !== 'Sleeping' && nextPop.state !== 'commuting_to_home') {
                                nextPop.state = 'commuting_to_home';
                            }
                        } else {
                            if (nextPop.state === 'Sleeping') {
                                nextPop.state = 'home';
                                nextPop.dialogue = "Morning!";
                                nextPop.dialogueTimer = 3;
                            }
                        }

                        if (nextPop.state === 'home' && !isNight) {
                            if (Math.random() < STATE_CHANGE_CHANCE) {
                                nextPop.state = 'commuting_to_work';
                            }
                        } else if (nextPop.state === 'working' && !isNight) {
                            if (Math.random() < STATE_CHANGE_CHANCE) {
                                nextPop.state = 'commuting_to_home';
                            }
                        }

                        if (nextPop.state === 'commuting_to_work') {
                            let dx = Math.sign(nextPop.workCoords.x - nextPop.currentCoords.x);
                            let dy = Math.sign(nextPop.workCoords.y - nextPop.currentCoords.y);

                            if (dx !== 0) {
                                nextPop.currentCoords.x += dx;
                            } else if (dy !== 0) {
                                nextPop.currentCoords.y += dy;
                            } else {
                                nextPop.state = 'working';
                            }
                        } else if (nextPop.state === 'commuting_to_home') {
                            let dx = Math.sign(nextPop.homeCoords.x - nextPop.currentCoords.x);
                            let dy = Math.sign(nextPop.homeCoords.y - nextPop.currentCoords.y);

                            if (dx !== 0) {
                                nextPop.currentCoords.x += dx;
                            } else if (dy !== 0) {
                                nextPop.currentCoords.y += dy;
                            } else {
                                nextPop.state = isNight ? 'Sleeping' : 'home';
                            }
                        }

                        return nextPop;
                    });

                    // Organic Growth check every 24 hours (at hour 0)
                    if (nextGameTime.hour === 0) {
                        let totalPops = nextPops.length;

                        // ⚡ Bolt Optimization: Precompute population by settlement coordinate
                        const popsByCoord = {};
                        nextPops.forEach(p => {
                            const key = `${p.settlementCoords.sx}-${p.settlementCoords.sy}`;
                            popsByCoord[key] = (popsByCoord[key] || 0) + 1;
                        });

                        // Calculate total housing capacity across the world
                        let totalHousing = 0;
                        let targetSettlement = null;
                        worldRef.current.forEach((row, sy) => {
                            row.forEach((hex, sx) => {
                                if (hex.status === 2 && hex.settlement) {
                                    const capacity = hex.settlement.resLots * HOUSING_CAPACITY;
                                    totalHousing += capacity;
                                    const localPopCount = popsByCoord[`${sx}-${sy}`] || 0;
                                    if (capacity > localPopCount) {
                                        targetSettlement = { sx, sy, settlement: hex.settlement };
                                    }
                                }
                            });
                        });

                        // Ensure at least 1 capacity for the camp if it has 0 resLots but is a settlement
                        if (totalHousing === 0 && targetSettlement) {
                             totalHousing = 1;
                        }

                        const roll = Math.random();
                        console.log("Immigration Check:", { currentPop: totalPops, maxPop: totalHousing, roll });
                        if (totalPops < totalHousing && (unrestRef.current || 0) < 10) {
                            if (roll < 0.20 && targetSettlement) { // 20% chance
                                const settlersCount = Math.random() < 0.5 ? 1 : 2;
                                const actualCount = Math.min(settlersCount, totalHousing - totalPops);

                                for(let i=0; i<actualCount; i++) {
                                    // Find an available bed/home
                                    let houseLocations = [];
                                    targetSettlement.settlement.grid.forEach((sRow, gy) => {
                                        sRow.forEach((cell, gx) => {
                                            if (cell === "houses") houseLocations.push({ x: gx, y: gy });
                                        });
                                    });

                                    let newHome = { x: 2, y: 2 };
                                    let newBedId = 0;

                                    if (houseLocations.length > 0) {
                                        let availableBeds = [];
                                        houseLocations.forEach(hl => {
                                            for(let j=0; j<HOUSING_CAPACITY; j++) {
                                                availableBeds.push({ ...hl, bedId: j });
                                            }
                                        });
                                        const takenBeds = nextPops.map(p => p.bedId !== undefined ? `${p.homeCoords.x},${p.homeCoords.y}-${p.bedId}` : null);
                                        availableBeds = availableBeds.filter(b => !takenBeds.includes(`${b.x},${b.y}-${b.bedId}`));

                                        if (availableBeds.length > 0) {
                                            const bed = availableBeds[Math.floor(Math.random() * availableBeds.length)];
                                            newHome = { x: bed.x, y: bed.y };
                                            newBedId = bed.bedId;
                                        } else {
                                            const h = houseLocations[Math.floor(Math.random() * houseLocations.length)];
                                            newHome = { x: h.x, y: h.y };
                                        }
                                    }

                                    const newPop = {
                                        id: popIdCounter.current++,
                                        name: NAMES[Math.floor(Math.random() * NAMES.length)],
                                        settlementCoords: { sx: targetSettlement.sx, sy: targetSettlement.sy },
                                        homeCoords: newHome,
                                        bedId: newBedId,
                                        workCoords: { x: Math.floor(Math.random() * 5), y: Math.floor(Math.random() * 5) },
                                        currentCoords: { x: 2, y: 4 }, // Spawn at edge
                                        state: 'commuting_to_home',
                                        dialogue: "New arrival!",
                                        dialogueTimer: 5
                                    };
                                    nextPops.push(newPop);
                                }
                                if (addLogRef.current && actualCount > 0) {
                                    // setTimeout so we don't trigger a warning about updating another component while rendering
                                    setTimeout(() => addLogRef.current(`[+] Word of mouth brings ${actualCount} new settler(s) to the kingdom!`), 0);
                                }
                            }
                        }
                    }

                    return nextPops;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [stage]);

    return { pops, gameTime };
};
