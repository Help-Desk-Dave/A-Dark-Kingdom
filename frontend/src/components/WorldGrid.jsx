import React from 'react';
import { FLAVORS } from '../library';

const WorldGrid = ({
    world,
    stage,
    flavor,
    setInspectorHex,
    setInspectorPop,
    setInspectorPlot,
    handleReconnoiter,
    handleClaim,
    setCurrentView
}) => {
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
                        <button
                            key={`${x}-${y}`}
                            type="button"
                            aria-label="World Hex"
                            className={`w-12 h-12 flex items-center justify-center text-base cursor-pointer hover:border ${FLAVORS[flavor].color.replace("text-", "border-").replace("500", "400")} ${colorClass} focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-none`}
                            onClick={() => {
                                if (stage >= 3) {
                                    setInspectorHex({ x, y, ...hex });
                                    setInspectorPop(null); // Clear any open pop inspector
                                    setInspectorPlot(null);

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
                        </button>
                    );
                })
            ))}
        </div>
    );
};

export default WorldGrid;
