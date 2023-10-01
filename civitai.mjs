import axios from 'axios';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import {pipeline} from 'stream';
import {promisify} from 'util';
import _ from 'lodash';

const pipelineAsync = promisify(pipeline);

function getFileExtension(type) {
    const extensionMap = {
        TextualInversion: 'pt',
    };
    return extensionMap[type] || 'safetensors';
}


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

async function downloadWithRetry(url, savePath, retries = 3, delay = 2000) {
    try {
        console.log('Initiating download...');
        await downloadFile(url, savePath);
    } catch (error) {
        console.error('Download failed:', error);
        if (retries > 0) {
            console.log(`Retrying... (${retries} attempts remaining)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return await downloadWithRetry(url, savePath, retries - 1, delay);
        } else {
            throw new Error('Max retries reached');
        }
    }
}

function cleanFileName(fileName) {
    return fileName.replace(/lora|character|style|lo_ra|lo_con|locon|lycoris|lyco|ly_co/gi, '')
        .replace(/_/g, ' ')
        .trim()
        .replace(/\s+/g, '_');
}

async function main(urls) {
    const webUiLocation = await getWebUiLocation();

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

        try {
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
                concept = `${response.concept}_`;
            }

            const versionRegex = /v\d+(\.\d+)?/g;
            const match = target.name.match(versionRegex);
            const version = match ? match[0] : "";

            const defaultBaseFileName = cleanFileName(`${_.snakeCase(modelData.name.replace(version, ""))}_${version || _.snakeCase(target.name)}`);
            const { customFileName } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'customFileName',
                    message: `Current file name is ${defaultBaseFileName}. Enter a custom name or press Enter to proceed with the current name:`,
                    default: defaultBaseFileName
                },
            ]);

            const baseFileName = `${concept}_${customFileName || defaultBaseFileName}`;

            const fileExtension = getFileExtension(modelData.type);

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

            await downloadWithRetry(selectedFile.downloadUrl, savePath);

// Save JSON
            const jsonSavePath = path.join(saveFolder, `${baseFileName}.civitai.json`);
            fs.writeFileSync(jsonSavePath, JSON.stringify(modelData));

// Download image
            if (target.images.length > 0) {
                const imageSavePath = path.join(saveFolder, `${baseFileName}.jpeg`);
                await downloadFile(target.images[0].url, imageSavePath);
            }
        }
        catch (error){
            console.error(`Failed to process ${url}: ${error}`);
            failedUrls.push(url);
        }
    }

    if (failedUrls.length > 0) {
        console.log('Failed to download the following URLs:', failedUrls.join(', '));
    }
}

const urls = process.argv.slice(2); // Assuming URLs are passed as command-line arguments
main(urls).catch((e) => console.error(e));
