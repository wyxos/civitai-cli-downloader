export function cleanFileName(fileName) {
    console.log(`Original filename: ${fileName}`);

    // Step 1: Remove non-English characters
    let cleaned = fileName.replace(/[^\x20-\x7E]+/g, ' ').trim();
    console.log(`After Step 1: ${cleaned}`);

    // Step 2: Remove obsolete terms
    const termsToRemove = ['lora', 'lo_ra', 'lycoris', 'character', 'style', 'concept', /\[.*?\]/g];
    termsToRemove.forEach(term => {
        const regex = new RegExp(term, 'gi');
        cleaned = cleaned.replace(regex, '');
    });
    cleaned = cleaned.trim();
    console.log(`After Step 2: ${cleaned}`);

    // Remove pipes and extra spaces
    cleaned = cleaned.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
    console.log(`After removing pipes and extra spaces: ${cleaned}`);

    // Step 3: Extract version
    const versionMatch = cleaned.match(/v\d+(\.\d+)?/);
    let version = '';
    if (versionMatch) {
        version = versionMatch[0];
        cleaned = cleaned.replace(version, '').trim();
    }
    console.log(`Version extracted: ${version}`);

    // Convert to snake_case
    cleaned = cleaned.replace(/\s+/g, '_').replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

    // Remove special characters like apostrophe and hyphen
    cleaned = cleaned.replace(/['-]/g, '');

    console.log(`After snake_case conversion: ${cleaned}`);

    // Add back the version, remove extra underscores
    cleaned = [cleaned, version].filter(Boolean).join('_').replace(/__+/g, '_');

    console.log(`Final cleaned filename: ${cleaned}`);

    return cleaned;
}

