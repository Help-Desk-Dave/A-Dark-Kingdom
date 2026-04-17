import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, AlertTriangle, Coins, Wheat, Users, Search, Flag, Construction, Crown } from 'lucide-react';
import { INITIAL_STATE, processTick, FLAVORS, STRUCTURES_DB } from './Logic';

function App() {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('darkKingdomState');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  const [selectedHex, setSelectedHex] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);
  const logEndRef = useRef(null);

  // Save to localStorage on state change
  useEffect(() => {
    localStorage.setItem('darkKingdomState', JSON.stringify(state));
  }, [state]);

  // Scroll to bottom of log
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.log]);

  // Monthly Tick Simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setState(prevState => processTick({ ...prevState }));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleReconnoiter = (x, y) => {
    if (state.bp >= 5) {
      setState(prevState => {
        const next = { ...prevState, bp: prevState.bp - 5 };
        next.world[y][x].status = 1;
        next.log = [...next.log, `[+] Reconnoitered (${x},${y}). Found ${next.world[y][x].terrain}.`];
        return next;
      });
      setSelectedHex(null);
    } else {
      setState(prevState => ({
        ...prevState,
        log: [...prevState.log, "[-] Treasurer: 'We cannot afford to map that area (5 BP required).'"]
      }));
    }
  };

  const handleClaim = (x, y) => {
    if (state.bp >= 10) {
      setState(prevState => {
        const next = { ...prevState, bp: prevState.bp - 10, xp: prevState.xp + 10 };
        next.world[y][x].status = 2;
        next.log = [...next.log, `[+] Claimed (${x},${y}). Kingdom expanded.`];
        return next;
      });
      setSelectedHex(null);
    } else {
      setState(prevState => ({
        ...prevState,
        log: [...prevState.log, "[-] Treasurer: 'Claiming land requires 10 BP.'"]
      }));
    }
  };

  const handleBuild = (structureKey) => {
    const structure = STRUCTURES_DB[structureKey];
    if (!selectedLot) return;
<<<<<<< HEAD

=======
<<<<<<< HEAD

=======

>>>>>>> origin/feat/vite-react-frontend-7468165478531852990
>>>>>>> jules-7468165478531852990-94aa9d18
    const { x, y } = selectedLot;
    const requiredLots = structure.lots || 1;

    // Check bounds and collisions based on lot size
    let canBuild = true;
    let targetLots = [];

    if (requiredLots === 1) {
        if (state.capitalGrid[y][x] !== null) canBuild = false;
        else targetLots.push({x, y});
    } else if (requiredLots === 2) {
        // Try horizontal (1x2) first, then vertical (2x1)
        if (x + 1 < 5 && state.capitalGrid[y][x] === null && state.capitalGrid[y][x+1] === null) {
            targetLots.push({x, y}, {x: x+1, y});
        } else if (y + 1 < 5 && state.capitalGrid[y][x] === null && state.capitalGrid[y+1][x] === null) {
            targetLots.push({x, y}, {x, y: y+1});
        } else {
            canBuild = false;
        }
    } else if (requiredLots === 4) {
        // 2x2
        if (x + 1 < 5 && y + 1 < 5 &&
            state.capitalGrid[y][x] === null && state.capitalGrid[y][x+1] === null &&
            state.capitalGrid[y+1][x] === null && state.capitalGrid[y+1][x+1] === null) {
            targetLots.push({x, y}, {x: x+1, y}, {x, y: y+1}, {x: x+1, y: y+1});
        } else {
            canBuild = false;
        }
    }

    if (!canBuild) {
        setState(prevState => ({
            ...prevState,
            log: [...prevState.log, `[-] Builders: 'Not enough continuous space for a ${structureKey}.'`]
        }));
        return;
    }
<<<<<<< HEAD

=======
<<<<<<< HEAD

=======

>>>>>>> origin/feat/vite-react-frontend-7468165478531852990
>>>>>>> jules-7468165478531852990-94aa9d18
    if (state.bp >= structure.cost_rp) {
      setState(prevState => {
        // Deep copy capitalGrid to avoid direct state mutation issues
        const newGrid = prevState.capitalGrid.map(row => [...row]);
        targetLots.forEach(lot => {
            newGrid[lot.y][lot.x] = structureKey;
        });

        const next = { ...prevState, bp: prevState.bp - structure.cost_rp, capitalGrid: newGrid };
        next.log = [...next.log, `[+] Built ${structureKey} starting at lot (${x},${y}).`];
        return next;
      });
      setSelectedLot(null);
    } else {
        setState(prevState => ({
            ...prevState,
            log: [...prevState.log, `[-] Treasurer: 'Cannot afford ${structureKey} (${structure.cost_rp} BP).'`]
        }));
    }
  };

  // Advisors assignment (simplified for UI)
  const assignAdvisor = (role) => {
    if (state.pops.length === 0) return;
    const availablePops = state.pops.filter(p => p !== state.advisors.general && p !== state.advisors.treasurer && p !== state.advisors.diplomat);
    if (availablePops.length === 0) return;
<<<<<<< HEAD

=======
<<<<<<< HEAD

=======

>>>>>>> origin/feat/vite-react-frontend-7468165478531852990
>>>>>>> jules-7468165478531852990-94aa9d18
    const assignedPop = availablePops[0];
    setState(prevState => ({
        ...prevState,
        advisors: { ...prevState.advisors, [role]: assignedPop },
        log: [...prevState.log, `[+] Assigned ${assignedPop.name} as ${role}.`]
    }));
  };

  const flavor = FLAVORS[state.flavor] || FLAVORS["swamp"];

  // Calculating capacity
  let capacity = 0;
  for(let y=0; y<5; y++){
      for(let x=0; x<5; x++){
          if(state.capitalGrid[y][x] === "houses") capacity += 4;
      }
  }

  const isOvercrowded = state.pops.length > capacity;
  const isBPLow = state.bp < 15;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Bar / Dashboard */}
      <div className={`p-4 bg-gray-800 border-b-4 border-${flavor.color}-600 flex justify-between items-center shadow-md z-10`}>
        <div className="flex items-center space-x-2">
            <Crown className={`text-${flavor.color}-400`} />
            <h1 className="text-xl font-bold uppercase tracking-wider">{state.name}</h1>
            <span className="text-sm text-gray-400 italic">{flavor.text_suffix}</span>
        </div>
        <div className="flex space-x-6">
            <div className={`flex items-center space-x-1 ${isBPLow ? 'text-red-400 font-bold animate-pulse' : 'text-yellow-400'}`}>
                <Coins size={18} />
                <span>BP: {state.bp}</span>
            </div>
            <div className="flex items-center space-x-1 text-green-400">
                <Wheat size={18} />
                <span>Food: {state.food}</span>
            </div>
            <div className="flex items-center space-x-1 text-red-500">
                <ShieldAlert size={18} />
                <span>Unrest: {state.unrest}</span>
            </div>
            <div className={`flex items-center space-x-1 ${isOvercrowded ? 'text-red-400' : 'text-blue-400'}`}>
                <Users size={18} />
                <span>Pops: {state.pops.length} / {capacity}</span>
                {isOvercrowded && <AlertTriangle size={16} className="text-red-500 ml-1 animate-pulse" title="OVERCROWDED" />}
            </div>
        </div>
      </div>

      {isBPLow && (
          <div className="bg-red-900 text-red-100 px-4 py-2 text-center text-sm font-bold shadow-inner">
              ⚠️ TREASURER'S ALERT: Treasury reserves dangerously low! Build infrastructure or assign a strong Treasurer to avoid ruin.
          </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
<<<<<<< HEAD

        {/* Left Column: Maps */}
        <div className="flex-1 p-4 overflow-y-auto space-y-6">

=======
<<<<<<< HEAD

        {/* Left Column: Maps */}
        <div className="flex-1 p-4 overflow-y-auto space-y-6">

=======

        {/* Left Column: Maps */}
        <div className="flex-1 p-4 overflow-y-auto space-y-6">

>>>>>>> origin/feat/vite-react-frontend-7468165478531852990
>>>>>>> jules-7468165478531852990-94aa9d18
            {/* World Map Section */}
            <div className="bg-gray-800 rounded p-4 shadow">
                <h2 className="text-lg font-bold mb-2 border-b border-gray-700 pb-1 flex justify-between">
                    <span>World Map (Stolen Lands)</span>
                    <span className="text-sm font-normal text-gray-400">Year {Math.floor(state.tickCount / 12)}, Month {(state.tickCount % 12) + 1}</span>
                </h2>
                <div className="grid grid-cols-10 gap-1 w-max mx-auto mt-4">
<<<<<<< HEAD
                    {state.world.map((row, y) =>
=======
<<<<<<< HEAD
                    {state.world.map((row, y) =>
=======
                    {state.world.map((row, y) =>
>>>>>>> origin/feat/vite-react-frontend-7468165478531852990
>>>>>>> jules-7468165478531852990-94aa9d18
                        row.map((hex, x) => (
                            <button
                                key={`${x}-${y}`}
                                onClick={() => setSelectedHex(hex)}
                                className={`w-8 h-8 flex items-center justify-center rounded text-sm
<<<<<<< HEAD
                                    ${hex.status === 0 ? 'bg-gray-700 text-gray-500' :
                                      hex.status === 1 ? 'bg-gray-600 text-white' :
=======
<<<<<<< HEAD
                                    ${hex.status === 0 ? 'bg-gray-700 text-gray-500' :
                                      hex.status === 1 ? 'bg-gray-600 text-white' :
=======
                                    ${hex.status === 0 ? 'bg-gray-700 text-gray-500' :
                                      hex.status === 1 ? 'bg-gray-600 text-white' :
>>>>>>> origin/feat/vite-react-frontend-7468165478531852990
>>>>>>> jules-7468165478531852990-94aa9d18
                                      'bg-yellow-900 border border-yellow-500 text-yellow-300 font-bold'}
                                    hover:bg-gray-500 transition-colors
                                `}
                            >
<<<<<<< HEAD
                                {hex.status === 0 ? '?' :
                                 hex.status === 1 ? flavor[hex.terrain] || '.' :
=======
<<<<<<< HEAD
                                {hex.status === 0 ? '?' :
                                 hex.status === 1 ? flavor[hex.terrain] || '.' :
=======
                                {hex.status === 0 ? '?' :
                                 hex.status === 1 ? flavor[hex.terrain] || '.' :
>>>>>>> origin/feat/vite-react-frontend-7468165478531852990
>>>>>>> jules-7468165478531852990-94aa9d18
                                 '[C]'}
                            </button>
                        ))
                    )}
                </div>

                {/* Hex Context Window */}
                {selectedHex && (
                    <div className="mt-4 p-3 bg-gray-700 rounded flex justify-between items-center animate-fade-in">
                        <div>
                            <span className="font-bold">Hex ({selectedHex.x}, {selectedHex.y})</span>
                            <span className="ml-2 text-sm text-gray-300">
                                Status: {selectedHex.status === 0 ? 'Hidden' : selectedHex.status === 1 ? 'Reconnoitered' : 'Claimed'}
                            </span>
                            {selectedHex.status > 0 && <span className="ml-2 text-sm text-gray-300">Terrain: {selectedHex.terrain}</span>}
                        </div>
                        <div className="space-x-2">
                            {selectedHex.status === 0 && (
                                <button onClick={() => handleReconnoiter(selectedHex.x, selectedHex.y)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm flex items-center shadow">
                                    <Search size={14} className="mr-1"/> Reconnoiter (5 BP)
                                </button>
                            )}
                            {selectedHex.status === 1 && (
                                <button onClick={() => handleClaim(selectedHex.x, selectedHex.y)} className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-sm flex items-center text-black font-bold shadow">
                                    <Flag size={14} className="mr-1"/> Claim (10 BP)
                                </button>
                            )}
                            <button onClick={() => setSelectedHex(null)} className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm">Close</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Urban Grid Section */}
            <div className="bg-gray-800 rounded p-4 shadow">
                <h2 className="text-lg font-bold mb-2 border-b border-gray-700 pb-1">Capital Settlement (5x5)</h2>
                <div className="grid grid-cols-5 gap-2 w-max mx-auto mt-4">
<<<<<<< HEAD
                    {state.capitalGrid.map((row, y) =>
=======
<<<<<<< HEAD
                    {state.capitalGrid.map((row, y) =>
=======
                    {state.capitalGrid.map((row, y) =>
>>>>>>> origin/feat/vite-react-frontend-7468165478531852990
>>>>>>> jules-7468165478531852990-94aa9d18
                        row.map((lot, x) => (
                            <button
                                key={`cap-${x}-${y}`}
                                onClick={() => setSelectedLot({x, y})}
                                className={`w-16 h-16 flex items-center justify-center rounded border-2
                                    ${lot ? 'bg-indigo-900 border-indigo-500' : 'bg-gray-700 border-dashed border-gray-500 text-gray-400'}
                                    hover:border-white transition-colors
                                `}
                            >
                                {lot ? <span className="text-xs text-center font-bold">{lot.substring(0,6)}...</span> : <Construction size={20} className="opacity-50" />}
                            </button>
                        ))
                    )}
                </div>

                {/* Lot Context Window */}
                {selectedLot && (
                    <div className="mt-4 p-3 bg-gray-700 rounded animate-fade-in">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold">Lot ({selectedLot.x}, {selectedLot.y})</span>
                            <button onClick={() => setSelectedLot(null)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        {!state.capitalGrid[selectedLot.y][selectedLot.x] ? (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {Object.keys(STRUCTURES_DB).map(key => (
<<<<<<< HEAD
                                    <button
                                        key={key}
=======
<<<<<<< HEAD
                                    <button
                                        key={key}
=======
                                    <button
                                        key={key}
>>>>>>> origin/feat/vite-react-frontend-7468165478531852990
>>>>>>> jules-7468165478531852990-94aa9d18
                                        onClick={() => handleBuild(key)}
                                        className="text-left px-2 py-1 bg-gray-800 hover:bg-gray-600 rounded text-xs flex justify-between"
                                        title={STRUCTURES_DB[key].desc}
                                    >
                                        <span className="capitalize">{key}</span>
                                        <span className="text-yellow-400">{STRUCTURES_DB[key].cost_rp} BP</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-300 mt-2">
                                Built: <span className="capitalize text-white font-bold">{state.capitalGrid[selectedLot.y][selectedLot.x]}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
<<<<<<< HEAD

=======
<<<<<<< HEAD

=======

>>>>>>> origin/feat/vite-react-frontend-7468165478531852990
>>>>>>> jules-7468165478531852990-94aa9d18
            {/* Advisors Section */}
            <div className="bg-gray-800 rounded p-4 shadow flex justify-between">
                <div>
                    <h3 className="font-bold text-sm text-gray-400 mb-1">General (STR)</h3>
                    {state.advisors.general ? (
                        <div className="text-sm font-bold">{state.advisors.general.name} <span className="text-xs text-gray-400">(STR: {state.advisors.general.strength})</span></div>
                    ) : (
                        <button onClick={() => assignAdvisor('general')} className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600">Assign General</button>
                    )}
                </div>
                <div>
                    <h3 className="font-bold text-sm text-gray-400 mb-1">Treasurer (INT)</h3>
                    {state.advisors.treasurer ? (
                        <div className="text-sm font-bold">{state.advisors.treasurer.name} <span className="text-xs text-gray-400">(INT: {state.advisors.treasurer.intelligence})</span></div>
                    ) : (
                        <button onClick={() => assignAdvisor('treasurer')} className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600">Assign Treasurer</button>
                    )}
                </div>
                <div>
                    <h3 className="font-bold text-sm text-gray-400 mb-1">Diplomat (CHA)</h3>
                    {state.advisors.diplomat ? (
                        <div className="text-sm font-bold">{state.advisors.diplomat.name} <span className="text-xs text-gray-400">(CHA: {state.advisors.diplomat.charisma})</span></div>
                    ) : (
                        <button onClick={() => assignAdvisor('diplomat')} className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600">Assign Diplomat</button>
                    )}
                </div>
            </div>
        </div>

        {/* Right Column: Event Log */}
        <div className="w-1/3 bg-gray-950 p-4 border-l border-gray-700 flex flex-col">
            <h2 className="text-lg font-bold mb-2 border-b border-gray-800 pb-1 text-gray-300 uppercase tracking-widest text-sm">Kingdom Ledger</h2>
            <div className="flex-1 overflow-y-auto space-y-1 font-mono text-xs text-gray-300 pr-2 custom-scrollbar">
                {state.log.map((entry, idx) => {
                    let colorClass = "text-gray-300";
                    if(entry.includes("[-]")) colorClass = "text-red-400";
                    if(entry.includes("[+]")) colorClass = "text-green-400";
                    return (
                        <div key={idx} className={`${colorClass} mb-1 leading-tight`}>
                            {entry}
                        </div>
                    );
                })}
                <div ref={logEndRef} />
            </div>
<<<<<<< HEAD

            {/* Quick Actions / Reset */}
            <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between">
                <button
=======
<<<<<<< HEAD

            {/* Quick Actions / Reset */}
            <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between">
                <button
=======

            {/* Quick Actions / Reset */}
            <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between">
                <button
>>>>>>> origin/feat/vite-react-frontend-7468165478531852990
>>>>>>> jules-7468165478531852990-94aa9d18
                    onClick={() => {
                        if(window.confirm('Are you sure you want to abdicate? This will reset your kingdom.')) {
                            localStorage.removeItem('darkKingdomState');
                            setState(INITIAL_STATE);
                        }
                    }}
                    className="text-xs text-red-500 hover:text-red-300"
                >
                    Abdicate Throne (Reset)
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}

export default App;