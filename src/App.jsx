import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Terminal, Map as MapIcon, Home, Compass, User, AlertCircle, Building, TreePine, Hammer } from 'lucide-react';
import { RECON_COST, CLAIM_COST, ANNUAL_UPKEEP, HOUSING_CAPACITY, FLAVORS, STRUCTURES_DB, PROMINENT_CITIZENS, KINGMAKER_BACKGROUNDS } from './library';

// --- REACT COMPONENT: APP ---
// This is the root component containing all logic, state, and UI rendering for the Kingdom Simulator.
const App = () => {
  // --- GAME STATE & LOCALSTORAGE ---
  // All crucial variables persist via lazy initializers reading from localStorage.
  // This ensures refreshing the browser doesn't wipe progress.
  // `stage`: Controls progression (1: Awakening, 2: Survival, 3: Expansion, 4: Charter/World Map).
  const [stage, setStage] = useState(() => {
    const saved = localStorage.getItem('adk_stage');
    return saved ? parseInt(saved) : 1;
  });

  // `logs`: The main event ledger. Acts as the user's primary feedback mechanism instead of console.logs.
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('adk_logs');
    return saved ? JSON.parse(saved) : ["[!] Expedition landed in the Stolen Lands. Awaiting orders to establish camp."];
  });

  // `bp` (Build Points): The kingdom's main currency. Cannot drop below 0.
  const [bp, setBp] = useState(() => {
    const saved = localStorage.getItem('adk_bp');
    return saved ? parseInt(saved) : 60;
  });

  // `tickCount`: Tracks elapsed 'months'. Every 12 ticks triggers an Annual Upkeep.
  const [tickCount, setTickCount] = useState(() => {
    const saved = localStorage.getItem('adk_tickCount');
    return saved ? parseInt(saved) : 0;
  });

  // `unrest`: High unrest triggers negative events. Decreased by specific structures (e.g., Castle).
  const [unrest, setUnrest] = useState(() => {
    const saved = localStorage.getItem('adk_unrest');
    return saved ? parseInt(saved) : 0;
  });

  // `xp`: Kingdom Experience. Awarded for claiming hexes and surviving annual upkeeps.
  const [xp, setXp] = useState(() => {
    const saved = localStorage.getItem('adk_xp');
    return saved ? parseInt(saved) : 0;
  });

  // `world`: The 10x10 hex grid. Represents the Stolen Lands. Generated once and saved.
  const [world, setWorld] = useState(() => {
    const saved = localStorage.getItem('adk_world');
    if (saved) return JSON.parse(saved);

    // Generate new world
    const terrains = ["Forest", "Plain", "Mountain", "Hill", "Swamp"];
    const newWorld = [];
    for (let y = 0; y < 10; y++) {
      const row = [];
      for (let x = 0; x < 10; x++) {
        row.push({
          terrain: terrains[Math.floor(Math.random() * terrains.length)],
          status: 0,
          settlement: null
        });
      }
      newWorld.push(row);
    }
    return newWorld;
  });

  const [currentView, setCurrentView] = useState("world");
  const [flavor, setFlavor] = useState("swamp");
  const [buildMenuTarget, setBuildMenuTarget] = useState(null);
  const [buildMenuCategory, setBuildMenuCategory] = useState(null);
  const [inspectorHex, setInspectorHex] = useState(null);
  const [inspectorPop, setInspectorPop] = useState(null);
  const [bpFlash, setBpFlash] = useState(false);
  const [bpShake, setBpShake] = useState(false);

  // Hero Selection State
  const [showHeroSelection, setShowHeroSelection] = useState(false);
  const [ruler, setRuler] = useState(() => {
    const saved = localStorage.getItem('adk_ruler');
    return saved ? JSON.parse(saved) : null;
  });

  // Ref for log auto-scrolling
  const logEndRef = useRef(null);

  const addLog = (msg) => {
    setLogs(prev => [...prev.slice(-19), msg]);
  };

  // Save State
  useEffect(() => {
    localStorage.setItem('adk_stage', stage);
    localStorage.setItem('adk_logs', JSON.stringify(logs));
    localStorage.setItem('adk_bp', bp);
    localStorage.setItem('adk_unrest', unrest);
    localStorage.setItem('adk_xp', xp);
    localStorage.setItem('adk_tickCount', tickCount);
    localStorage.setItem('adk_world', JSON.stringify(world));
    if (ruler) {
        localStorage.setItem('adk_ruler', JSON.stringify(ruler));
    }
  }, [stage, logs, bp, unrest, xp, tickCount, world, ruler]);

  // Simulation Advisors
  const [advisors, setAdvisors] = useState({
    Treasurer: { name: "Jubilost", attribute: 16 },
    General: { name: "Amiri", attribute: 14 }
  });

  // Background Tick (every 5 seconds)
  useEffect(() => {
    if (stage < 3 || showHeroSelection) return;

    const interval = setInterval(() => {
      setTickCount(prevTick => prevTick + 1);
    }, 5000);

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
                      stats.totalPop += hex.settlement.resLots * HOUSING_CAPACITY;
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
  }, [tickCount, stage, worldStats, spawnedCitizens]);

  // Handle Tick Side Effects
  useEffect(() => {
    if (stage < 3 || tickCount === 0) return;

    let treasurerBonus = 0;
    if (advisors.Treasurer) {
        treasurerBonus = Math.floor((advisors.Treasurer.attribute || 0) / 4);
    }

    setBp(currentBp => {
        let newBp = currentBp + treasurerBonus;

        if (tickCount % 12 === 0) {
            newBp -= ANNUAL_UPKEEP;
        }

        return newBp;
    });

    if (tickCount % 12 === 0) {
        addLog(`[-] Annual Upkeep: Paid ${ANNUAL_UPKEEP} BP.`);
        const expectedBp = bp + treasurerBonus - ANNUAL_UPKEEP;
        if (expectedBp < 0) {
            setUnrest(u => u + 1);
            addLog("[!] Debt causes unrest!");
        }
    }

  }, [tickCount]);

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
              newWorld[y][x].settlement = { name: "New Settlement", grid: Array(5).fill(null).map(() => Array(5).fill(null)), resLots: 0, otherLots: 0 };
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

    const cost = structure.cost_rp;

    handleAction(cost, structureName, () => {
        const isRes = structure.traits.includes("residential");
        const lotsNeeded = structure.lots;
        let positionsToFill = [];

        if (lotsNeeded === 1) {
             if (x < 0 || x >= 5 || y < 0 || y >= 5 || settlement.grid[y][x] !== null) {
                  addLog(`[-] Cannot build at ${x},${y}: Space is blocked or out of bounds.`);
                  return;
             }
             positionsToFill.push([x, y]);
        } else if (lotsNeeded === 2) {
             let horizontalClear = true;
             if (x < 0 || x + 1 >= 5 || y < 0 || y >= 5) horizontalClear = false;
             else if (settlement.grid[y][x] !== null || settlement.grid[y][x+1] !== null) horizontalClear = false;

             if (horizontalClear) {
                 positionsToFill = [[x, y], [x+1, y]];
             } else {
                 let verticalClear = true;
                 if (x < 0 || x >= 5 || y < 0 || y + 1 >= 5) verticalClear = false;
                 else if (settlement.grid[y][x] !== null || settlement.grid[y+1][x] !== null) verticalClear = false;

                 if (verticalClear) {
                     positionsToFill = [[x, y], [x, y+1]];
                 } else {
                     addLog(`[-] Cannot build ${structureName} at ${x},${y}: Need 2 contiguous lots.`);
                     return;
                 }
             }
        } else if (lotsNeeded === 4) {
             if (x < 0 || x + 1 >= 5 || y < 0 || y + 1 >= 5) {
                 addLog(`[-] Cannot build ${structureName} at ${x},${y}: 2x2 area goes out of bounds.`);
                 return;
             }
             if (settlement.grid[y][x] !== null || settlement.grid[y][x+1] !== null ||
                 settlement.grid[y+1][x] !== null || settlement.grid[y+1][x+1] !== null) {
                 addLog(`[-] Cannot build ${structureName} at ${x},${y}: 2x2 area is not clear.`);
                 return;
             }
             positionsToFill = [[x, y], [x+1, y], [x, y+1], [x+1, y+1]];
        }

        positionsToFill.forEach(([px, py]) => {
            settlement.grid[py][px] = structureName;
        });

        if (isRes) settlement.resLots += lotsNeeded;
        else settlement.otherLots += lotsNeeded;

        setBp(prev => prev - cost);
        setWorld(newWorld);
        addLog(`[+] Built ${structureName} at ${x},${y}.`);

        if (stage === 2 && structureName === "houses") {
            setStage(3);
            addLog("[!] Citizens arrive and build houses. The Kingdom expands!");
        }
    });
  };


  // Auto-scroll logs
  useEffect(() => {
    if (logEndRef.current) {
        logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const renderWorldGrid = () => {
    const style = FLAVORS[flavor];
    return (
        <div className={`grid grid-cols-10 gap-2 min-w-max bg-black p-4 border ${FLAVORS[flavor].border} mx-auto`}>
            {world.map((row, y) => (
                row.map((hex, x) => {
                    let char = "??";
                    let colorClass = "text-gray-600";
                    if (hex.status === 1) {
                        char = style[hex.terrain] || ".";
                        colorClass = style.color;
                    } else if (hex.status === 2) {
                        char = style[hex.terrain] ? `[${style[hex.terrain].trim()}]` : "[C]";
                        colorClass = "text-yellow-500 font-bold";
                    }
                    return (
                        <div
                            key={`${x}-${y}`}
                            className={`w-12 h-12 flex items-center justify-center text-base cursor-pointer hover:border ${FLAVORS[flavor].color.replace("text-", "border-").replace("500", "400")} ${colorClass}`}
                            onClick={() => {
                                if (stage >= 3) {
                                    setInspectorHex({ x, y, ...hex });
                                    setInspectorPop(null); // Clear any open pop inspector

                                    if (hex.status === 0) {
                                        handleReconnoiter(x, y);
                                    } else if (hex.status === 1) {
                                        handleClaim(x, y);
                                    } else if (hex.status === 2 && hex.settlement) {
                                        setCurrentView(`${x},${y}`);
                                    }
                                }
                            }}
                        >
                            {char}
                        </div>
                    );
                })
            ))}
        </div>
    );
  };

  const renderSettlementGrid = (sx, sy) => {
    const settlement = world[sy][sx].settlement;
    if (!settlement) return <div className="text-gray-500 p-4">No settlement here.</div>;

    const isOvercrowded = settlement.resLots < Math.floor(settlement.otherLots / HOUSING_CAPACITY);

    return (
        <div className={`grid grid-cols-5 gap-2 w-fit bg-black p-4 border ${isOvercrowded ? 'border-red-600' : 'border-blue-800'}`}>
            {settlement.grid.map((row, y) => (
                row.map((cell, x) => (
                    <div
                        key={`${x}-${y}`}
                        className={`w-16 h-16 border border-gray-700 flex items-center justify-center bg-gray-900 text-base cursor-pointer ${FLAVORS[flavor].hover}`}
                        onClick={() => {
                            if (stage >= 2 && cell === null) {
                                setBuildMenuTarget({ x, y });
                            }
                        }}
                    >
                        {cell ? <span className="bg-blue-800 text-white p-1 font-bold" title={cell}>{cell.charAt(0).toUpperCase()}</span> : <span className="text-gray-600">[ ]</span>}
                    </div>
                ))
            ))}
        </div>
    );
  };


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
                                  setStage(4);
                                  addLog(`[+] The Ruler's history as a ${bg.name} becomes known...`);
                                  addLog("[+] The Charter has been signed. The World Map is now open.");
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

  const renderBuildMenu = () => {
      if (!buildMenuTarget) return null;
      const { x, y } = buildMenuTarget;

      const categories = [
          { id: "residential", label: "Residential", icon: <Home size={16} /> },
          { id: "edifice", label: "Edifice", icon: <Building size={16} /> },
          { id: "yard", label: "Yard", icon: <TreePine size={16} /> },
          { id: "building", label: "General Building", icon: <Hammer size={16} /> }
      ];

      return (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 border-2 border-blue-500 p-6 max-w-xl w-full max-h-[80vh] flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-blue-400">
                          {buildMenuCategory ? `Build ${buildMenuCategory} at (${x},${y})` : `Select Category to Build at (${x},${y})`}
                      </h2>
                      <button onClick={closeBuildMenu} aria-label="Close build menu" className="text-red-500 hover:text-red-300 font-bold">X</button>
                  </div>

                  {!buildMenuCategory ? (
                      <div className="grid grid-cols-2 gap-4">
                          {categories.map(c => (
                              <button
                                  key={c.id}
                                  onClick={() => setBuildMenuCategory(c.id)}
                                  className="bg-blue-900 hover:bg-blue-700 text-white p-4 font-bold flex flex-col items-center justify-center gap-2 border border-blue-500 rounded"
                              >
                                  {c.icon} {c.label}
                              </button>
                          ))}
                      </div>
                  ) : (
                      <div className="flex-1 overflow-y-auto pr-2">
                          <button onClick={() => setBuildMenuCategory(null)} className="mb-4 text-sm text-gray-400 hover:text-white">&larr; Back to Categories</button>
                          <div className="flex flex-col gap-2">
                              {Object.entries(STRUCTURES_DB)
                                  .filter(([key, struct]) => {
                                      if (buildMenuCategory === "residential") return struct.traits.includes("residential");
                                      if (buildMenuCategory === "edifice") return struct.traits.includes("edifice");
                                      if (buildMenuCategory === "yard") return struct.traits.includes("yard");
                                      // General Building: buildings that aren't residential or edifice
                                      return struct.traits.includes("building") && !struct.traits.includes("residential") && !struct.traits.includes("edifice");
                                  })
                                  .map(([key, struct]) => (
                                      <div key={key} className="bg-black border border-gray-700 p-3 flex justify-between items-center hover:border-blue-400">
                                          <div>
                                              <div className="font-bold text-white capitalize">{key}</div>
                                              <div className="text-xs text-gray-400 italic">{struct.desc}</div>
                                              <div className="text-xs text-gray-300 mt-1">Lots: {struct.lots} | Traits: {struct.traits.join(", ")}</div>
                                          </div>
                                          <button
                                              onClick={() => {
                                                  handleBuild(key, x, y);
                                                  closeBuildMenu();
                                              }}
                                              className="bg-green-900 hover:bg-green-700 text-white px-3 py-1 font-bold border border-green-500 whitespace-nowrap ml-4"
                                          >
                                              {struct.cost_rp} BP
                                          </button>
                                      </div>
                                  ))}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  // --- RENDER (JSX) ---
  // The main layout uses Tailwind CSS for a dashboard-style interface.
  // Conditional rendering blocks elements based on the current `stage`.
  return (
    <div className={`min-h-screen bg-gray-900 ${FLAVORS[flavor].color} p-4 font-mono flex flex-col items-center relative`}>
        {renderHeroSelection()}
        {renderBuildMenu()}
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
        <h1 className="text-4xl font-bold mb-4 flex items-center gap-2"><MapIcon /> A Dark Kingdom</h1>

        <div className={`w-full max-w-7xl flex flex-col md:flex-row gap-8 mb-4 transition-all duration-1000 ease-in-out ${stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 hidden'}`}>
            {/* Map Area */}
            <div className={`flex-grow bg-black border ${FLAVORS[flavor].border} p-6 rounded flex flex-col items-center transition-all duration-1000 ease-in-out ${stage >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full hidden'} overflow-x-auto`}>
                <h2 className="text-xl font-bold mb-4">
                    {currentView === "world" ? "World Map" : `Settlement at ${currentView}`}
                    {currentView !== "world" && world[currentView.split(',')[1]][currentView.split(',')[0]]?.settlement && world[currentView.split(',')[1]][currentView.split(',')[0]].settlement.resLots < Math.floor(world[currentView.split(',')[1]][currentView.split(',')[0]].settlement.otherLots / HOUSING_CAPACITY) && (
                        <span className="text-red-500 text-sm ml-2 font-bold">(OVERCROWDED)</span>
                    )}
                </h2>
                {stage >= 2 && (
                    currentView === "world" ? (stage >= 4 ? renderWorldGrid() : (
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className={`text-gray-500 p-8 border ${FLAVORS[flavor].border}`}>World Map is restricted until the Charter is signed.</div>
                            <button
                                onClick={() => setCurrentView("5,5")}
                                className="bg-green-900 text-white px-4 py-2 font-bold hover:bg-green-700 rounded flex items-center gap-2"
                            >
                                <Home size={16} /> Return to Camp
                            </button>
                        </div>
                    )) : renderSettlementGrid(...currentView.split(',').map(Number))
                )}
            </div>

            {/* Ledger Area */}
            <div className={`w-full md:w-64 flex-shrink-0 bg-black p-4 rounded flex flex-col gap-2 transition-all duration-1000 ease-in-out ${stage >= 3 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full hidden'} ${bpShake ? 'border-2 border-red-500 animate-[shake_0.5s_ease-in-out]' : `border ${FLAVORS[flavor].border}`}`}>
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
                                }}
                                className="text-sm cursor-pointer hover:text-yellow-400 text-gray-300"
                            >
                                - {role}: {advisor.name}
                            </div>
                        ))}
                        <div className={`border-t ${FLAVORS[flavor].border} mt-1 mb-1`}></div>
                    </div>
                )}
                <div className="flex justify-between"><span>Stage:</span> <span>{stage}</span></div>
                <div className="flex justify-between"><span>BP:</span> <span className={`transition-all duration-300 ${bpFlash ? 'text-yellow-400 font-bold scale-110' : ''}`}>{stage >= 4 ? bp : "???"}</span></div>
                <div className="flex justify-between"><span>Unrest:</span> <span>{stage >= 4 ? unrest : "???"}</span></div>
                <div className="flex justify-between"><span>XP:</span> <span>{stage >= 4 ? xp : "???"}</span></div>
                <div className="flex justify-between"><span>Tick:</span> <span>{stage >= 4 ? tickCount : "???"}</span></div>

                {currentView !== "world" && stage >= 2 && world[currentView.split(',')[1]][currentView.split(',')[0]]?.settlement && (
                    <>
                        <div className={`border-t ${FLAVORS[flavor].border} mt-2 pt-2`}></div>
                        <div className="flex justify-between"><span>Res. Lots:</span> <span>{world[currentView.split(',')[1]][currentView.split(',')[0]].settlement.resLots}</span></div>
                        <div className="flex justify-between"><span>Other Lots:</span> <span>{world[currentView.split(',')[1]][currentView.split(',')[0]].settlement.otherLots}</span></div>
                    </>
                )}
            </div>

            {/* Inspector Area */}
            {(inspectorHex || inspectorPop) && (
                <div className={`w-full md:w-64 flex-shrink-0 bg-black border ${FLAVORS[flavor].border} p-4 rounded flex flex-col gap-2 animate-[slideIn_0.3s_ease-out]`}>
                    <div className="flex justify-between items-center border-b ${FLAVORS[flavor].border} pb-2">
                        <h2 className="text-xl font-bold text-blue-400">Inspector</h2>
                        <button onClick={() => { setInspectorHex(null); setInspectorPop(null); }} aria-label="Close inspector" className="text-red-500 hover:text-red-300 text-sm font-bold">X</button>
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
                            {inspectorHex.settlement && (
                                <div className="mt-2 p-2 border border-blue-900 bg-blue-900/20">
                                    <div className="font-bold text-blue-300">{inspectorHex.settlement.name}</div>
                                    <div className="text-xs text-gray-400 mt-1">Pop: {inspectorHex.settlement.resLots * HOUSING_CAPACITY}</div>
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
                </div>
            )}

            </div>

        {/* Log Area */}
        <div className={`w-full max-w-7xl bg-black border ${FLAVORS[flavor].border} p-4 rounded h-48 overflow-y-auto mb-4 transition-all duration-1000 ease-in-out`}>
            {logs.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
            ))}
            <div ref={logEndRef} />
        </div>

        {/* Controls */}
        <div className="w-full max-w-5xl flex justify-center gap-4 transition-all duration-1000 ease-in-out">
            {stage === 3 && !showHeroSelection && (() => {
            {stage === 3 && worldStats.totalPop >= 5 && (
                <button
                    onClick={() => {
                        setStage(4);
                        addLog("[+] The Charter has been signed. The World Map is now open.");
                    }}
                    className="bg-yellow-900 text-white px-4 py-2 font-bold hover:bg-yellow-700 rounded flex items-center gap-2 border border-yellow-500"
                >
                    <User size={16} /> Sign the Charter
                </button>
            )}
        <div className="w-full max-w-7xl flex justify-center gap-4 transition-all duration-1000 ease-in-out">
            {stage === 3 && (() => {
                let pop = 0;
                world.forEach(row => {
                    row.forEach(hex => {
                        if (hex.status === 2 && hex.settlement) {
                            pop += hex.settlement.resLots * HOUSING_CAPACITY;
                        }
                    });
                });
                if (pop >= 5) {
                    return (
                        <button
                            onClick={() => {
                                setShowHeroSelection(true);
                                addLog("[*] Preparing the Charter. Who shall rule these lands?");
                            }}
                            className="bg-yellow-900 text-white px-4 py-2 font-bold hover:bg-yellow-700 rounded flex items-center gap-2 border border-yellow-500"
                        >
                            <User size={16} /> Sign the Charter
                        </button>
                    );
                }
                return null;
            })()}
            {stage === 1 && (
                <button
                    onClick={() => {
                        setStage(2);
                        addLog("[+] Camp established at (5,5).");
                        const newWorld = [...world];
                        newWorld[5][5].status = 2;
                        newWorld[5][5].settlement = { name: "Camp", grid: Array(5).fill(null).map(() => Array(5).fill(null)), resLots: 0, otherLots: 0 };
                        setCurrentView("5,5");
                        setWorld(newWorld);
                    }}
                    className="bg-green-900 text-black px-4 py-2 font-bold hover:bg-green-700 rounded flex items-center gap-2"
                >
                    <Home size={16} /> Establish Camp
                </button>
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
  );
};

export default App;
