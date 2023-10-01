import axios from "axios";
import fs from "fs";
import {promisify} from "util";
import {pipeline} from "stream";
const pipelineAsync = promisify(pipeline);

export async function downloadFile(url, savePath) {
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