import inquirer from "inquirer";

export async function getWebUiLocation() {
    const {location} = await inquirer.prompt([
        {
            type: 'input',
            name: 'location',
            message: 'Enter the location of Stable Diffusion WebUI:',
            default: 'D:\\sd-webui',
        },
    ]);
    return location;
}