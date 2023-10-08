import { program } from 'commander';
import Rename from "./src/rename.mjs";
import Download from "./src/download.mjs";
import Preview from "./src/preview.mjs";
import Info from "./src/info.mjs";


program
    .argument('[urls...]', 'URLs to download')
    .action((urls) => {
        return new Download().handle(urls)
    });

program
    .command('rename')
    .description('Rename files based on conditions')
    .action(() => {
        new Rename().handle()
    });

program
    .command('preview')
    .description('Restore preview images from civitai.json')
    .action(() => {
        return new Preview().handle()
    });

program
    .command('info')
    .description('Reset civitai.info to JSON')
    .action(() => {
        return new Info().handle()
    });

program.parse(process.argv);

// If no command is specified, assume "download"
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
