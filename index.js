const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// const githubRepoUrl = 'https://raw.githubusercontent.com/geeky-abhishek/sample-ui/main/components/index.json';
const githubRepoUrl = 'https://raw.githubusercontent.com/SamagraX-Stencil/ui-templates/dev/molecules/index.json';

const fetchComponentsList = async () => {
  try {
    const response = await axios.get(githubRepoUrl);
    return response.data.components; // Assuming the JSON structure is { "components": ["Button", "Table", ...] }
  } catch (error) {
    console.error('Failed to fetch components list:', error);
    return [];
  }
};



async function copyComponent(componentName, destination) {
    const componentFileUrl = `https://raw.githubusercontent.com/SamagraX-Stencil/ui-templates/dev/molecules/${componentName}.jsx`;  
    const destinationPath = path.join(destination, `${componentName}.jsx`);

  try {
    const response = await axios.get(componentFileUrl);
    await fs.outputFile(destinationPath, response.data);
    console.log(`${componentName}.jsx copied to ${destinationPath}`);
  } catch (error) {
    console.error(`Failed to copy ${componentName}:`, error);
  }
}


module.exports = { fetchComponentsList, copyComponent };
