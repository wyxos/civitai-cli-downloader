import {downloadFile} from "./downloadFile.mjs";

export async function downloadWithRetry(url, savePath, retries = 3, delay = 2000) {
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