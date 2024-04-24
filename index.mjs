

import fs from 'fs-extra';
import open,{apps} from 'open';
import readline from 'readline';
import { diffLines } from 'diff';
import { exec } from 'child_process';
import path from 'path';
import axios from 'axios'

export async function fetchComponentsList(
  owner,
  repo,
  branch = 'main',
  componentType
) {
  const indexJsonUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/src/molecules/index.json`

  try {
    const response = await axios.get(indexJsonUrl)
    const components = response.data[componentType]
    return components
  } catch (error) {
    console.error('Failed to fetch components list:', error)
    return []
  }
}

async function fetchFilePaths(owner, repo, componentPath, branch = 'main') {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${componentPath}?ref=${branch}`
  try {
    const response = await axios.get(apiUrl)
    return response.data
      .filter((item) => item.type === 'file')
      .map((file) => ({ name: file.name, download_url: file.download_url }))
  } catch (error) {
    console.error(`Failed to fetch file paths for ${componentPath}:`, error)
    return []
  }
}


export async function copyComponent(owner, repo, componentName, destination, branch = 'main') {
  const componentFiles = await fetchFilePaths(owner, repo, `src/molecules/${componentName}`, branch);
  const destinationPath = path.join(destination, componentName);
  await fs.ensureDir(destinationPath);

  for (const file of componentFiles) {
      const filePath = path.join(destinationPath, file.name);
      const response = await axios.get(file.download_url, { responseType: 'arraybuffer' });
      const incomingContent = response.data.toString();

      if (await fs.pathExists(filePath)) {
          const existingContent = await fs.readFile(filePath, 'utf8');
          if (existingContent !== incomingContent) {
              console.log(`Conflict detected in ${file.name}`);
              const resolvedContent = await manualMerge(filePath, existingContent, incomingContent);
              await fs.writeFile(filePath, resolvedContent);
              console.log(`Conflict resolved for ${file.name}`);
          }
      } else {
          await fs.writeFile(filePath, incomingContent);
          console.log(`${file.name} copied successfully.`);
      }
  }
}

async function manualMerge(filePath, existingContent, incomingContent) {
  const changes = diffLines(existingContent, incomingContent);
  let conflictExists = changes.some(part => part.added || part.removed);
  let conflictContent = '';

  if (conflictExists) {
      // Prepare conflict markers for the file content
      conflictContent = changes.map(part => {
          if (part.added) {
              return `>>>>>>> Incoming\n${part.value}`;
          } else if (part.removed) {
              return `<<<<<<< Existing\n${part.value}`;
          } else {
              return `${part.value}`;
          }
      }).join('=======\n');

      const tempFilePath = `${filePath}.conflict`;
      await fs.writeFile(tempFilePath, conflictContent);

      console.log(`Conflicts detected and written to ${tempFilePath}. Please resolve them in Visual Studio Code.`);

      // Open Visual Studio Code and wait for the user to close it
      try {
          await openFileInVSCode(tempFilePath);
          await waitForUser(`Please resolve the conflicts in the opened file and save. Press enter when done.`);
          const resolvedContent = await fs.readFile(tempFilePath, 'utf8');
          await fs.writeFile(filePath, resolvedContent);  // Write the resolved content back to the original file
          await fs.remove(tempFilePath);  // Clean up the temporary conflict file
          console.log(`Conflicts resolved and changes saved to ${filePath}.`);
          return resolvedContent;
      } catch (error) {
          console.error('An error occurred while trying to open Visual Studio Code:', error);
          await waitForUser(`An error occurred. Please manually open and resolve the conflicts in ${tempFilePath}, then press enter when done.`);
          const resolvedContent = await fs.readFile(tempFilePath, 'utf8');
          await fs.writeFile(filePath, resolvedContent);  // Write the resolved content back to the original file
          await fs.remove(tempFilePath);  // Clean up the temporary conflict file
          return resolvedContent;
      }
  } else {
      // No conflicts, just return the incoming content
      return incomingContent;
  }
}

function openFileInVSCode(filePath) {
  return new Promise((resolve, reject) => {
      exec(`code --wait "${filePath}"`, (error) => {
          if (error) {
              reject(error);
          } else {
              resolve();
          }
      });
  });
}

function waitForUser(message) {
  const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
  });
  return new Promise(resolve => rl.question(message, answer => {
      rl.close();
      resolve(answer);
  }));
}
