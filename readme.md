# Civitai Model Downloader

This Node.js script automates the process of downloading machine learning models and associated files from Civitai.

## Features

- Fetches model data from Civitai based on provided URLs.
- Prompts for the location of the Stable Diffusion WebUI.
- Allows the user to select which version of the model to download.
- Downloads the selected file and shows the progress.
- Saves the downloaded model's JSON data.
- Downloads an associated image if available.

## Requirements

- Node.js
- npm packages: `axios`, `inquirer`, `lodash`

## Installation

1. Clone this repository or download the script.
2. Run `npm install` to install the required packages.

## Usage

1. Run the script by using the following command, replacing the URLs with the model URLs you want to download.

    ```bash
    node civitai.mjs 'https://civitai.com/models/125352?modelVersionId=111111' 'https://civitai.com/models/222222?
   modelVersionId=333333'
    ```

   Note: You can pass multiple URLs separated by space.

2. Follow the prompts to select the model version, file type, and additional details.

## Advanced Setup (Windows 11)

To make running the script more convenient on Windows 11, you can set up a `.bat` file and create an alias for it. Here are the steps:

### Creating the `.bat` File

1. Create a new text file and rename it to `civitai.bat`.
2. Open `civitai.bat` with a text editor and add the following line:

    ```batch
    node D:/scripts/civitai/civitai.mjs %*
    ```

   Replace `D:/scripts/civitai/civitai.mjs` with the full path to your `civitai.mjs` file.

3. Save and close the `.bat` file.

### Adding an Alias

1. Search for "Environment Variables" in the Start menu and click on "Edit the system environment variables".
2. In the System Properties window, click on the "Environment Variables" button.
3. Under "System variables", find and select the "Path" variable, then click on "Edit".
4. In the Edit Environment Variable window, click "New" and add the folder path where you saved `civitai.bat`.
5. Open a new Command Prompt window.
6. You can now use `civit` to run the script. For example:

    ```bash
    civit 'https://civitai.com/models/125352?modelVersionId=111111'
    ```

## Contributing

Feel free to fork, improve, and create a pull request.