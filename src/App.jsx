import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Map as MapIcon, Home, Compass, User, AlertCircle } from 'lucide-react';
import { RECON_COST, CLAIM_COST, ANNUAL_UPKEEP, HOUSING_CAPACITY, FLAVORS, STRUCTURES_DB } from './library';

const App = () => {
  // --- Game State ---
  const [stage, setStage] = useState(() => {
    const saved = localStorage.getItem('adk_stage');
    return saved ? parseInt(saved) : 1;
  });

  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('adk_logs');
    return saved ? JSON.parse(saved) : ["[!] Expedition landed in the Stolen Lands. Awaiting orders to establish camp."];
  });

  const [bp, setBp] = useState(() => {
    const saved = localStorage.getItem('adk_bp');
    return saved ? parseInt(saved) : 60;
  });

  const [tickCount, setTickCount] = useState(() => {
    const saved = localStorage.getItem('adk_tickCount');
    return saved ? parseInt(saved) : 0;
  });

  const [unrest, setUnrest] = useState(() => {
    const saved = localStorage.getItem('adk_unrest');
    return saved ? parseInt(saved) : 0;
  });

  const [xp, setXp] = useState(() => {
    const saved = localStorage.getItem('adk_xp');
    return saved ? parseInt(saved) : 0;
  });

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
  }, [stage, logs, bp, unrest, xp, tickCount, world]);

  // Simulation Advisors
  const [advisors, setAdvisors] = useState({
    Treasurer: { name: "Jubilost", attribute: 16 },
    General: { name: "Amiri", attribute: 14 }
  });

  // Background Tick (every 5 seconds)
  useEffect(() => {
    if (stage < 3) return;

    const interval = setInterval(() => {
      setTickCount(prevTick => {
        const nextTick = prevTick + 1;

        setBp(currentBp => {
          const treasurerBonus = Math.floor((advisors.Treasurer?.attribute || 0) / 4);
          let newBp = currentBp + treasurerBonus;

          if (nextTick % 12 === 0) {
            newBp -= ANNUAL_UPKEEP;
          }
          return newBp;
        });

        // Handle side effects outside of the setState functional updater to avoid React StrictMode double-logging
        if (nextTick % 12 === 0) {
           addLog(`[-] Annual Upkeep: Paid ${ANNUAL_UPKEEP} BP.`);
           // We have to estimate the BP change outside of the setBp closure,
           // but since it's an async update, we can just use the state value directly in a timeout or effect,
           // or calculate it deterministically here:
           setBp(currentBp => {
               const expectedBp = currentBp + Math.floor((advisors.Treasurer?.attribute || 0) / 4) - ANNUAL_UPKEEP;
               if (expectedBp < 0) {
                   setUnrest(u => u + 1);
                   addLog("[!] Debt causes unrest!");
               }
               return currentBp; // don't mutate here
           })
        }

        return nextTick;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [stage, advisors]);

  const [treasurerWarning, setTreasurerWarning] = useState(null);

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
        <div className="grid grid-cols-10 gap-1 w-fit bg-black p-4 border border-green-800">
            {world.map((row, y) => (
                row.map((hex, x) => {
                    let char = "??";
                    let colorClass = "text-gray-600";
                    if (hex.status === 1) {
                        char = style[hex.terrain] || ".";
                        colorClass = style.color;
                    } else if (hex.status === 2) {
                        char = "[C]";
                        colorClass = "text-yellow-500 font-bold";
                    }
                    return (
                        <div
                            key={`${x}-${y}`}
                            className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer hover:border border-green-400 ${colorClass}`}
                            onClick={() => {
                                if (stage >= 3) {
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
                        className="w-12 h-12 border border-gray-700 flex items-center justify-center bg-gray-900 text-xs cursor-pointer hover:border-green-400"
                        onClick={() => {
                            if (stage >= 2 && cell === null) {
                                const b = prompt("Build what? (e.g. houses, farm, lumberyard)");
                                if (b) handleBuild(b.toLowerCase(), x, y);
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

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 p-4 font-mono flex flex-col items-center relative">
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

        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Map Area */}
            <div className="col-span-2 bg-black border border-green-800 p-4 rounded flex flex-col items-center justify-center">
                <h2 className="text-xl font-bold mb-2">
                    {currentView === "world" ? "World Map" : `Settlement at ${currentView}`}
                    {currentView !== "world" && world[currentView.split(',')[1]][currentView.split(',')[0]]?.settlement && world[currentView.split(',')[1]][currentView.split(',')[0]].settlement.resLots < Math.floor(world[currentView.split(',')[1]][currentView.split(',')[0]].settlement.otherLots / HOUSING_CAPACITY) && (
                        <span className="text-red-500 text-sm ml-2 font-bold">(OVERCROWDED)</span>
                    )}
                </h2>
                {stage >= 2 && (
                    currentView === "world" ? renderWorldGrid() : renderSettlementGrid(...currentView.split(',').map(Number))
                )}
            </div>

            {/* Ledger Area */}
            <div className="col-span-1 bg-black border border-green-800 p-4 rounded flex flex-col gap-2">
                <h2 className="text-xl font-bold border-b border-green-800 pb-2">Kingdom Ledger</h2>
                <div className="flex justify-between"><span>Stage:</span> <span>{stage}</span></div>
                <div className="flex justify-between"><span>BP:</span> <span>{stage >= 3 ? bp : "???"}</span></div>
                <div className="flex justify-between"><span>Unrest:</span> <span>{stage >= 3 ? unrest : "???"}</span></div>
                <div className="flex justify-between"><span>XP:</span> <span>{stage >= 3 ? xp : "???"}</span></div>
                <div className="flex justify-between"><span>Tick:</span> <span>{stage >= 3 ? tickCount : "???"}</span></div>

                {currentView !== "world" && stage >= 2 && world[currentView.split(',')[1]][currentView.split(',')[0]]?.settlement && (
                    <>
                        <div className="border-t border-green-800 mt-2 pt-2"></div>
                        <div className="flex justify-between"><span>Res. Lots:</span> <span>{world[currentView.split(',')[1]][currentView.split(',')[0]].settlement.resLots}</span></div>
                        <div className="flex justify-between"><span>Other Lots:</span> <span>{world[currentView.split(',')[1]][currentView.split(',')[0]].settlement.otherLots}</span></div>
                    </>
                )}
            </div>
        </div>

        {/* Log Area */}
        <div className="w-full max-w-4xl bg-black border border-green-800 p-4 rounded h-48 overflow-y-auto mb-4">
            {logs.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
            ))}
            <div ref={logEndRef} />
        </div>

        {/* Controls */}
        <div className="w-full max-w-4xl flex justify-center gap-4">
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
            {stage >= 2 && currentView !== "world" && (
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
