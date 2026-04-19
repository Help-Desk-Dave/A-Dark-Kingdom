import React from 'react';
import { Home, Building, TreePine, Hammer } from 'lucide-react';
import { STRUCTURES_DB } from '../library';

const BuildMenu = ({ buildMenuTarget, buildMenuCategory, setBuildMenuCategory, closeBuildMenu, handleBuild }) => {
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
                                            Build
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

export default BuildMenu;
