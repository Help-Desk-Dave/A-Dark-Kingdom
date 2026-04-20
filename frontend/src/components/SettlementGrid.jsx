import React from 'react';
import { HOUSING_CAPACITY, FLAVORS } from '../library';

const SettlementGrid = ({
    sx,
    sy,
    world,
    pops,
    constructionQueue,
    stage,
    flavor,
    setBuildMenuTarget,
    setInspectorPlot,
    setInspectorHex,
    setInspectorPop
}) => {
    const settlement = world[sy][sx].settlement;
    if (!settlement) return <div className="text-gray-500 p-4">No settlement here.</div>;

    const isOvercrowded = settlement.resLots < Math.floor(settlement.otherLots / HOUSING_CAPACITY);

    const localPops = pops.filter(p => p.settlementCoords.sx === sx && p.settlementCoords.sy === sy);

    return (
        <div className={`grid grid-cols-5 gap-2 w-fit bg-black p-4 border ${isOvercrowded ? 'border-red-600' : 'border-blue-800'}`}>
            {settlement.grid.map((row, y) => (
                row.map((cell, x) => {
                    const activeJob = constructionQueue.find(job =>
                        job.sx === sx && job.sy === sy && job.positionsToFill.some(p => p[0] === x && p[1] === y)
                    );

                    if (activeJob) {
                        const percent = Math.floor((activeJob.progress / activeJob.requiredProgress) * 100);
                        return (
                            <div
                                key={`${x}-${y}`}
                                className="w-16 h-16 border-2 border-yellow-500 bg-yellow-900 flex items-center justify-center text-xs font-bold text-yellow-100 cursor-not-allowed bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.2)_10px,rgba(0,0,0,0.2)_20px)]"
                                title={`Building ${activeJob.structureName}: ${percent}%`}
                            >
                                {percent}%
                            </div>
                        );
                    }
                    // Check if cell is under construction
                    const job = constructionQueue.find(q =>
                        q.sx === sx &&
                        q.sy === sy &&
                        q.positionsToFill.some(([px, py]) => px === x && py === y)
                    );

                    if (job) {
                        const percent = Math.floor((job.progress / job.requiredProgress) * 100);
                        return (
                            <div
                                key={`${x}-${y}`}
                                className="w-16 h-16 border border-yellow-500 flex items-center justify-center bg-yellow-900 text-xs text-center cursor-not-allowed flex-col"
                                style={{
                                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.2) 5px, rgba(0,0,0,0.2) 10px)"
                                }}
                            >
                                {job.active ? (
                                    <span className="text-white font-bold bg-black/50 px-1 rounded">{percent}%</span>
                                ) : (
                                    <span className="text-red-500 font-bold leading-tight bg-black/50 px-1 rounded">Awaiting Builder</span>
                                )}
                            </div>
                        );
                    }
                    const cellPops = localPops.filter(p => p.currentCoords.x === x && p.currentCoords.y === y);
                    const isPath = settlement.pathValues && settlement.pathValues[y] && settlement.pathValues[y][x] > 5;

                    return (
                        <div
                            key={`${x}-${y}`}
                            className={`relative w-16 h-16 border border-gray-700 flex items-center justify-center ${isPath ? 'bg-orange-900/40' : 'bg-gray-900'} text-base cursor-pointer ${FLAVORS[flavor].hover}`}
                            onClick={() => {
                                if (stage >= 2 && cell === null && !job) {
                                    setBuildMenuTarget({ x, y });
                                } else if (stage >= 2 && cell !== null && !job) {
                                    setInspectorPlot({ x, y, sx, sy, building: cell });
                                    setInspectorHex(null);
                                    setInspectorPop(null);
                                }
                            }}
                        >
                            {cell ? <span className="bg-blue-800 text-white p-1 font-bold" title={cell}>{cell.charAt(0).toUpperCase()}</span> : <span className="text-gray-600">[ ]</span>}
                            {cellPops.map((p, idx) => (
                                <div key={p.id} className="absolute flex flex-col items-center" style={{ bottom: `${2 + idx * 4}px`, right: `${2 + idx * 4}px` }}>
                                    {p.dialogue && (
                                        <div className="absolute bottom-full mb-1 text-[10px] bg-white text-black p-1 rounded whitespace-nowrap z-10 font-bold border border-gray-400">
                                            {p.dialogue}
                                        </div>
                                    )}
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full border border-yellow-700" title={`${p.name} (${p.state})`} />
                                </div>
                            ))}
                        </div>
                    );
                })
            ))}
        </div>
    );
};

export default SettlementGrid;
