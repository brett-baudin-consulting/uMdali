import { promises as fs } from 'fs';
import { basename } from 'path';
import glob from 'glob';
import { promisify } from 'util';

const asyncGlob = promisify(glob);

async function removeCommentsAndConcatenateFiles(pattern, excludeFile, outputFile) {
  try {
    const allJSFiles = await asyncGlob(pattern, { nodir: true });
    let result = '';

    for (const file of allJSFiles) {
      if (basename(file) !== excludeFile) {
        let data = await fs.readFile(file, 'utf8');
        data = data.replace(/\/\/.*/g, ''); // Remove line comments
        data = data.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
        result += `\`${file}\`\n${data}\n`;
      }
    }

    await fs.writeFile(outputFile, result, 'utf8');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

removeCommentsAndConcatenateFiles('**/*.*js*', 'collectSource.mjs', 'source.txt');