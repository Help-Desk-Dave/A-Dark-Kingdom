import React from 'react';
import { Menu } from 'lucide-react';

const GameMenu = ({ isMenuOpen, setIsMenuOpen, setStage, setShowHeroSelection, addLog }) => {
    return (
        <div className="absolute top-4 right-4 z-50">
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-white transition-colors"
                aria-label="Toggle Game Menu"
            >
                <Menu size={24} />
            </button>

            {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-600 rounded shadow-xl flex flex-col p-2 gap-2">
                    <button
                        onClick={() => {
                            const keysToRemove = [];
                            for (let i = 0; i < localStorage.length; i++) {
                                const key = localStorage.key(i);
                                if (key && key.startsWith('adk_')) {
                                    keysToRemove.push(key);
                                }
                            }
                            keysToRemove.forEach(k => localStorage.removeItem(k));
                            window.location.reload();
                        }}
                        className="w-full text-left p-2 hover:bg-red-900 text-red-400 font-bold border border-transparent hover:border-red-500 rounded transition-colors"
                    >
                        Restart Game
                    </button>

                    <button
                        onClick={() => {
                            setStage(3);
                            setShowHeroSelection(true);
                            setIsMenuOpen(false);
                            addLog("[*] DEBUG: Fast-forwarded to Hero Selection via Game Menu.");
                        }}
                        className="w-full text-left p-2 hover:bg-yellow-900 text-yellow-400 font-bold border border-transparent hover:border-yellow-500 rounded transition-colors"
                    >
                        Debug: Skip to Hero Selection
                    </button>
                </div>
            )}
        </div>
    );
};

export default GameMenu;
