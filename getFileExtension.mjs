export function getFileExtension(type) {
    const extensionMap = {
        TextualInversion: 'pt',
    };
    return extensionMap[type] || 'safetensors';
}