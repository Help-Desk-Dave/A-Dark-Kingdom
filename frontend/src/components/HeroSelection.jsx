import React from 'react';
import { KINGMAKER_BACKGROUNDS } from '../library';

const HeroSelection = ({ showHeroSelection, setShowHeroSelection, setRuler, setStage, addLog }) => {
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

export default HeroSelection;
