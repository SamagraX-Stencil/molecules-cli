#!/usr/bin/env node

// Assuming dynamic import works correctly in your environment
import('inquirer').then(inquirerModule => {
    import('../index.js').then(async ({ fetchComponentsList, copyComponent }) => {
      
      async function main() {
        try {
       
          const owner = 'geeky-abhishek'; // Replace with the actual GitHub username
          const repo = 'sample-ui'; // Replace with the actual GitHub repository name
          const branch = 'main'; // Assuming 'main' is your default branch
          // Correctly pass the owner and repo to the fetchComponentsList function
          
          const components = await fetchComponentsList(owner, repo, branch);
          if (components.length === 0) {
            console.log('No components found in the repository.');
            return;
          }
        
  
          const answers = await inquirerModule.default.prompt([
            {
              type: 'checkbox',
              name: 'selectedComponents',
              message: 'Select components to copy:',
              choices: components,
            },
            {
              type: 'input',
              name: 'destination',
              message: 'Enter the destination path for the components:',
              default: './',
            },
          ]);
  
          for (const componentName of answers.selectedComponents) {
            await copyComponent(owner, repo, componentName, answers.destination, branch);
            console.log(`${componentName} has been copied to ${answers.destination}`);
          }
  
          console.log('All selected components have been copied successfully.');
        } catch (error) {
          console.error('An error occurred:', error);
        }
      }
  
      main();
    });
  }).catch(error => console.error(`Failed to import modules: ${error}`));
  