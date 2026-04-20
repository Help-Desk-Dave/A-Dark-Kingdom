const fs = require('fs');
const file = 'frontend/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. imports
if(!content.includes("Coins, Lock, Info, Apple, Gem")) {
    content = content.replace(
        "import { Terminal, Map as MapIcon, Home, Compass, User, AlertCircle, Building, TreePine, Hammer, Menu } from 'lucide-react';",
        "import { Terminal, Map as MapIcon, Home, Compass, User, AlertCircle, Building, TreePine, Hammer, Menu, Apple, Gem, Coins, Lock, Info } from 'lucide-react';"
    );
}

// 2. handleBuild
const handleBuildRegex = /const handleBuild = \(structureName, x, y\) => \{[\s\S]*?addLog\(`\[\*\] Started construction of \$\{structureName\} at \$\{x\},\$\{y\}\.`\);\n        \}\);\n    \};/;

const newHandleBuild = `const handleBuild = (structureName, x, y) => {
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
            addLog(\`[-] Unknown structure: \${structureName}\`);
            return;
        }

        const cost_timber = structure.cost_timber || 0;
        const cost_rations = structure.cost_rations || 0;
        const cost_stone = structure.cost_stone || 0;
        const cost_bp = structure.cost_bp || 0;

        if (timber < cost_timber || rations < cost_rations || stone < cost_stone || bp < cost_bp) {
            addLog(\`[-] Cannot afford \${structureName}. Need: \${cost_timber} Timber, \${cost_rations} Rations, \${cost_stone} Stone, \${cost_bp} BP.\`);
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
                    addLog(\`[-] Cannot build at \${x},\${y}: Space is blocked or out of bounds.\`);
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
                        addLog(\`[-] Cannot build \${structureName} at \${x},\${y}: Need 2 contiguous lots.\`);
                        refundResources();
                        return;
                    }
                }
            } else if (lotsNeeded === 4) {
                if (isBlocked(x, y) || isBlocked(x + 1, y) || isBlocked(x, y + 1) || isBlocked(x + 1, y + 1)) {
                    addLog(\`[-] Cannot build \${structureName} at \${x},\${y}: 2x2 area is not clear or goes out of bounds.\`);
                    refundResources();
                    return;
                }
                positionsToFill = [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]];
            }

            const isRes = structure.traits.includes("residential");

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
            addLog(\`[*] Started construction of \${structureName} at \${x},\${y}.\`);
        });
    };`;

content = content.replace(handleBuildRegex, newHandleBuild);

// 3. renderBuildMenu
// The original unedited renderBuildMenu ends around line 980 in the unedited version. We will replace exactly from 'const renderBuildMenu = () => {' to '        );\\n    };'
// Then append it back.
const originalRenderBuildMenuRegex = /const renderBuildMenu = \(\) => \{[\s\S]*?className="bg-green-900 hover:bg-green-700 text-white px-3 py-1 font-bold border border-green-500 whitespace-nowrap ml-4"[\s\S]*?>[\s\S]*?Build[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?\)\)[\s\S]*?\}[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\)[\s\S]*?\}[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\);[\s\S]*?\};/;

