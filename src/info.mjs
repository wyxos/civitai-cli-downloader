import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';

const directoryPath = 'D:\\sd-webui\\models\\Lora';

const fetchDataAndUpdateFile = async (filePath, modelId, count, total) => {
    console.log(`Processing file ${count} of ${total} (Model ID: ${modelId})`);
    try {
        const response = await axios.get(`https://civitai.com/api/v1/models/${modelId}`);
        const formattedData = JSON.stringify(response.data, null, 2);
        await fs.writeFile(filePath, formattedData, 'utf-8');
        console.log(`Successfully updated file ${count}`);
    } catch (error) {
        console.error(`Failed to fetch and update for modelId ${modelId}: ${error}`);
    }
};

const main = async () => {
    try {
        const files = await fs.readdir(directoryPath);
        const targetFiles = files.filter(file => file.endsWith('.civitai.json') || file.endsWith('.civitai.info'));
        const totalFiles = targetFiles.length;

        for (const [index, file] of targetFiles.entries()) {
            const filePath = path.join(directoryPath, file);
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const jsonData = JSON.parse(fileContent);
            const modelId = jsonData.modelId || jsonData.id;

            await fetchDataAndUpdateFile(filePath, modelId, index + 1, totalFiles);

            if (file.endsWith('.civitai.info')) {
                const newFilePath = path.join(directoryPath, file.replace('.info', '.json'));
                await fs.rename(filePath, newFilePath);
            }
        }
        console.log('Task complete.');
    } catch (error) {
        console.error(`An error occurred: ${error}`);
    }
};

export default class Info {
    handle(){
        return main()
    }
}
