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
    node civitai.mjs 'https://civitai.com/models/125352?modelVersionId=136925' 'https://civitai.com/models/125353?modelVersionId=136926'
    ```

   Note: You can pass multiple URLs separated by space.

2. Follow the prompts to select the model version, file type, and additional details.

## Contributing

Feel free to fork, improve, and create a pull request.