export function getFileExtension(type) {
    const extensionMap = {
        TextualInversion: 'pt',
        SafeTensor: 'safetensors'
    };
    return extensionMap[type] || 'safetensors';
}
