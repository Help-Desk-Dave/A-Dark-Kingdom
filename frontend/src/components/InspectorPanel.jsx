import React from 'react';
import { FLAVORS, HOUSING_CAPACITY } from '../library';

const InspectorPanel = ({
    inspectorHex,
    inspectorPop,
    inspectorPlot,
    setInspectorHex,
    setInspectorPop,
    setInspectorPlot,
    flavor,
    pops
}) => {
    if (!inspectorHex && !inspectorPop && !inspectorPlot) return null;


    const assignedPops = inspectorPlot ? pops.filter(p =>
        p.settlementCoords.sx === inspectorPlot.sx &&
        p.settlementCoords.sy === inspectorPlot.sy &&
        ((p.homeCoords && p.homeCoords.x === inspectorPlot.x && p.homeCoords.y === inspectorPlot.y) ||
         (p.workCoords && p.workCoords.x === inspectorPlot.x && p.workCoords.y === inspectorPlot.y))
    ) : [];

    return (

        <div className={`w-full md:w-64 flex-shrink-0 bg-black border ${FLAVORS[flavor].border} p-4 rounded flex flex-col gap-2 animate-[slideIn_0.3s_ease-out]`}>
            <div className={`flex justify-between items-center border-b ${FLAVORS[flavor].border} pb-2`}>
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
                        {assignedPops.length > 0 ? (
                            assignedPops.map(p => (
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
    );
};

export default InspectorPanel;
