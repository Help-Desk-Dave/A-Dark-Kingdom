export const KingdomLedger = ({
    bpShake,
    FLAVORS,
    flavor,
    stage,
    ruler,
    advisors,
    setInspectorPop,
    setInspectorHex,
    setInspectorPlot,
    gameTime,
    bpFlash,
    bp,
    timber,
    rations,
    stone,
    unrest,
    xp,
    tickCount,
    vibeMode,
    currentView,
    world
}) => {
    return (
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
                        <button
                            key={role}
                            type="button"
                            aria-label={`Inspect ${role} advisor`}
                            onClick={() => {
                                setInspectorPop({ role, ...advisor });
                                setInspectorHex(null); // Clear hex inspector
                                setInspectorPlot(null);
                            }}
                            className="text-sm cursor-pointer hover:text-yellow-400 text-gray-300 text-left w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-none"
                        >
                            - {role}: {advisor.name} <span className="text-gray-500 text-xs">(Attr: {advisor.attribute})</span>
                        </button>
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
    );
};
