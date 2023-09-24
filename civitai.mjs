import axios from 'axios';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import {pipeline} from 'stream';
import {promisify} from 'util';
import _ from 'lodash';

const pipelineAsync = promisify(pipeline);

function extractModelId(url) {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    return pathParts[2];
}

async function fetchModelData(modelId) {
    const url = `https://civitai.com/api/v1/models/${modelId}`;
    const response = await axios.get(url);
    return response.data;
}

async function getWebUiLocation() {
    const {location} = await inquirer.prompt([
        {
            type: 'input',
            name: 'location',
            message: 'Enter the location of Stable Diffusion WebUI:',
            default: 'D:\\sd-webui',
        },
    ]);
    return location;
}

async function selectTargetObject({modelVersions, name: modelName}) {
    const choices = modelVersions.map((v) => v.name);
    const {target} = await inquirer.prompt([
        {
            type: 'list',
            name: 'target',
            message: `Select the version of ${modelName}:`,
            choices,
        },
    ]);
    return modelVersions.find((v) => v.name === target);
}

async function downloadFile(url, savePath) {
    const {data, headers} = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
    });

    const totalLength = headers['content-length'];
    let downloaded = 0;

    data.on('data', (chunk) => {
        downloaded += chunk.length;
        const percentage = ((downloaded / totalLength) * 100).toFixed(2);
        process.stdout.write(`Downloading ${percentage}%\r`);
    });

    await pipelineAsync(data, fs.createWriteStream(savePath));
    console.log(`\nDownloaded to ${savePath}`);
}

async function main(urls) {
    const webUiLocation = await getWebUiLocation();

    for (const url of urls) {
        // Extract modelId from URL and call rest of the logic
        const modelId = extractModelId(url); // Implement this function

        const modelData = await fetchModelData(modelId);

        const target = await selectTargetObject(modelData);
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
        const {concept} = await inquirer.prompt([
            {
                type: 'list',
                name: 'concept',
                message: 'What is the file about?',
                choices: ['concept', 'character', 'style'],
            },
        ]);

        const defaultBaseFileName = `${_.snakeCase(modelData.name)}_${_.snakeCase(target.name)}`;
        const { customFileName } = await inquirer.prompt([
            {
                type: 'input',
                name: 'customFileName',
                message: `Current file name is ${defaultBaseFileName}. Enter a custom name or press Enter to proceed with the current name:`,
            },
        ]);

        const baseFileName = `${concept}_${customFileName || defaultBaseFileName}`;

        const fileExtension = selectedFile.metadata.format.toLowerCase();

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

        await downloadFile(selectedFile.downloadUrl, savePath);

// Save JSON
        const jsonSavePath = path.join(saveFolder, `${baseFileName}.civitai.json`);
        fs.writeFileSync(jsonSavePath, JSON.stringify(modelData));

// Download image
        if (target.images.length > 0) {
            const imageSavePath = path.join(saveFolder, `${baseFileName}.jpeg`);
            await downloadFile(target.images[0].url, imageSavePath);
        }
    }
}

const urls = process.argv.slice(2); // Assuming URLs are passed as command-line arguments
main(urls).catch((e) => console.error(e));
