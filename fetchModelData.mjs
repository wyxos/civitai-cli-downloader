import axios from "axios";

export async function fetchModelData(modelId) {
    const url = `https://civitai.com/api/v1/models/${modelId}`;
    const response = await axios.get(url);
    return response.data;
}