const newRenderBuildMenu = `const renderBuildMenu = () => {
        if (!buildMenuTarget) return null;
        const { x, y } = buildMenuTarget;

        const categories = [
            { id: "residential", label: "Residential", icon: <Home size={16} /> },
            { id: "edifice", label: "Edifice", icon: <Building size={16} /> },
            { id: "yard", label: "Yard", icon: <TreePine size={16} /> },
            { id: "building", label: "General Building", icon: <Hammer size={16} /> }
        ];

        const hasPrerequisite = (structName) => {
            if (structName === 'lumberyard') {
                let hasPier = false;
                for (let wy = 0; wy < world.length; wy++) {
                    for (let wx = 0; wx < world[wy].length; wx++) {
                        const cell = world[wy][wx];
                        if (cell.settlement) {
                            for (let cy = 0; cy < 5; cy++) {
                                for (let cx = 0; cx < 5; cx++) {
                                    if (cell.settlement.grid[cy][cx] === 'pier') {
                                        hasPier = true;
                                        break;
                                    }
                                }
                                if (hasPier) break;
                            }
                        }
                        if (hasPier) break;
                    }
                    if (hasPier) break;
                }
                return { met: hasPier, reason: "Requires a Pier in the Kingdom" };
            }
            return { met: true, reason: "" };
        };

        return (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 border-2 border-blue-500 p-6 max-w-4xl w-full max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-blue-400">
                            {buildMenuCategory ? \`Build \${buildMenuCategory} at (\${x},\${y})\` : \`Select Category to Build at (\${x},\${y})\`}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(STRUCTURES_DB)
                                    .filter(([key, struct]) => {
                                        if (buildMenuCategory === "residential") return struct.traits.includes("residential");
                                        if (buildMenuCategory === "edifice") return struct.traits.includes("edifice");
                                        if (buildMenuCategory === "yard") return struct.traits.includes("yard");
                                        return struct.traits.includes("building") && !struct.traits.includes("residential") && !struct.traits.includes("edifice");
                                    })
                                    .map(([key, struct]) => {
                                        const cTimber = struct.cost_timber || 0;
                                        const cRations = struct.cost_rations || 0;
                                        const cStone = struct.cost_stone || 0;
                                        const cBp = struct.cost_bp || 0;

                                        const affordTimber = timber >= cTimber;
                                        const affordRations = rations >= cRations;
                                        const affordStone = stone >= cStone;
                                        const affordBp = bp >= cBp;
                                        const canAfford = affordTimber && affordRations && affordStone && affordBp;

                                        const prereq = hasPrerequisite(key);
                                        const canBuild = canAfford && prereq.met;

                                        const lotsBadge = struct.lots === 1 ? "1x1" : (struct.lots === 2 ? "1x2" : "2x2");

                                        return (
                                            <div key={key} className="bg-black border-2 border-gray-700 p-4 flex flex-col justify-between hover:border-blue-400 transition-colors rounded group relative">
                                                <div className="mb-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="font-bold text-white capitalize text-lg flex items-center gap-2">
                                                            {key}
                                                            {!prereq.met && <Lock size={16} className="text-red-500" title="Locked" />}
                                                        </div>
                                                        <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded font-mono border border-gray-600">
                                                            {lotsBadge}
                                                        </span>
                                                    </div>

                                                    <div className="text-sm text-gray-400 italic mb-3">{struct.desc}</div>

                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        {struct.production && Object.entries(struct.production).map(([res, val]) => (
                                                            <span key={res} className="bg-green-900/50 text-green-300 text-xs px-2 py-1 rounded flex items-center gap-1 border border-green-800">
                                                                <Info size={12} /> +{val} {res}/Day
                                                            </span>
                                                        ))}
                                                        {struct.traits && struct.traits.includes("residential") && (
                                                            <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-1 rounded flex items-center gap-1 border border-blue-800">
                                                                <Home size={12} /> Provides Housing
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm mt-auto border-t border-gray-800 pt-3">
                                                        {cTimber > 0 && (
                                                            <div className={\`flex items-center gap-1 \${affordTimber ? 'text-gray-300' : 'text-red-500 font-bold'}\`} title="Timber">
                                                                <TreePine size={14} /> {cTimber}
                                                            </div>
                                                        )}
                                                        {cRations > 0 && (
                                                            <div className={\`flex items-center gap-1 \${affordRations ? 'text-gray-300' : 'text-red-500 font-bold'}\`} title="Rations">
                                                                <Apple size={14} /> {cRations}
                                                            </div>
                                                        )}
                                                        {cStone > 0 && (
                                                            <div className={\`flex items-center gap-1 \${affordStone ? 'text-gray-300' : 'text-red-500 font-bold'}\`} title="Stone">
                                                                <Gem size={14} /> {cStone}
                                                            </div>
                                                        )}
                                                        {cBp > 0 && (
                                                            <div className={\`flex items-center gap-1 \${affordBp ? 'text-gray-300' : 'text-red-500 font-bold'}\`} title="BP (Influence)">
                                                                <Coins size={14} /> {cBp}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-auto">
                                                    {!prereq.met ? (
                                                        <div className="text-red-500 text-sm font-bold bg-red-950/30 p-2 rounded text-center border border-red-900">
                                                            Requires: {prereq.reason}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                handleBuild(key, x, y);
                                                                closeBuildMenu();
                                                            }}
                                                            disabled={!canAfford}
                                                            className={\`w-full py-2 font-bold border rounded transition-colors \${
                                                                canAfford
                                                                    ? 'bg-green-900 hover:bg-green-700 text-white border-green-500'
                                                                    : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                                                            }\`}
                                                        >
                                                            {canAfford ? 'Build' : 'Cannot Afford'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };`;

content = content.replace(originalRenderBuildMenuRegex, newRenderBuildMenu);

fs.writeFileSync(file, content, 'utf8');
