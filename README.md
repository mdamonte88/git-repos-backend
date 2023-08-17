# Express  Routes Stack

# commands
```
Run server in the port 5000:
npm start 

Run testing server in the port 8001
npm test
```

# endoints
GET /repos

# Steps Installation
1) Install Typescript
npm install typescript --save-dev

2) Create Typescript configuration file
npx tsc --init

3) Modify Typescript configuration
```
{
  "compilerOptions": {
    "target": "ES2021",       // Target ECMAScript version
    "module": "CommonJS",     // Module system (Node.js)
    "outDir": "./dist",       // Output directory for compiled JavaScript
    "rootDir": "./src",       // Source directory
    "strict": true,           // Enable strict type checking
    "esModuleInterop": true,  // Enable importing CommonJS modules with ES6 syntax
    "forceConsistentCasingInFileNames": true, // Enforce consistent file naming
    "resolveJsonModule": true, // Allow importing JSON files
    "skipLibCheck": true,     // Skip type checking of declaration files
    "declaration": false,     // Generate declaration files (.d.ts)
    "sourceMap": true         // Generate source maps for easier debugging
  },
  "include": ["src/**/*.ts"], // Files to include in compilation
  "exclude": ["node_modules"] // Files to exclude from compilation
}

```

4) Compile TypeScript to JavaScript:
npx tsc

5) 
npm install express typescript @types/express
