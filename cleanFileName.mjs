export function cleanFileName(fileName) {
    return fileName.replace(/lora|character|style|lo_ra|lo_con|locon|lycoris|lyco|ly_co/gi, '')
        .replace(/_/g, ' ')
        .trim()
        .replace(/\s+/g, '_');
}