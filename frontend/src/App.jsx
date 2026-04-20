import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Terminal, Map as MapIcon, Home, Compass, User, AlertCircle, Building, TreePine, Hammer, Menu, Apple, Gem, Coins, Lock, Info } from 'lucide-react';
import { RECON_COST, CLAIM_COST, ANNUAL_UPKEEP, HOUSING_CAPACITY, FLAVORS, STRUCTURES_DB, PROMINENT_CITIZENS, KINGMAKER_BACKGROUNDS } from './library';
import { usePopulationEngine } from './hooks/usePopulationEngine';
import ProgressBar from './ProgressBar';
import BuildMenu from './components/BuildMenu';
import HeroSelection from './components/HeroSelection';
import GameMenu from './components/GameMenu';
import WorldGrid from './components/WorldGrid';
import SettlementGrid from './components/SettlementGrid';

// --- REACT COMPONENT: APP ---
// This is the root component containing all logic, state, and UI rendering for the Kingdom Simulator.
const App = () => {
    // --- GAME STATE & LOCALSTORAGE ---
    // All crucial variables persist via lazy initializers reading from localStorage.
    // This ensures refreshing the browser doesn't wipe progress.
    // `stage`: Controls progression (1: Awakening, 2: Survival, 3: Expansion, 4: Charter/World Map).
    const [stage, setStage] = useState(() => {
        const saved = localStorage.getItem('adk_stage');
        const parsed = saved !== null ? parseInt(saved) : 0;
        return isNaN(parsed) ? 0 : parsed;
    });

    const [unlockedTechs, setUnlockedTechs] = useState(() => {
        const saved = localStorage.getItem('adk_unlockedTechs');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                console.error("Failed to parse adk_unlockedTechs:", e);
            }
        }
        return [];
    });

    const [sticks, setSticks] = useState(() => {
        const saved = localStorage.getItem('adk_sticks');
        const parsed = saved !== null ? parseInt(saved) : 0;
        return isNaN(parsed) ? 0 : parsed;
    });

    const [isGatheringSticks, setIsGatheringSticks] = useState(false);
    const [gatherProgress, setGatherProgress] = useState(0);

    const [isGatheringTimber, setIsGatheringTimber] = useState(false);
    const [gatherTimberProgress, setGatherTimberProgress] = useState(0);

    const [isGatheringStone, setIsGatheringStone] = useState(false);
    const [gatherStoneProgress, setGatherStoneProgress] = useState(0);

    const [isHunting, setIsHunting] = useState(false);
    const [huntProgress, setHuntProgress] = useState(0);

    const [isHelpingBuild, setIsHelpingBuild] = useState(false);
    const isRulerBusy = isGatheringSticks || isGatheringTimber || isGatheringStone || isHunting || isHelpingBuild;
    const [helpBuildProgress, setHelpBuildProgress] = useState(0);

    const [timber, setTimber] = useState(() => {
        const saved = localStorage.getItem('adk_timber');
        const parsed = saved !== null ? parseInt(saved) : 0;
        return isNaN(parsed) ? 0 : parsed;
    });

    const [rations, setRations] = useState(() => {
        const saved = localStorage.getItem('adk_rations');
        const parsed = saved !== null ? parseInt(saved) : 0;
        return isNaN(parsed) ? 0 : parsed;
    });

    // `logs`: The main event ledger. Acts as the user's primary feedback mechanism instead of console.logs.
    const [logs, setLogs] = useState(() => {
        const saved = localStorage.getItem('adk_logs');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                console.error("Failed to parse adk_logs:", e);
            }
        }
        return ["[!] Expedition landed in the Stolen Lands. Awaiting orders to establish camp."];
    });

    // `bp` (Build Points): The kingdom's main currency. Cannot drop below 0.
    const [bp, setBp] = useState(() => {
        const saved = localStorage.getItem('adk_bp');
        const parsed = saved !== null ? parseInt(saved) : 60;
        return isNaN(parsed) ? 60 : parsed;
    });

    const [stone, setStone] = useState(() => {
        const saved = localStorage.getItem('adk_stone');
        const parsed = saved !== null ? Number(saved) : 0;
        return isNaN(parsed) ? 0 : parsed;
    });

    // `gameTime`: Tracks elapsed time in days, months, years, and hours.
    const [gameTime, setGameTime] = useState(() => {
        const saved = localStorage.getItem('adk_gameTime');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return {
                    day: 1,
                    month: 1,
                    year: 4710,
                    hour: 0,
                    ...parsed
                };
            } catch (e) {
                console.error("Failed to parse adk_gameTime:", e);
            }
        }
        return { day: 1, month: 1, year: 4710, hour: 0 };
    });

    // `unrest`: High unrest triggers negative events. Decreased by specific structures (e.g., Castle).
    const [unrest, setUnrest] = useState(() => {
        const saved = localStorage.getItem('adk_unrest');
        const parsed = saved !== null ? parseInt(saved) : 0;
        return isNaN(parsed) ? 0 : parsed;
    });

    // `xp`: Kingdom Experience. Awarded for claiming hexes and surviving annual upkeeps.
    const [tickCount, setTickCount] = useState(0);

    const [xp, setXp] = useState(() => {
        const saved = localStorage.getItem('adk_xp');
        const parsed = saved !== null ? parseInt(saved) : 0;
        return isNaN(parsed) ? 0 : parsed;
    });

    const [constructionQueue, setConstructionQueue] = useState(() => {
        const saved = localStorage.getItem('adk_constructionQueue');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                console.error("Failed to parse adk_constructionQueue:", e);
            }
        }
        return [];
    });

    // `world`: The 10x10 hex grid. Represents the Stolen Lands. Generated once and saved.
    const [world, setWorld] = useState(() => {
        const saved = localStorage.getItem('adk_world');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    return parsed.map(row => {
                        if (Array.isArray(row)) {
                            return row.map(hex => ({
                                terrain: 'Plain', // Fallback terrain
                                ...hex
                            }));
                        }
                        return row;
                    });
                }
                return parsed;
            } catch (e) {
                console.error("Failed to parse adk_world:", e);
            }
        }

        // Generate new world
        const terrains = ["Forest", "Plain", "Mountain", "Hill", "Swamp"];
        const pois = ["Ruins", "Resource Node"];
        const newWorld = [];
        for (let y = 0; y < 10; y++) {
            const row = [];
            for (let x = 0; x < 10; x++) {
                row.push({
                    terrain: terrains[Math.floor(Math.random() * terrains.length)],
                    status: 0,
                    settlement: null,
                    poi: null
                });
            }
            newWorld.push(row);
        }

        // Randomly assign 5 POIs
        let poisAssigned = 0;
        while (poisAssigned < 5) {
            let px = Math.floor(Math.random() * 10);
            let py = Math.floor(Math.random() * 10);
            // Don't place on capital (5,5) or if already has POI
            if ((px !== 5 || py !== 5) && newWorld[py][px].poi === null) {
                newWorld[py][px].poi = pois[Math.floor(Math.random() * pois.length)];
                poisAssigned++;
            }
        }

        return newWorld;
    });

    const [currentView, setCurrentView] = useState("world");
    const [flavor, setFlavor] = useState("swamp");
    const [buildMenuTarget, setBuildMenuTarget] = useState(null);
    const [buildMenuCategory, setBuildMenuCategory] = useState(null);
    const [inspectorHex, setInspectorHex] = useState(null);
    const [inspectorPop, setInspectorPop] = useState(null);
    const [inspectorPlot, setInspectorPlot] = useState(null);
    const [bpFlash, setBpFlash] = useState(false);
    const [bpShake, setBpShake] = useState(false);

    // --- VIBE MODE STATE ---
    // Secret Dev Tool: Toggled by clicking the Terminal icon 3 times within 2 seconds.
    const [vibeMode, setVibeMode] = useState(() => {
        const saved = localStorage.getItem('adk_vibeMode');
        return saved ? JSON.parse(saved) : false;
    });
    const terminalClickTimestamps = useRef([]);

    // --- GAME MENU STATE ---
    // Controls the visibility of the absolute positioned dropdown menu in the top right.
    // Toggled by clicking the Menu icon. Defaults to false (hidden).
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Hero Selection State
    const [showHeroSelection, setShowHeroSelection] = useState(() => !localStorage.getItem('adk_ruler'));
    const [ruler, setRuler] = useState(() => {
        const saved = localStorage.getItem('adk_ruler');
        return saved ? JSON.parse(saved) : null;
    });

    // Ref for log auto-scrolling
    const logEndRef = useRef(null);

    const handleTerminalClick = () => {
        const now = Date.now();
        terminalClickTimestamps.current = terminalClickTimestamps.current.filter(t => now - t <= 2000);
        terminalClickTimestamps.current.push(now);

        if (terminalClickTimestamps.current.length === 3) {
            setVibeMode(prev => {
                const newVibe = !prev;
                if (newVibe) {
                    addLog("[!] RAD: Vibe Mode Enabled. The Muse is watching.");
                } else {
                    addLog("[!] Vibe Mode Disabled.");
                }
                return newVibe;
            });
            terminalClickTimestamps.current = [];
        }
    };

    const addLog = React.useCallback((msg) => {
        setLogs(prev => [...prev.slice(-19), msg]);
    }, []);


    const { pops } = usePopulationEngine(world, stage, HOUSING_CAPACITY, unrest, ruler, addLog);
    const handleGatherSticks = () => {
        if (isRulerBusy) return;
        setIsGatheringSticks(true);
        setGatherProgress(0);

        const interval = setInterval(() => {
            setTickCount(prev => prev + 1);
            setGatherProgress(prev => {
                if (prev >= 99) {
                    clearInterval(interval);
                    setIsGatheringSticks(false);
                    if (ruler && Math.random() < (ruler.failMod || 0.1)) {
                        addLog("[!] Your lack of experience caused a setback. No resources gained.");
                    } else {
                        setSticks(s => s + 1);
                        addLog("[+] Gathered a stick from the freezing dark.");
                    }
                    return 100;
                }
                return prev + 1;
            });
        }, 50);
    };

    const handleGatherStone = () => {
        if (isRulerBusy) return;
        setIsGatheringStone(true);
        setGatherStoneProgress(0);

        const interval = setInterval(() => {
            setGatherStoneProgress(prev => {
                if (prev >= 99) {
                    clearInterval(interval);
                    setIsGatheringStone(false);
                    if (ruler && Math.random() < (ruler.failMod || 0.1)) {
                        addLog("[!] Your lack of experience caused a setback. No resources gained.");
                    } else {
                        setStone(s => s + 1);
                        addLog("[+] Gathered stone.");
                    }
                    return 100;
                }
                return prev + 1;
            });
        }, 80);
    };

    const handleGatherTimber = () => {
        if (isRulerBusy) return;
        setIsGatheringTimber(true);
        setGatherTimberProgress(0);

        const interval = setInterval(() => {
            setGatherTimberProgress(prev => {
                if (prev >= 99) {
                    clearInterval(interval);
                    setIsGatheringTimber(false);
                    if (ruler && Math.random() < (ruler.failMod || 0.1)) {
                        addLog("[!] Your lack of experience caused a setback. No resources gained.");
                    } else {
                        setTimber(t => t + 1);
                        addLog("[+] Gathered timber.");
                    }
                    return 100;
                }
                return prev + 1;
            });
        }, 50);
    };

    const handleHuntRations = () => {
        if (isRulerBusy) return;
        setIsHunting(true);
        setHuntProgress(0);

        const interval = setInterval(() => {
            setHuntProgress(prev => {
                if (prev >= 99) {
                    clearInterval(interval);
                    setIsHunting(false);
                    if (ruler && Math.random() < (ruler.failMod || 0.1)) {
                        addLog("[!] Your lack of experience caused a setback. No resources gained.");
                    } else {
                        setRations(r => r + 1);
                        addLog("[+] Hunted for rations.");
                    }
                    return 100;
                }
                return prev + 1;
            });
        }, 50);
    };

    const handleHelpBuild = () => {
        if (isRulerBusy || constructionQueue.length === 0) return;
        setIsHelpingBuild(true);
        setHelpBuildProgress(0);

        const interval = setInterval(() => {
            setHelpBuildProgress(prev => {
                if (prev >= 99) {
                    clearInterval(interval);
                    setIsHelpingBuild(false);
                    if (ruler && Math.random() < (ruler.failMod || 0.1)) {
                        addLog("[!] Your lack of experience caused a setback. No progress made.");
                    } else {
                        setConstructionQueue(prevQueue => {
                            const newQueue = [...prevQueue];
                            if (newQueue.length > 0) {
                                newQueue[0] = { ...newQueue[0], progress: newQueue[0].progress + 2 };
                            }
                            return newQueue;
                        });
                        addLog("[+] You rolled up your sleeves and helped speed up construction.");
                    }
                    return 100;
                }
                return prev + 1;
            });
        }, 50);
    };

    // Save State
    useEffect(() => {
        localStorage.setItem('adk_stage', stage);
        localStorage.setItem('adk_sticks', sticks);
        localStorage.setItem('adk_timber', timber);
        localStorage.setItem('adk_rations', rations);
        localStorage.setItem('adk_logs', JSON.stringify(logs));
        localStorage.setItem('adk_bp', bp);
        localStorage.setItem('adk_stone', stone);
        localStorage.setItem('adk_unrest', unrest);
        localStorage.setItem('adk_xp', xp);
        localStorage.setItem('adk_gameTime', JSON.stringify(gameTime));
        localStorage.setItem('adk_world', JSON.stringify(world));
        localStorage.setItem('adk_constructionQueue', JSON.stringify(constructionQueue));
        localStorage.setItem('adk_unlockedTechs', JSON.stringify(unlockedTechs));
        if (ruler) {
            localStorage.setItem('adk_ruler', JSON.stringify(ruler));
        }
    }, [stage, sticks, timber, rations, stone, logs, bp, unrest, xp, tickCount, world, constructionQueue, ruler, unlockedTechs]);

    // Simulation Advisors
    const [advisors, setAdvisors] = useState({
        Treasurer: { name: "Jubilost", attribute: 16 },
        General: { name: "Amiri", attribute: 14 }
    });

    // Background Tick (every 1 second = 1 hour)
    useEffect(() => {
        if (stage < 3 || showHeroSelection) return;

        const interval = setInterval(() => {
            setGameTime(prev => {
                let { day, month, year, hour } = prev;
                hour += 1;
                if (hour >= 24) {
                    hour = 0;
                    day += 1;
                    if (day > 30) {
                        day = 1;
                        month += 1;
                        if (month > 12) {
                            month = 1;
                            year += 1;
                        }
                    }
                }
                return { day, month, year, hour };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [stage, showHeroSelection]);

    // Pre-compute expensive world stats in one pass
    // This avoids O(N*M) nested loops on every re-render and tick
    const worldStats = useMemo(() => {
        const stats = {
            structureCounts: {},
            swampClaimed: false,
            totalPop: 0
        };

        if (stage < 2) return stats;

        world.forEach(row => {
            row.forEach(hex => {
                if (hex.status === 2) {
                    if (hex.terrain.toLowerCase() === "swamp") {
                        stats.swampClaimed = true;
                    }
                    if (hex.settlement) {
                        // We use pops.length for total pop now, but keeping this for logging if needed
                        hex.settlement.grid.forEach(sRow => {
                            sRow.forEach(cell => {
                                if (cell) {
                                    const name = cell.toLowerCase();
                                    stats.structureCounts[name] = (stats.structureCounts[name] || 0) + 1;
                                }
                            });
                        });
                    }
                }
            });
        });
        return stats;
    }, [world, stage]);

    const totalPop = pops.length;

    // Handle Completed Constructions (Side-Effects)
    useEffect(() => {
        const completedJobs = constructionQueue.filter(job => job.progress >= job.requiredProgress);

        if (completedJobs.length > 0) {
            setWorld(prevWorld => {
                const nextWorld = [...prevWorld];
                completedJobs.forEach(job => {
                    const { sx, sy, structureName, isRes, lotsNeeded, positionsToFill } = job;
                    if (nextWorld[sy][sx].settlement) {
                        const newSettlement = {
                            ...nextWorld[sy][sx].settlement,
                            grid: nextWorld[sy][sx].settlement.grid.map(row => [...row])
                        };

                        positionsToFill.forEach(([px, py]) => {
                            newSettlement.grid[py][px] = structureName;
                        });

                        if (isRes) newSettlement.resLots += lotsNeeded;
                        else newSettlement.otherLots += lotsNeeded;

                        nextWorld[sy][sx] = { ...nextWorld[sy][sx], settlement: newSettlement };
                    }
                });
                return nextWorld;
            });

            completedJobs.forEach(job => {
                addLog(`[+] Construction complete: ${job.structureName}.`);
                if (stage === 2 && job.structureName === "houses") {
                    setStage(3);
                    addLog("[!] Citizens arrive and build houses. The Kingdom expands!");
                }
            });

            // Clean up completed jobs
            setConstructionQueue(prevQueue => prevQueue.filter(job => job.progress < job.requiredProgress));
        }
    }, [constructionQueue, stage]);

    // Construction Loop (every 1 second)
    useEffect(() => {
        if (stage < 2) return; // Settlements don't exist before stage 2

        const interval = setInterval(() => {
            setConstructionQueue(prevQueue => {
                if (prevQueue.length === 0) return prevQueue;

                const assignedPops = 0; // Pops assigned to jobs/gatherers (to be implemented)
                let availableBuilders = totalPop === 0 ? 1 : Math.max(0, totalPop - assignedPops);

                return prevQueue.map(job => {
                    if (availableBuilders > 0 && job.progress < job.requiredProgress) {
                        availableBuilders -= 1;
                        return { ...job, active: true, progress: job.progress + 1 };
                    }
                    return { ...job, active: false };
                });
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [stage, totalPop]);

    // Prominent Citizens Observer
    const [spawnedCitizens, setSpawnedCitizens] = useState(new Set());

    useEffect(() => {
        if (stage < 2) return; // World not generated yet

        const checkProminentCitizens = () => {
            let newSpawned = new Set(spawnedCitizens);
            let spawnedAny = false;

            const getStructureCount = (name) => {
                const targetStructure = name.toLowerCase();
                const count = worldStats.structureCounts[targetStructure] || 0;
                const lots = STRUCTURES_DB[targetStructure] ? STRUCTURES_DB[targetStructure].lots : 1;
                return Math.floor(count / lots);
            };

            PROMINENT_CITIZENS.forEach(citizen => {
                if (newSpawned.has(citizen.name)) return;

                let conditionsMet = false;
                const trigger = citizen.trigger;

                if (trigger === "Kingdom founded" && stage >= 3) {
                    conditionsMet = true;
                } else if (trigger === "Build a Pier") {
                    conditionsMet = getStructureCount("pier") >= 1;
                } else if (trigger === "Build a Lumberyard") {
                    conditionsMet = getStructureCount("lumberyard") >= 1;
                } else if (trigger === "Build a Manor/Craft Luxuries") {
                    conditionsMet = getStructureCount("manor") >= 1;
                } else if (trigger === "Build an Academy or Museum") {
                    conditionsMet = getStructureCount("academy") >= 1 || getStructureCount("museum") >= 1;
                } else if (trigger === "Build a Noble Villa") {
                    conditionsMet = getStructureCount("noble villa") >= 1;
                } else if (trigger === "Build 3 Breweries") {
                    conditionsMet = getStructureCount("brewery") >= 3;
                } else if (trigger === "Kingdom Level 17") {
                    conditionsMet = false; // No level concept yet, ignoring
                } else if (trigger === "Claim a swamp hex") {
                    conditionsMet = worldStats.swampClaimed;
                } else if (trigger === "Random Event") {
                    conditionsMet = Math.random() < 0.05;
                }

                if (conditionsMet) {
                    newSpawned.add(citizen.name);
                    spawnedAny = true;
                    addLog(`[*] PROMINENT CITIZEN ARRIVES: ${citizen.name}, ${citizen.title}. Quest: ${citizen.quest}`);
                }
            });

            if (spawnedAny) {
                setSpawnedCitizens(newSpawned);
            }
        };

        checkProminentCitizens();
    }, [gameTime.hour, stage, worldStats, spawnedCitizens]);

    // Handle Tick Side Effects (Every Day and Year)
    useEffect(() => {
        if (stage < 3) return;

        if (gameTime.hour === 0) {
            let treasurerBonus = 0;
            if (advisors.Treasurer) {
                treasurerBonus = Math.floor((advisors.Treasurer.attribute || 0) / 4);
            }

            // Daily Production Calculation
            let dailyTimber = 0;
            let dailyRations = 0;
            let dailyStone = 0;

            // worldStats.structureCounts counts cells, so we divide by lots to get structure count.
            Object.entries(worldStats.structureCounts).forEach(([structName, cellCount]) => {
                const structData = STRUCTURES_DB[structName];
                if (structData && structData.production) {
                    const actualCount = Math.floor(cellCount / structData.lots);
                    if (structData.production.timber) dailyTimber += structData.production.timber * actualCount;
                    if (structData.production.rations) dailyRations += structData.production.rations * actualCount;
                    if (structData.production.stone) dailyStone += structData.production.stone * actualCount;
                }
            });

            if (dailyTimber > 0) setTimber(t => t + dailyTimber);
            if (dailyRations > 0) setRations(r => r + dailyRations);
            if (dailyStone > 0) setStone(s => s + dailyStone);

            if (dailyTimber > 0 || dailyRations > 0 || dailyStone > 0) {
                addLog(`[+] Daily Yield: +${dailyTimber} Timber, +${dailyRations} Rations, +${dailyStone} Stone`);
            }

            if (gameTime.day === 1) {
                // Monthly BP bonus from treasurer
                setBp(currentBp => currentBp + treasurerBonus);
            }

            if (gameTime.day === 1 && gameTime.month === 1 && gameTime.year > 4710) {
                // Annual Upkeep
                setBp(currentBp => currentBp - ANNUAL_UPKEEP);
                addLog(`[-] Annual Upkeep: Paid ${ANNUAL_UPKEEP} BP.`);

                const expectedBp = bp + treasurerBonus - ANNUAL_UPKEEP;
                if (expectedBp < 0) {
                    setUnrest(u => u + 1);
                    addLog("[!] Debt causes unrest!");
                }
            }
        }

    }, [gameTime.hour, gameTime.day, gameTime.month, gameTime.year]);

    const [treasurerWarning, setTreasurerWarning] = useState(null);

    // Visual Feedback Hook: Treasurer's Gavel (Flash BP total on spend)
    useEffect(() => {
        setBpFlash(true);
        const timer = setTimeout(() => setBpFlash(false), 500);
        return () => clearTimeout(timer);
    }, [bp]);

    const confirmPurchase = () => {
        if (treasurerWarning) {
            treasurerWarning.action();
            setTreasurerWarning(null);
        }
    };

    const cancelPurchase = () => {
        addLog("[-] Treasurer: 'A wise choice to hold our funds, my liege.'");
        setTreasurerWarning(null);
    };

    const handleAction = (cost, name, action) => {
        if (bp < cost) {
            addLog(`[-] Treasurer: 'We cannot afford ${name}! Cost: ${cost} BP, Have: ${bp} BP.'`);
            setBpShake(true);
            setTimeout(() => setBpShake(false), 500);
            return;
        }
        if (bp - cost < 15) {
            setTreasurerWarning({ cost, name, action });
            return;
        }
        action();
    };

    const handleReconnoiter = (x, y) => {
        if (stage < 2) return;
        handleAction(RECON_COST, "recon", () => {
            const newWorld = [...world];
            if (newWorld[y][x].status === 0) {
                newWorld[y][x].status = 1;
                setBp(prev => prev - RECON_COST);
                setWorld(newWorld);
                addLog(`[+] Reconnoitered (${x},${y}). It is a ${newWorld[y][x].terrain}.`);
                if (newWorld[y][x].poi) {
                    addLog(`[*] Discovery: Found ${newWorld[y][x].poi} at (${x},${y})!`);
                }
            } else {
                addLog("[!] That area is already mapped.");
            }
        });
    };

    const handleClaim = (x, y) => {
        if (stage < 2) return;
        handleAction(CLAIM_COST, "claim", () => {
            const newWorld = [...world];
            if (newWorld[y][x].status === 1) {
                newWorld[y][x].status = 2;
                newWorld[y][x].settlement = { name: "New Settlement", grid: Array(5).fill(null).map(() => Array(5).fill(null)), resLots: 0, otherLots: 0, pathValues: Array(5).fill(0).map(() => Array(5).fill(0)) };
                setBp(prev => prev - CLAIM_COST);
                setXp(prev => prev + 10);
                setWorld(newWorld);
                addLog(`[+] Claimed (${x},${y}). Kingdom Size +1.`);
            } else {
                addLog("[!] You must map this area before claiming it!");
            }
        });
    };

    const handleBuild = (structureName, x, y) => {
        if (currentView === "world") {
            addLog("[!] You must be viewing a settlement to build.");
            return;
        }
        const [sx, sy] = currentView.split(',').map(Number);
        const newWorld = [...world];
        const settlement = newWorld[sy][sx].settlement;

        if (!settlement) {
            addLog("[!] No settlement exists here.");
            return;
        }

        const structure = STRUCTURES_DB[structureName];
        if (!structure) {
            addLog(`[-] Unknown structure: ${structureName}`);
            return;
        }

        const cost_timber = structure.cost_timber || 0;
        const cost_rations = structure.cost_rations || 0;
        const cost_stone = structure.cost_stone || 0;
        const cost_bp = structure.cost_bp || 0;

        if (timber < cost_timber || rations < cost_rations || stone < cost_stone || bp < cost_bp) {
            addLog(`[-] Cannot afford ${structureName}. Need: ${cost_timber} Timber, ${cost_rations} Rations, ${cost_stone} Stone, ${cost_bp} BP.`);
            return;
        }

        const refundResources = () => {
            setTimber(t => t + cost_timber);
            setRations(r => r + cost_rations);
            setStone(s => s + cost_stone);
        };

        handleAction(cost_bp, structureName, () => {
            setTimber(t => t - cost_timber);
            setRations(r => r - cost_rations);
            setStone(s => s - cost_stone);

            const lotsNeeded = structure.lots;
            let positionsToFill = [];

            const isBlocked = (cx, cy) => {
                if (cx < 0 || cx >= 5 || cy < 0 || cy >= 5) return true;
                if (settlement.grid[cy][cx] !== null) return true;
                return constructionQueue.some(job =>
                    job.sx === sx && job.sy === sy && job.positionsToFill.some(p => p[0] === cx && p[1] === cy)
                );
            };

            if (lotsNeeded === 1) {
                if (isBlocked(x, y)) {
                    addLog(`[-] Cannot build at ${x},${y}: Space is blocked or out of bounds.`);
                    refundResources();
                    return;
                }
                positionsToFill.push([x, y]);
            } else if (lotsNeeded === 2) {
                let horizontalClear = !isBlocked(x, y) && !isBlocked(x + 1, y);

                if (horizontalClear) {
                    positionsToFill = [[x, y], [x + 1, y]];
                } else {
                    let verticalClear = !isBlocked(x, y) && !isBlocked(x, y + 1);

                    if (verticalClear) {
                        positionsToFill = [[x, y], [x, y + 1]];
                    } else {
                        addLog(`[-] Cannot build ${structureName} at ${x},${y}: Need 2 contiguous lots.`);
                        refundResources();
                        return;
                    }
                }
            } else if (lotsNeeded === 4) {
                if (isBlocked(x, y) || isBlocked(x + 1, y) || isBlocked(x, y + 1) || isBlocked(x + 1, y + 1)) {
                    addLog(`[-] Cannot build ${structureName} at ${x},${y}: 2x2 area is not clear or goes out of bounds.`);
                    refundResources();
                    return;
                }
                positionsToFill = [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]];
            }

            const isRes = structure.traits.includes("residential");

            // We calculate construction time roughly based on material costs
            const totalMaterials = cost_timber + cost_rations + cost_stone;
            const requiredProgress = totalMaterials > 0 ? totalMaterials : 10;

            const newJob = {
                id: Date.now(),
                structureName,
                x,
                y,
                sx,
                sy,
                progress: 0,
                requiredProgress: Math.max(10, Math.floor((cost_timber + cost_rations + cost_stone) / 2)),
                positionsToFill,
                active: false,
                isRes,
                lotsNeeded
            };

            setConstructionQueue(prev => [...prev, newJob]);
            addLog(`[*] Started construction of ${structureName} at ${x},${y}.`);
        });
    };


    // Auto-scroll logs
    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs]);

    const closeBuildMenu = () => {
        setBuildMenuTarget(null);
        setBuildMenuCategory(null);
    };

    const renderHeroSelection = () => {
        if (!showHeroSelection) return null;

        return (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 border-2 border-yellow-500 p-6 max-w-2xl w-full max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-yellow-400">Choose your Background</h2>
                    </div>
                    <p className="text-gray-300 mb-6 italic">Who shall rule these lands?</p>

                    <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
                        {KINGMAKER_BACKGROUNDS.map((bg, index) => (
                            <div
                                key={index}
                                onClick={() => {
                                    setRuler(bg);
                                    setShowHeroSelection(false);
                                    // Set stage to 0 to start the "Dark Room" gathering sequence
                                    setStage(0);
                                    addLog(`[+] You remember your past as a ${bg.name}... but right now, you are alone in the freezing dark.`);
                                }}
                                className="bg-black border border-gray-700 p-4 hover:border-yellow-400 cursor-pointer transition-colors"
                            >
                                <div className="font-bold text-white text-lg">{bg.name}</div>
                                <div className="text-sm text-cyan-400 mt-1">Skill: {bg.skill} | Bonus: +1 {bg.attribute}</div>
                                <div className="text-sm text-gray-400 mt-2">{bg.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };


    // --- RENDER GAME MENU ---
    // This function creates a fixed/absolute positioned overlay in the top right corner.
    // It provides system-level controls to the user, such as restarting the game or
    // accessing debug shortcuts for rapid testing.
    const renderGameMenu = () => {
        return (
            // Position the wrapper in the absolute top right corner. z-50 ensures it floats above the main UI.
            <div className="absolute top-4 right-4 z-50">
                {/*
                  Menu Toggle Button
                  Clicking this button toggles the boolean `isMenuOpen` state.
                  It displays the imported `Menu` icon from lucide-react.
                */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-white transition-colors"
                    aria-label="Toggle Game Menu"
                >
                    <Menu size={24} />
                </button>

                {/*
                  Conditional Dropdown
                  If `isMenuOpen` is true, render the dropdown menu containing the options.
                */}
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-600 rounded shadow-xl flex flex-col p-2 gap-2">
                        {/*
                          Option 1: Restart Game
                          This button iterates through all items in localStorage.
                          Any key starting with the prefix 'adk_' is removed to clear the kingdom simulator's saved state.
                          After clearing, it calls window.location.reload() to forcefully refresh the application
                          and re-initialize all default states.
                        */}
                        <button
                            onClick={() => {
                                // Iterate backwards or gather keys first to safely remove while iterating.
                                const keysToRemove = [];
                                for (let i = 0; i < localStorage.length; i++) {
                                    const key = localStorage.key(i);
                                    if (key && key.startsWith('adk_')) {
                                        keysToRemove.push(key);
                                    }
                                }
                                // Remove all gathered 'adk_' prefixed keys.
                                keysToRemove.forEach(k => localStorage.removeItem(k));
                                // Reload the window to guarantee a clean slate.
                                window.location.reload();
                            }}
                            className="w-full text-left p-2 hover:bg-red-900 text-red-400 font-bold border border-transparent hover:border-red-500 rounded transition-colors"
                        >
                            Restart Game
                        </button>

                        {/*
                          Option 2: Debug - Skip to Hero Selection
                          This debug shortcut fast-forwards the simulation for testing late-game mechanics.
                          It forces the `stage` to 3, directly shows the Hero Selection screen,
                          closes the menu to clean up the UI, and logs the debug action.
                        */}
                        <button
                            onClick={() => {
                                // Force stage to 3, skipping the early game sequence.
                                setStage(3);
                                // Trigger the hero selection overlay, bypassing the normal population trigger.
                                setShowHeroSelection(true);
                                // Close the game menu after selection to keep the view unobstructed.
                                setIsMenuOpen(false);
                                // Inform the user via the in-game event ledger that a debug action occurred.
                                addLog("[*] DEBUG: Fast-forwarded to Hero Selection via Game Menu.");
                            }}
                            className="w-full text-left p-2 hover:bg-yellow-900 text-yellow-400 font-bold border border-transparent hover:border-yellow-500 rounded transition-colors"
                        >
                            Debug: Skip to Hero Selection
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // --- RENDER (JSX) ---
    // The main layout uses Tailwind CSS for a dashboard-style interface.
    // Conditional rendering blocks elements based on the current `stage`.
    return (
        <div className={`min-h-screen bg-gray-900 ${FLAVORS[flavor].color} p-4 font-mono flex flex-col items-center relative`}>
            <GameMenu
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                setStage={setStage}
                setShowHeroSelection={setShowHeroSelection}
                addLog={addLog}
            />
            <HeroSelection
                showHeroSelection={showHeroSelection}
                setShowHeroSelection={setShowHeroSelection}
                setRuler={setRuler}
                setStage={setStage}
                addLog={addLog}
            />
            <BuildMenu
                buildMenuTarget={buildMenuTarget}
                buildMenuCategory={buildMenuCategory}
                setBuildMenuCategory={setBuildMenuCategory}
                closeBuildMenu={closeBuildMenu}
                handleBuild={handleBuild}
            />
            {treasurerWarning && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border-2 border-red-500 p-6 max-w-md">
                        <h2 className="text-red-500 text-xl font-bold mb-4 flex items-center gap-2"><AlertCircle /> Treasurer's Warning</h2>
                        <p className="mb-2">WARNING: Building '{treasurerWarning.name}' will drop the treasury below 15 BP!</p>
                        <p className="mb-2">Current BP: {bp}</p>
                        <p className="mb-2">Cost: {treasurerWarning.cost}</p>
                        <p className="mb-6 font-bold">Remaining BP: {bp - treasurerWarning.cost}</p>
                        <div className="flex gap-4">
                            <button onClick={confirmPurchase} className="bg-red-900 hover:bg-red-700 text-white px-4 py-2 font-bold flex-1">Confirm</button>
                            <button onClick={cancelPurchase} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 font-bold flex-1">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            {stage >= 2 && (
                <div className="flex flex-col items-center mb-4 gap-2">
                    <h1 className="text-4xl font-bold flex items-center gap-2">
                        <MapIcon /> A Dark Kingdom
                        <Terminal
                            size={20}
                            className="text-gray-600 hover:text-gray-400 cursor-pointer transition-colors ml-2"
                            onClick={handleTerminalClick}
                        />
                    </h1>
                    <div className="flex items-center gap-2 text-sm bg-black border border-gray-700 px-3 py-1 rounded">
                        <span className="text-gray-400 font-bold">Theme:</span>
                        <button
                            onClick={() => setFlavor(flavor === "swamp" ? "dark" : "swamp")}
                            className="font-bold hover:text-white transition-colors capitalize text-gray-300"
                        >
                            [{flavor}]
                        </button>
                    </div>
                </div>
            )}

            {stage >= 2 && (
            <div className="w-full max-w-7xl flex flex-col md:flex-row gap-8 mb-4 transition-all duration-1000 ease-in-out">
                {/* Map Area */}
                <div className={`flex-grow bg-black border ${FLAVORS[flavor].border} p-6 rounded flex flex-col items-center transition-all duration-1000 ease-in-out overflow-x-auto`}>
                    <h2 className="text-xl font-bold mb-4">
                        {currentView === "world" ? "World Map" : `Settlement at ${currentView}`}
                        {currentView !== "world" && world[currentView.split(',')[1]][currentView.split(',')[0]]?.settlement && world[currentView.split(',')[1]][currentView.split(',')[0]].settlement.resLots < Math.floor(world[currentView.split(',')[1]][currentView.split(',')[0]].settlement.otherLots / HOUSING_CAPACITY) && (
                            <span className="text-red-500 text-sm ml-2 font-bold">(OVERCROWDED)</span>
                        )}
                    </h2>
                    {stage >= 2 && (
                        currentView === "world" ? (stage >= 4 ? <WorldGrid
                            world={world}
                            stage={stage}
                            flavor={flavor}
                            setInspectorHex={setInspectorHex}
                            setInspectorPop={setInspectorPop}
                            setInspectorPlot={setInspectorPlot}
                            handleReconnoiter={handleReconnoiter}
                            handleClaim={handleClaim}
                            setCurrentView={setCurrentView}
                        /> : (
                            <div className="flex flex-col items-center justify-center gap-4">
                                <div className={`text-gray-500 p-8 border ${FLAVORS[flavor].border}`}>World Map is restricted until the Charter is signed.</div>
                                <button
                                    onClick={() => setCurrentView("5,5")}
                                    className="bg-green-900 text-white px-4 py-2 font-bold hover:bg-green-700 rounded flex items-center gap-2"
                                >
                                    <Home size={16} /> Return to Camp
                                </button>
                            </div>
                        )) : <SettlementGrid
                            sx={Number(currentView.split(',')[0])}
                            sy={Number(currentView.split(',')[1])}
                            world={world}
                            pops={pops}
                            constructionQueue={constructionQueue}
                            stage={stage}
                            flavor={flavor}
                            setBuildMenuTarget={setBuildMenuTarget}
                            setInspectorPlot={setInspectorPlot}
                            setInspectorHex={setInspectorHex}
                            setInspectorPop={setInspectorPop}
                        />
                    )}
                </div>

                {/* Ledger Area */}
                <div className={`w-full md:w-64 flex-shrink-0 bg-black p-4 rounded flex flex-col gap-2 transition-all duration-1000 ease-in-out ${bpShake ? 'border-2 border-red-500 animate-[shake_0.5s_ease-in-out]' : `border ${FLAVORS[flavor].border}`}`}>
                    <h2 className={`text-xl font-bold border-b ${FLAVORS[flavor].border} pb-2`}>Kingdom Ledger</h2>
                    {stage >= 4 && (
                        <div className="flex flex-col gap-1 mb-2">
                            {ruler && (
                                <>
                                    <span className="text-yellow-500 font-bold mt-1">Ruler: {ruler.name}</span>
                                    <span className="text-xs text-gray-400 italic">Skill: {ruler.skill}</span>
                                    <span className="text-xs text-green-400">Bonus: +1 {ruler.attribute}</span>
                                    <div className={`border-t ${FLAVORS[flavor].border} mt-1 mb-1`}></div>
                                </>
                            )}
                            <span className="text-gray-400 text-sm font-bold mt-2">Advisors (Click to inspect)</span>
                            {Object.entries(advisors).map(([role, advisor]) => (
                                <div
                                    key={role}
                                    onClick={() => {
                                        setInspectorPop({ role, ...advisor });
                                        setInspectorHex(null); // Clear hex inspector
                                        setInspectorPlot(null);
                                    }}
                                    className="text-sm cursor-pointer hover:text-yellow-400 text-gray-300"
                                >
                                    - {role}: {advisor.name} <span className="text-gray-500 text-xs">(Attr: {advisor.attribute})</span>
                                </div>
                            ))}
                            <div className={`border-t ${FLAVORS[flavor].border} mt-1 mb-1`}></div>
                        </div>
                    )}
                    <div className="flex justify-between"><span>Stage:</span> <span>{stage}</span></div>
                    <div className="flex justify-between"><span>Time:</span> <span>{stage >= 4 ? `Day ${gameTime.day}, Month ${gameTime.month}, Year ${gameTime.year} - ${gameTime.hour}:00` : "???"}</span></div>
                    <div className={`border-t ${FLAVORS[flavor].border} my-1`}></div>
                    <div className="flex justify-between"><span>BP (Influence):</span> <span className={`transition-all duration-300 ${bpFlash ? 'text-yellow-400 font-bold scale-110' : ''}`}>{stage >= 2 ? bp : "???"}</span></div>
                    <div className="grid grid-cols-3 gap-2 text-center my-2 text-sm">
                        <div className="bg-gray-800 p-1 rounded flex flex-col">
                            <span className="text-xs text-gray-400 font-bold">TIMBER</span>
                            <span className="font-bold text-amber-600">{stage >= 2 ? timber : "???"}</span>
                        </div>
                        <div className="bg-gray-800 p-1 rounded flex flex-col">
                            <span className="text-xs text-gray-400 font-bold">RATIONS</span>
                            <span className="font-bold text-red-400">{stage >= 2 ? rations : "???"}</span>
                        </div>
                        <div className="bg-gray-800 p-1 rounded flex flex-col">
                            <span className="text-xs text-gray-400 font-bold">STONE</span>
                            <span className="font-bold text-gray-400">{stage >= 2 ? stone : "???"}</span>
                        </div>
                    </div>
                    <div className={`border-t ${FLAVORS[flavor].border} my-1`}></div>
                    <div className="flex justify-between"><span>Unrest:</span> <span>{stage >= 4 ? unrest : "???"}</span></div>
                    <div className="flex justify-between"><span>XP:</span> <span>{stage >= 4 ? xp : "???"}</span></div>
                    <div className="flex justify-between"><span>Tick:</span> <span>{stage >= 4 ? tickCount : "???"}</span></div>
                    {vibeMode && (
                        <div className="flex justify-between items-center text-xs text-cyan-400 mt-2 border-t border-cyan-900 pt-2">
                            <span>Vibe Variance:</span>
                            <span dangerouslySetInnerHTML={{ __html: '$$V_v = \\frac{\\sum_{i=1}^{n} (x_i - \\bar{x})^2}{n - 1}$$' }} />
                        </div>
                    )}

                    {currentView !== "world" && stage >= 2 && world[currentView.split(',')[1]][currentView.split(',')[0]]?.settlement && (
                        <>
                            <div className={`border-t ${FLAVORS[flavor].border} mt-2 pt-2`}></div>
                            <div className="flex justify-between"><span>Res. Lots:</span> <span>{world[currentView.split(',')[1]][currentView.split(',')[0]].settlement.resLots}</span></div>
                            <div className="flex justify-between"><span>Other Lots:</span> <span>{world[currentView.split(',')[1]][currentView.split(',')[0]].settlement.otherLots}</span></div>
                        </>
                    )}
                </div>

                {/* Inspector Area */}
                {(inspectorHex || inspectorPop || inspectorPlot) && (
                    <div className={`w-full md:w-64 flex-shrink-0 bg-black border ${FLAVORS[flavor].border} p-4 rounded flex flex-col gap-2 animate-[slideIn_0.3s_ease-out]`}>
                        <div className="flex justify-between items-center border-b ${FLAVORS[flavor].border} pb-2">
                            <h2 className="text-xl font-bold text-blue-400">Inspector</h2>
                            <button onClick={() => { setInspectorHex(null); setInspectorPop(null); setInspectorPlot(null); }} aria-label="Close inspector" className="text-red-500 hover:text-red-300 text-sm font-bold">X</button>
                        </div>

                        {inspectorHex && (
                            <div className="flex flex-col gap-2 text-sm mt-2">
                                <div className="font-bold text-white mb-1">Hex ({inspectorHex.x}, {inspectorHex.y})</div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Terrain:</span>
                                    <span className="capitalize">{inspectorHex.terrain}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Status:</span>
                                    <span>{inspectorHex.status === 0 ? "Unexplored" : inspectorHex.status === 1 ? "Mapped" : "Claimed"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Foraging:</span>
                                    <span>{inspectorHex.terrain === "Swamp" || inspectorHex.terrain === "Forest" ? "High" : "Low"}</span>
                                </div>
                                {inspectorHex.status >= 1 && inspectorHex.poi && (
                                    <div className="flex justify-between text-orange-400 font-bold">
                                        <span>POI:</span>
                                        <span>{inspectorHex.poi}</span>
                                    </div>
                                )}
                                {inspectorHex.settlement && (
                                    <div className="mt-2 p-2 border border-blue-900 bg-blue-900/20">
                                        <div className="font-bold text-blue-300">{inspectorHex.settlement.name}</div>
                                        <div className="text-xs text-gray-400 mt-1">Pop: {pops.filter(p => p.settlementCoords.sx === inspectorHex.x && p.settlementCoords.sy === inspectorHex.y).length} / {inspectorHex.settlement.resLots * HOUSING_CAPACITY}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {inspectorPop && (
                            <div className="flex flex-col gap-2 text-sm mt-2">
                                <div className="font-bold text-yellow-400 mb-1">{inspectorPop.name}</div>
                                <div className="text-gray-400 italic mb-2">{inspectorPop.role}</div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Attribute:</span>
                                    <span>{inspectorPop.attribute}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Bonus Yield:</span>
                                    <span className="text-green-400">+{Math.floor(inspectorPop.attribute / 4)} BP/tick</span>
                                </div>
                            </div>
                        )}

                        {inspectorPlot && (
                            <div className="flex flex-col gap-2 text-sm mt-2">
                                <div className="font-bold text-blue-400 mb-1 capitalize">{inspectorPlot.building}</div>
                                <div className="text-gray-400 italic mb-2">Level 1</div>
                                <button disabled className="bg-gray-800 text-gray-500 font-bold py-1 px-2 mb-2 cursor-not-allowed border border-gray-700">
                                    Upgrade (Locked)
                                </button>
                                <div className="font-bold text-white mb-1 border-b border-gray-700 pb-1">Assigned Pops</div>
                                <div className="flex flex-col gap-1">
                                    {pops.filter(p => p.settlementCoords.sx === inspectorPlot.sx && p.settlementCoords.sy === inspectorPlot.sy && ((p.homeCoords && p.homeCoords.x === inspectorPlot.x && p.homeCoords.y === inspectorPlot.y) || (p.workCoords && p.workCoords.x === inspectorPlot.x && p.workCoords.y === inspectorPlot.y))).length > 0 ? (
                                        pops.filter(p => p.settlementCoords.sx === inspectorPlot.sx && p.settlementCoords.sy === inspectorPlot.sy && ((p.homeCoords && p.homeCoords.x === inspectorPlot.x && p.homeCoords.y === inspectorPlot.y) || (p.workCoords && p.workCoords.x === inspectorPlot.x && p.workCoords.y === inspectorPlot.y))).map(p => (
                                            <div key={p.id} className="text-gray-300 flex justify-between">
                                                <span>{p.name}</span>
                                                <span className="text-xs text-gray-500">{p.homeCoords && p.homeCoords.x === inspectorPlot.x && p.homeCoords.y === inspectorPlot.y ? 'Resident' : 'Worker'}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-gray-500 italic">No pops assigned.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
            )}

            <div className={stage < 2 ? "flex-1 flex flex-col justify-center items-center w-full max-w-7xl" : "w-full flex flex-col items-center max-w-7xl"}>
                {/* Log Area */}
                <div className={`w-full bg-black border ${FLAVORS[flavor].border} p-4 rounded h-48 overflow-y-auto mb-4 transition-all duration-1000 ease-in-out`}>
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1">{log}</div>
                    ))}
                    <div ref={logEndRef} />
                </div>

            {stage >= 4 && (
                <TechTree unlockedTechs={unlockedTechs} setUnlockedTechs={setUnlockedTechs} />
            )}

            {/* Ruler's Actions (Stage 2+) */}
            {stage >= 2 && (
                <div className={`w-full max-w-7xl bg-gray-900 border-t ${FLAVORS[flavor].border} pt-4 pb-4 mb-4 flex flex-col items-center gap-4`}>
                    <h3 className="text-lg font-bold text-gray-300 mb-2">Ruler's Actions</h3>
                    <div className="flex flex-wrap justify-center gap-4">
                        <ProgressBar
                            onClick={handleGatherTimber}
                            disabled={isRulerBusy}
                            progress={gatherTimberProgress}
                            label={`Gather Timber (${timber})`}
                        />
                        <ProgressBar
                            onClick={handleHuntRations}
                            disabled={isRulerBusy}
                            progress={huntProgress}
                            label={`Hunt Rations (${rations})`}
                        />
                        <ProgressBar
                            onClick={handleGatherStone}
                            disabled={isRulerBusy}
                            progress={gatherStoneProgress}
                            label={`Gather Stone (${stone})`}
                        />

                        <button
                            onClick={() => {
                                setTimber(t => t - 10);
                                setRations(r => r - 10);
                                setBp(currentBp => currentBp + 1);
                                addLog("[+] You sold raw resources to the local market for 1 BP.");
                            }}
                            disabled={timber < 10 || rations < 10}
                            className={`px-4 py-2 font-bold rounded border ${timber >= 10 && rations >= 10 ? 'bg-yellow-900 text-yellow-100 hover:bg-yellow-700 border-yellow-500' : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'}`}
                        >
                            Sell Resources (10 Timber, 10 Rations -&gt; 1 BP)
                        </button>
                        <ProgressBar
                            onClick={handleHelpBuild}
                            disabled={isRulerBusy || constructionQueue.length === 0}
                            progress={helpBuildProgress}
                            label={<><Hammer size={16} className="inline mr-2" />Help Build</>}
                        />
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="w-full max-w-7xl flex justify-center gap-4 transition-all duration-1000 ease-in-out mb-8">
                {stage === 3 && !showHeroSelection && (() => {
                    let pop = 0;
                    world.forEach(row => {
                        row.forEach(hex => {
                            if (hex.status === 2 && hex.settlement) pop += hex.settlement.resLots * HOUSING_CAPACITY;
                        });
                    });
                    if (pop >= 5) {
                        return (
                            <button
                                onClick={() => {
                                    setStage(4);
                                    addLog("[+] The Charter is signed. The World Map is now open.");
                                }}
                                className="bg-yellow-900 text-white px-4 py-2 font-bold hover:bg-yellow-700 rounded flex items-center gap-2 border border-yellow-500"
                            >
                                <User size={16} /> Sign the Charter
                            </button>
                        );
                    }
                    return null;
                })()}
                {stage === 0 && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="text-4xl font-mono text-gray-400 mb-4 h-12 flex items-center justify-center">
                            {sticks < 3 ? "( . )" : sticks < 7 ? "( ^ )" : "( # )"}
                        </div>
                        <div className="flex gap-4">
                            {sticks < 10 && (
                                <ProgressBar
                                    onClick={handleGatherSticks}
                                    disabled={isRulerBusy}
                                    progress={gatherProgress}
                                    label={`Gather Sticks (${sticks}/10)`}
                                />
                            )}
                            {sticks >= 10 && (
                                <button
                                    onClick={() => {
                                        setStage(1);
                                        addLog("[+] Fire built. A small comfort in the dark.");
                                    }}
                                    className="bg-orange-900 text-white px-4 py-2 font-bold hover:bg-orange-700 rounded flex items-center gap-2 border border-orange-500"
                                >
                                    Build Fire
                                </button>
                            )}
                        </div>
                    </div>
                )}
                {stage === 1 && (
                    <>
                        {timber < 5 || rations < 5 ? (
                            <>
                                <ProgressBar
                                    onClick={handleGatherTimber}
                                    disabled={isRulerBusy}
                                    progress={gatherTimberProgress}
                                    label={`Gather Timber (${timber})`}
                                />
                                <ProgressBar
                                    onClick={handleHuntRations}
                                    disabled={isRulerBusy}
                                    progress={huntProgress}
                                    label={`Hunt Rations (${rations})`}
                                />
                                <ProgressBar
                                    onClick={handleGatherStone}
                                    disabled={isRulerBusy}
                                    progress={gatherStoneProgress}
                                    label={`Gather Stone (${stone})`}
                                />
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    setStage(2);
                                    addLog("[+] Camp established at (5,5).");
                                    const newWorld = [...world];
                                    newWorld[5][5].status = 2;
                                    newWorld[5][5].settlement = { name: "Camp", grid: Array(5).fill(null).map(() => Array(5).fill(null)), resLots: 0, otherLots: 0, pathValues: Array(5).fill(0).map(() => Array(5).fill(0)) };
                                    setCurrentView("5,5");
                                    setWorld(newWorld);
                                }}
                                className="bg-green-900 text-black px-4 py-2 font-bold hover:bg-green-700 rounded flex items-center gap-2"
                            >
                                <Home size={16} /> Establish Camp
                            </button>
                        )}
                    </>
                )}
                {stage >= 4 && currentView !== "world" && (
                    <button
                        onClick={() => setCurrentView("world")}
                        className="bg-blue-900 text-white px-4 py-2 font-bold hover:bg-blue-700 rounded flex items-center gap-2"
                    >
                        <Compass size={16} /> Return to World Map
                    </button>
                )}
                </div>
            </div>
        </div>
    );
};


const TechTree = ({ unlockedTechs, setUnlockedTechs }) => {
    return (
        <div className="w-full bg-black border border-gray-600 p-4 rounded mb-4">
            <h2 className="text-xl font-bold text-cyan-400 mb-2">Tech Tree (Stub)</h2>
            <div className="text-sm text-gray-400">
                <p>Unlocked Technologies: {unlockedTechs.length > 0 ? unlockedTechs.join(', ') : 'None'}</p>
                <button
                    onClick={() => setUnlockedTechs(prev => [...prev, 'Agriculture'])}
                    className="mt-2 bg-gray-800 text-white px-2 py-1 hover:bg-gray-700 border border-gray-600"
                >
                    Unlock Agriculture
                </button>
            </div>
        </div>
    );
};

export default App;
