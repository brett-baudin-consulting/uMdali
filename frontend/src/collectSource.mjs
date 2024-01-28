import { readFileSync, writeFileSync } from "fs";
import { basename, dirname } from "path";
import glob from "glob";
import { argv } from "process";
const { sync } = glob;

const startingPath = argv[2] || "."; // Accepts a command line argument

let allJSFiles = sync(`${startingPath}/**/*.*js*`, { nodir: true });

let result = "";

allJSFiles
  .filter((file) => basename(file) !== "collectSource.mjs")
  .forEach((file) => {
    let data = readFileSync(file, "utf8");
    data = data.replace(/\/\/.*/g, "");
    data = data.replace(/\/\*[\s\S]*?\*\//g, "");
    let basePath = dirname(file);
    result += `\`./${basePath}/${basename(file)}\`\n`;
    result += "\n```jsx\n";
    result += `${data}\n`;
    result += "```\n";
  });

writeFileSync("source.txt", result, "utf8");
