import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import {isInvalidFileName} from "./isInvalidFileName.mjs";
import _ from 'lodash';
import {cleanFileName} from "./cleanFileName.mjs";

const dir = 'D:\\sd-webui\\models\\Lora';

async function main() {
    let counter = 0;  // Add counter here

    const files = fs.readdirSync(dir).filter(file => file.endsWith('.safetensors'));

    const invalidFiles = files.filter(file => isInvalidFileName(file))

    for (const file of invalidFiles) {
        if (isInvalidFileName(file)) {
            counter++;  // Increment counter
            console.log(`Renaming file ${counter} of ${invalidFiles.length}`);  // Log it

            const cleanName = cleanFileName(path.basename(file, '.safetensors'));

            const { newName } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'newName',
                    message: `Enter new name for ${file} -> \x1b[32m${cleanName}\x1b[0m:`,
                    default: cleanName,
                },
            ]);

            const finalName = newName || cleanName;

            // Preview the renaming for all extensions
            const extensions = ['.safetensors', '.civitai.json', '.civitai.info', '.json', '.png', '.jpeg', 'preview.png', '.preview.jpg'];
            console.log('Preview:');
            for (const ext of extensions) {
                const oldFileName = path.basename(file, '.safetensors') + ext;
                const newFileName = finalName + (ext === '.civitai.info' ? '.civitai.json' : ext);
                console.log(`${oldFileName} -> ${newFileName}`);
            }

            // Confirm the renaming
            const { confirmRename } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirmRename',
                    message: 'Proceed with renaming?',
                    default: true,
                },
            ]);

            if (!confirmRename) {
                continue;
            }

            for (const ext of extensions) {
                const oldPath = path.join(dir, path.basename(file, '.safetensors') + ext);
                if (fs.existsSync(oldPath)) {
                    const newPath = path.join(dir, finalName + (ext === '.civitai.info' ? '.civitai.json' : ext));
                    fs.renameSync(oldPath, newPath);

                    console.log(`Rename of ${oldPath} to ${newPath} complete.`)
                }
            }
        }
    }
}

export default class Rename {
    handle(){
        main().catch(err => console.error(err));
    }
}
