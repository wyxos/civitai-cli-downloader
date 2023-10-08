import fs from 'fs';
import path from 'path';
import axios from 'axios';

const dir = 'D:\\sd-webui\\models\\Lora'; // Update this path

const savePrettifiedJson = (filePath, jsonData) => {
    const prettyJson = JSON.stringify(jsonData, null, 2);
    fs.writeFileSync(filePath, prettyJson);
};

const downloadImage = async (url, imagePathWithoutExt) => {
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
    });

    const contentType = response.headers['content-type'];
    const fileExtension = contentType.split('/')[1];

    const writer = fs.createWriteStream(`${imagePathWithoutExt}.${fileExtension}`);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', () => {
            console.log(`downloaded ${imagePathWithoutExt}.${fileExtension}`)
            resolve()
        });
        writer.on('error', reject);
    });
};

const main = async () => {
    const files = fs.readdirSync(dir).filter(file => file.endsWith('.civitai.json'));

    // Filter out files that already have a corresponding image
    const filesToProcess = files.filter(file => {
        const baseName = path.basename(file, '.civitai.json');
        return !fs.existsSync(path.join(dir, `${baseName}.png`)) &&
            !fs.existsSync(path.join(dir, `${baseName}.jpeg`));
    });

    // Loop through filtered files
    for (const [index, file] of filesToProcess.entries()) {
        console.log(`Processing file ${index + 1} of ${filesToProcess.length}`);
        const jsonPath = path.join(dir, file);
        const rawData = fs.readFileSync(jsonPath);
        const jsonData = JSON.parse(rawData);
        const baseName = path.basename(file, '.civitai.json');

        console.log('json', jsonData)

        const imageUrl = jsonData[0]?.modelVersions?.images?.[0]?.url || jsonData?.images?.[0]?.url;
        if (imageUrl) {
            const imagePathWithoutExt = path.join(dir, baseName);
            await downloadImage(imageUrl, imagePathWithoutExt);
        }

        savePrettifiedJson(jsonPath, jsonData);
    }
};

export default class Preview {
    handle(){
        return main()
    }
}
