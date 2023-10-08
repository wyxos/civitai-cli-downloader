export function isInvalidFileName(fileName) {
    const terms = ['lora', 'lo_ra', 'lycoris', 'LyRORIS'];
    const regex = /[A-Z]|[^\x00-\x7F]/;
    const versionRegex = /_v\d\d/;  // Removed 'g'
    const multipleUnderscores = /_{2,}/;  // Removed 'g'

    return regex.test(fileName) ||
        terms.some(term => fileName.includes(term)) ||
        versionRegex.test(fileName) ||
        multipleUnderscores.test(fileName);
}
