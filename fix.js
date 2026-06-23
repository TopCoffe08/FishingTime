const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = content.split('\n');
// Keep only up to line 371
const newLines = lines.slice(0, 371);
// Insert imports at line 14 (index 14)
newLines.splice(14, 0, 
  "import { DashboardTab } from './components/tabs/DashboardTab';",
  "import { SpeciesTab } from './components/tabs/SpeciesTab';",
  "import { LogTab } from './components/tabs/LogTab';",
  "import { EvaluasiTab } from './components/tabs/EvaluasiTab';"
);
fs.writeFileSync('src/App.tsx', newLines.join('\n'));
console.log("App.tsx fixed");
