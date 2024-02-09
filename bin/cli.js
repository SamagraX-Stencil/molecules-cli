#!/usr/bin/env node

(async () => {
    // Dynamically import the inquirer module
    const inquirer = await import('inquirer');
  
    // Assuming index.js exports fetchComponentsList and copyComponent correctly
    const { fetchComponentsList, copyComponent } = await import('../index.js');
  
    async function main() {
      try {
        const components = await fetchComponentsList();
        console.log({components})
        if (components.length === 0) {
          console.log('No components found to copy.');
          return;
        }
  
        // Use inquirer.prompt correctly from the dynamically imported inquirer
        const answers = await inquirer.default.prompt([
          {
            type: 'checkbox',
            name: 'components',
            message: 'Which components would you like to copy?',
            choices: components,
          },
          {
            type: 'input',
            name: 'destination',
            message: 'Enter the destination path:',
            default: './src/components',
          },
        ]);
  
        // Ensure all components are copied before proceeding
        for (const componentName of answers.components) {
          await copyComponent(componentName, answers.destination);
        }
       // console.log('All selected components have been copied successfully.');
      } catch (error) {
        console.error('An error occurred:', error);
      }
    }
  
    await main();
  })();
  