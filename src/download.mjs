import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import {getFileExtension} from "./getFileExtension.mjs";
import {extractModelId} from "./extractModelId.mjs";
import {getWebUiLocation} from "./getWebUiLocation.mjs";
import {fetchModelData} from "./fetchModelData.mjs";
import {selectTargetObject} from "./selectTargetObject.mjs";
import {cleanFileName} from "./cleanFileName.mjs";
import {downloadFile} from "./downloadFile.mjs";
import {downloadWithRetry} from "./downloadWithRetry.mjs";

function extractModelVersionId(url) {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    return params.get("modelVersionId");
}


async function main(urls) {
    const webUiLocation = await getWebUiLocation();
    const downloadTasks = [];

    // Common concept for all files
    let commonConcept = null;
    if(urls.length > 1){
        const { applyCommonConcept } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'applyCommonConcept',
                message: 'Do you want to apply a common concept to all files?',
                default: false,
            },
        ]);

        if (applyCommonConcept) {
            const response = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'concept',
                    message: 'Select the common concept:',
                    choices: ['concept', 'character', 'style'],
                },
            ]);
            commonConcept = response.concept;
        }
    }

    const failedUrls = [];

    for (const [index, url] of urls.entries()) {
        console.log(`Processing file ${index + 1} of ${urls.length}`);

        // Extract modelId from URL and call rest of the logic
        const modelId = extractModelId(url); // Implement this function

        const modelVersionId = extractModelVersionId(url)

        const modelData = await fetchModelData(modelId);

        let target

        if(modelVersionId){
            target = modelData.modelVersions.find(version => version.id === Number(modelVersionId))
        }
        else {
            target = await selectTargetObject(modelData);
        }

        const fileType = await inquirer.prompt([
            {
                type: 'list',
                name: 'file',
                message: 'Select the file to download:',
                choices: target.files.map((f) => ({
                    value: f.name,
                    name: [f.name, f.metadata.size, f.metadata.format].filter(Boolean).join(' - ')
                })),
            },
        ]);

        const selectedFile = target.files.find((f) => f.name === fileType.file);
        const typeFolderMap = {
            LORA: 'models/Lora',
            LoCon: 'models/Lora',
            Lycoris: 'models/Lora',
            TextualInversion: 'embeddings',
            Checkpoint: 'models/Stable-diffusion',
        };

        const saveFolder = path.join(webUiLocation, typeFolderMap[modelData.type]);
        let concept = commonConcept;
        if (modelData.type !== 'Checkpoint' && commonConcept === null) {
            const response = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'concept',
                    message: 'What is the file about?',
                    choices: ['concept', 'character', 'style'],
                },
            ]);
            concept = response.concept;
        }

        const versionRegex = /v\d+(\.\d+)?/g;
        const match = target.name.match(versionRegex);
        const version = match ? match[0] : "";

        console.log('target', target.name, 'model', modelData.name, 'version', version)

        const defaultBaseFileName = cleanFileName(`${modelData.name.trim()}-${version.trim()}`);
        const { customFileName } = await inquirer.prompt([
            {
                type: 'input',
                name: 'customFileName',
                message: `Current file name is \x1b[32m${concept}_${defaultBaseFileName}\x1b[0m. Enter a custom name or press Enter to proceed with the current name:`,
                default: defaultBaseFileName
            },
        ]);

        const baseFileName = `${concept ? `${concept}_` : ''}${customFileName || defaultBaseFileName}`;


        const fileExtension = getFileExtension(selectedFile.metadata.format);

        const fileName = `${baseFileName}.${fileExtension}`;
        const savePath = path.join(saveFolder, fileName);

        if (fs.existsSync(savePath)) {
            const { overwrite } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'overwrite',
                    message: `${fileName} already exists. Do you want to overwrite it?`,
                    default: false,
                },
            ]);
            if (!overwrite) {
                console.log('Skipping download.');
                continue; // Skip to the next URL
            }
        }

        downloadTasks.push({
            url: selectedFile.downloadUrl,
            savePath,
            baseFileName,
            modelData,
            target,
            saveFolder
        });
    }

    // Now download all
    for (const [index, task] of downloadTasks.entries()) {
        try {
            console.log(`Initiating download for ${task.baseFileName}...`);
            await downloadWithRetry(task.url, task.savePath);

            // Save JSON
            const jsonSavePath = path.join(task.saveFolder, `${task.baseFileName}.civitai.json`);
            fs.writeFileSync(jsonSavePath, JSON.stringify(task.modelData, null, 2));

            // Download image
            if (task.target.images.length > 0) {
                const imageSavePath = path.join(task.saveFolder, `${task.baseFileName}.jpeg`);
                await downloadFile(task.target.images[0].url, imageSavePath);

                console.log(`${index + 1}/${downloadTasks.length} completed.`)
            }
        } catch (error) {
            console.error(`Failed to download ${task.baseFileName}: ${error}`);
            failedUrls.push(task.url);
        }
    }

    if (failedUrls.length > 0) {
        console.log('Failed to download the following URLs:', failedUrls.join(', '));
    }
}

export default class Download {
    handle(urls){
        return main(urls)
    }
}
