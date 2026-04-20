const fs = require('fs');

const file = 'frontend/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// I see what happened. My script replaced the renderBuildMenu correctly but then it looks like some extra lines got left behind or were duplicated below it.
// The stray lines:
//  1110                                        setCurrentView("5,5");
//  1111                                        setWorld(newWorld);
//  1112                                    }}
//  1113                                    className="bg-green-900 text-black px-4 py-2 font-bold hover:bg-green-700 rounded flex items-center gap-2"
//  1114                                >
//  1115                                    <Home size={16} /> Establish Camp

// That implies my regex accidentally chewed up the 'Establish Camp' button logic that comes AFTER the build menu, OR it replaced it incorrectly.

// Let's do a fresh checkout and use a much simpler exact string replacement on renderBuildMenu.
