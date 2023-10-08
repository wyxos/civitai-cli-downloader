import inquirer from "inquirer";

export async function selectTargetObject({modelVersions, name: modelName}) {
    const choices = modelVersions.map((v) => v.name);
    const {target} = await inquirer.prompt([
        {
            type: 'list',
            name: 'target',
            message: `Select the version of ${modelName}:`,
            choices,
        },
    ]);
    return modelVersions.find((v) => v.name === target);
}