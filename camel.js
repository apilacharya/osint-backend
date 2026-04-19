import fs from "fs";
import path from "path";

const toCamelCase = (str) => {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
};

const renameFiles = (dir) => {
    let mapping = {};
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        let fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            const m = renameFiles(fullPath);
            mapping = { ...mapping, ...m };
        } else {
            // skip .antigravityignore, index.css, index.html, main.tsx, App.tsx
            if (file.startsWith(".") || ["index.css", "main.tsx", "App.tsx"].includes(file)) return;
            
            let shouldRename = false;
            let newName = file;

            if (file.includes("-")) {
                shouldRename = true;
                newName = toCamelCase(newName);
            }
            
            // Rename generic dots to camelCase like github.adapter.ts -> githubAdapter.ts
            // But skip .d.ts or similar standard extensions
            if (!newName.endsWith(".d.ts")) {
               const base = newName.replace(/\.ts(x?)$/, "");
               if (base.includes(".")) {
                  shouldRename = true;
                  const parts = base.split(".");
                  let newBase = parts[0];
                  for(let i=1; i<parts.length; i++) {
                     newBase += parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
                  }
                  newName = newBase + (newName.endsWith("tsx") ? ".tsx" : ".ts");
               }
            }

            if (shouldRename && newName !== file) {
                const newFullPath = path.join(dir, newName);
                mapping[fullPath] = newFullPath;
                fs.renameSync(fullPath, newFullPath);
                console.log(`Renamed: ${file} -> ${newName}`);
            }
        }
    });
    return mapping;
};

// Start from backend
const map1 = renameFiles("/Users/apil/Documents/AI Geeks/backend/src");
const map2 = renameFiles("/Users/apil/Documents/AI Geeks/frontend/src");

const allMap = { ...map1, ...map2 };
console.log(Object.keys(allMap).length, "files renamed");

const findFiles = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(findFiles(file));
        } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
            results.push(file);
        }
    });
    return results;
};

const allFiles = [...findFiles("/Users/apil/Documents/AI Geeks/backend/src"), ...findFiles("/Users/apil/Documents/AI Geeks/frontend/src")];

for (const file of allFiles) {
    let content = fs.readFileSync(file, "utf8");
    let changed = false;
    
    // Ignore external imports, only match relative ./ or ../
    const importRegex = /(['"])((?:\.\/|\.\.\/)[a-zA-Z0-9-.\/]+)\1/g;
    content = content.replace(importRegex, (match, quote, p2) => {
        const dirname = path.dirname(p2);
        const basename = path.basename(p2); 
        
        let processable = basename;
        let ext = "";
        if (basename.endsWith(".js")) {
           processable = basename.slice(0, -3);
           ext = ".js";
        } else if (basename.endsWith(".tsx")) {
           ext = ".tsx";
           processable = basename.slice(0, -4);
        } else if (basename.endsWith(".ts")) {
           ext = ".ts";
           processable = basename.slice(0, -3);
        } else if (basename.endsWith(".d.ts")) {
           return match;
        }

        if (processable.includes("-") || processable.includes(".")) {
            // camel case conversion
            const camel1 = processable.replace(/-([a-z])/g, g => g[1].toUpperCase());
            const parts = camel1.split(".");
            let camelFinal = parts[0];
            for (let i=1; i<parts.length; i++) {
                camelFinal += parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
            }
            
            const finalBasename = camelFinal + ext;
            const newImport = dirname === "." ? "./" + finalBasename : dirname + "/" + finalBasename;
            changed = true;
            return quote + newImport + quote;
        }
        return match;
    });
    
    if (changed) {
        fs.writeFileSync(file, content);
    }
}
