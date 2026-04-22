import { STRUCTURES_DB } from '../frontend/src/library.js';

function simulateHelpBuild(structureName) {
    const structure = STRUCTURES_DB[structureName];
    // Required progress is dynamically calculated based on total material cost
    const requiredProgress = (structure.cost_timber || 0) + (structure.cost_rations || 0) + (structure.cost_stone || 0);

    // Scenario 1: Never click "Help Build" (Passive only)
    // Passive builder yields 1 progress per second
    const timeNeverClick = requiredProgress;

    // Scenario 2: Click every second (Optimal spam)
    // Interval for Help Build is 50ms * 100 = 5 seconds to complete.
    // It yields +2 progress every 5 seconds.
    let currentProgress = 0;
    let ticks = 0; // Each tick is 1 second
    let nextHelpBuildTime = 5;

    while (currentProgress < requiredProgress) {
        ticks++;
        currentProgress += 1; // Passive builder

        if (ticks === nextHelpBuildTime) {
            currentProgress += 2; // Help build burst
            nextHelpBuildTime += 5; // Ready for next burst after 5 seconds
        }
    }
    const timeClickOptimal = ticks;

    return {
        structureName,
        requiredProgress,
        timeNeverClick,
        timeClickOptimal,
        timeSaved: timeNeverClick - timeClickOptimal
    };
}

const result = simulateHelpBuild("castle");
console.log(`Simulation for ${result.structureName.toUpperCase()}:`);
console.log(`- Required Progress: ${result.requiredProgress}`);
console.log(`- Time if never click: ${result.timeNeverClick} seconds`);
console.log(`- Time if click every second optimally: ${result.timeClickOptimal} seconds`);
console.log(`- Total time saved by frantic clicking: ${result.timeSaved} seconds`);
