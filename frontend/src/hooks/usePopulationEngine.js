import { useState, useEffect, useRef } from 'react';

const NAMES = ["Algar", "Bryn", "Cael", "Doran", "Elara", "Fen", "Gael", "Halia", "Ivor", "Jarek"];
const DIALOGUE_CHANCE = 0.05;
const STATE_CHANGE_CHANCE = 0.1;

export const usePopulationEngine = (world, stage, HOUSING_CAPACITY, onPopsMove) => {
    const [pops, setPops] = useState([]);
    const popIdCounter = useRef(0);

    // Initialization / Synchronization with World
    useEffect(() => {
        if (stage < 2) return;

        setPops(prevPops => {
            let nextPops = [...prevPops];
            let popsBySettlement = {};

            // Group existing pops by settlement
            nextPops.forEach(p => {
                const key = `${p.settlementCoords.sx},${p.settlementCoords.sy}`;
                if (!popsBySettlement[key]) popsBySettlement[key] = [];
                popsBySettlement[key].push(p);
            });

            world.forEach((row, sy) => {
                row.forEach((hex, sx) => {
                    if (hex.status === 2 && hex.settlement) {
                        const expectedPopCount = hex.settlement.resLots * HOUSING_CAPACITY;
                        const key = `${sx},${sy}`;
                        let currentPops = popsBySettlement[key] || [];

                        if (currentPops.length < expectedPopCount) {
                            // Spawn new pops
                            for (let i = currentPops.length; i < expectedPopCount; i++) {
                                // Find random valid coordinates (within 5x5)
                                const hx = Math.floor(Math.random() * 5);
                                const hy = Math.floor(Math.random() * 5);
                                let wx = Math.floor(Math.random() * 5);
                                let wy = Math.floor(Math.random() * 5);

                                // Make sure work is not exactly same as home if possible, though it's fine if they are
                                if (wx === hx && wy === hy) {
                                    wx = (wx + 1) % 5;
                                }

                                const newPop = {
                                    id: popIdCounter.current++,
                                    name: NAMES[Math.floor(Math.random() * NAMES.length)],
                                    settlementCoords: { sx, sy },
                                    homeCoords: { x: hx, y: hy },
                                    workCoords: { x: wx, y: wy },
                                    currentCoords: { x: hx, y: hy }, // Start at home
                                    state: 'home',
                                    dialogue: null,
                                    dialogueTimer: 0
                                };
                                currentPops.push(newPop);
                            }
                        } else if (currentPops.length > expectedPopCount) {
                            // Remove excess pops (e.g. if residential lots were destroyed, though game doesn't support that yet)
                            currentPops = currentPops.slice(0, expectedPopCount);
                        }
                        popsBySettlement[key] = currentPops;
                    }
                });
            });

            // Reconstruct flat array
            let updatedPops = [];
            Object.values(popsBySettlement).forEach(pArr => updatedPops.push(...pArr));
            return updatedPops;
        });

    }, [world, stage, HOUSING_CAPACITY]);

    // The Action Loop
    useEffect(() => {
        if (stage < 2) return;

        const interval = setInterval(() => {
            setPops(prevPops => {
                let newlyMoved = []; // Array to track pop movement
                const updatedPops = prevPops.map(pop => {
                    let nextPop = { ...pop };

                    // 1. Dialogue Engine
                    if (nextPop.dialogueTimer > 0) {
                        nextPop.dialogueTimer--;
                        if (nextPop.dialogueTimer <= 0) {
                            nextPop.dialogue = null;
                        }
                    } else if (Math.random() < DIALOGUE_CHANCE) {
                        // Emit dialogue
                        let messages = [];
                        if (nextPop.state === 'home') messages = ["Resting...", "Home sweet home.", "Zzz..."];
                        else if (nextPop.state === 'working') messages = ["Work work.", "Hard at work.", "Building the kingdom."];
                        else if (nextPop.state === 'commuting_to_work') messages = ["Off to work.", "Morning commute.", "Late again!"];
                        else if (nextPop.state === 'commuting_to_home') messages = ["Heading home.", "Long day.", "Finally done."];

                        if (messages.length > 0) {
                            nextPop.dialogue = messages[Math.floor(Math.random() * messages.length)];
                            nextPop.dialogueTimer = 3; // Keep dialogue for 3 ticks (3 seconds)
                        }
                    }

                    // 2. State Transitions & Pathfinding
                    if (nextPop.state === 'home') {
                        if (Math.random() < STATE_CHANGE_CHANCE) {
                            nextPop.state = 'commuting_to_work';
                        }
                    } else if (nextPop.state === 'working') {
                        if (Math.random() < STATE_CHANGE_CHANCE) {
                            nextPop.state = 'commuting_to_home';
                        }
                    } else if (nextPop.state === 'commuting_to_work') {
                        let dx = Math.sign(nextPop.workCoords.x - nextPop.currentCoords.x);
                        let dy = Math.sign(nextPop.workCoords.y - nextPop.currentCoords.y);

                        // Move one tile
                        if (dx !== 0) {
                            nextPop.currentCoords.x += dx;
                            newlyMoved.push({ ...nextPop });
                        } else if (dy !== 0) {
                            nextPop.currentCoords.y += dy;
                            newlyMoved.push({ ...nextPop });
                        } else {
                            // Arrived
                            nextPop.state = 'working';
                        }
                    } else if (nextPop.state === 'commuting_to_home') {
                        let dx = Math.sign(nextPop.homeCoords.x - nextPop.currentCoords.x);
                        let dy = Math.sign(nextPop.homeCoords.y - nextPop.currentCoords.y);

                        // Move one tile
                        if (dx !== 0) {
                            nextPop.currentCoords.x += dx;
                            newlyMoved.push({ ...nextPop });
                        } else if (dy !== 0) {
                            nextPop.currentCoords.y += dy;
                            newlyMoved.push({ ...nextPop });
                        } else {
                            // Arrived
                            nextPop.state = 'home';
                        }
                    }

                    return nextPop;
                });

                // Do not invoke onPopsMove synchronously here because calling a state setter inside a state setter is bad practice.
                // We'll queue the invocation via setTimeout to avoid interfering with pure React state cycles.
                if (newlyMoved.length > 0 && onPopsMove) {
                    setTimeout(() => onPopsMove(newlyMoved), 0);
                }

                return updatedPops;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [stage, onPopsMove]);

    return { pops };
};
