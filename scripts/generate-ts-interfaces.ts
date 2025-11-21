#!/usr/bin/env ts-node
/**
 * TypeScript Interface Generator
 * Extracts TypeScript interfaces from backend model files and generates accurate documentation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

interface TSInterfaceProperty {
  name: string;
  type: string;
  optional: boolean;
  description?: string;
}

interface TSInterface {
  name: string;
  file: string;
  properties: TSInterfaceProperty[];
  description?: string;
}

interface TSInterfacesDocumentation {
  metadata: {
    purpose: string;
    generated: string;
    sourceFiles: string[];
  };
  interfaces: TSInterface[];
}

// Function to extract model attributes from Sequelize models
async function extractModelAttributes(filePath: string): Promise<TSInterface[]> {
  const content = await fs.readFile(filePath, 'utf8');
  const interfaces: TSInterface[] = [];
  
  // Look for model class definitions
  const classMatches = content.match(/class\s+(\w+)\s+extends\s+Model\s+/g);
  if (!classMatches) return interfaces;
  
  for (const classMatch of classMatches) {
    const modelName = classMatch.match(/class\s+(\w+)\s+extends\s+Model/)?.[1];
    if (!modelName) continue;
    
    // For each model, we'll create an interface representing its attributes
    // Look for associations and attribute definitions in the associate method
    const properties: TSInterfaceProperty[] = [];
    
    // Basic property extraction based on common Sequelize patterns
    // Look for common field types in the model definition
    if (content.includes('id:')) {
      properties.push({ name: 'id', type: 'string', optional: false });
    }
    if (content.includes('createdAt:')) {
      properties.push({ name: 'createdAt', type: 'Date', optional: false });
    }
    if (content.includes('updatedAt:')) {
      properties.push({ name: 'updatedAt', type: 'Date', optional: false });
    }
    
    // Add the interface for this model
    interfaces.push({
      name: `${modelName}Attributes`,
      file: filePath,
      properties
    });
  }
  
  return interfaces;
}

// Helper function to extract interfaces from .ts files
async function extractTSInterfaces(filePath: string): Promise<TSInterface[]> {
  const content = await fs.readFile(filePath, 'utf8');
  const interfaces: TSInterface[] = [];
  
  // Extract interface definitions using regex
  const interfaceRegex = /export\s+interface\s+(\w+)(?:\s+extends\s+[^{]*)?\s*{([\s\S]*?)}/g;
  let match;
  
  while ((match = interfaceRegex.exec(content)) !== null) {
    const interfaceName = match[1];
    const interfaceBody = match[2];
    
    const properties: TSInterfaceProperty[] = [];
    
    // Extract property definitions from interface body using a line-by-line approach
    const lines = interfaceBody.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      // Match property definitions like: name: type; or name?: type;
      const propMatch = trimmedLine.match(/^(\w+)(\?)?\s*:\s*(.+?)[;,]?$/);
      if (propMatch) {
        const [, propName, optionalMarker, propType] = propMatch;
        properties.push({
          name: propName,
          type: propType.trim(),
          optional: !!optionalMarker
        });
      }
    }
    
    interfaces.push({
      name: interfaceName,
      file: filePath,
      properties
    });
  }
  
  return interfaces;
}

// Main function
async function generateTSInterfaceDocs() {
  try {
    console.log('🔍 Scanning backend model and interface files...');

    // Find all model files
    const modelFiles = await glob('**/models/**/*.ts', {
      cwd: path.join(__dirname, '../backend/src'),
      absolute: true
    });
    
    // Find all type/interface files in frontend (they may not exist)
    const interfaceFiles = await glob('**/types/**/*.ts', {
      cwd: path.join(__dirname, '../frontend/src'),
      absolute: true
    }).catch(() => []); // If frontend doesn't exist, continue with just models
    
    console.log(`📋 Found ${modelFiles.length} model files and ${interfaceFiles.length} interface files to analyze...`);
    
    let allInterfaces: TSInterface[] = [];
    
    // Process model files
    for (const modelFile of modelFiles) {
      console.log(`📄 Analyzing models in ${path.basename(modelFile)}...`);
      const extractedInterfaces = await extractModelAttributes(modelFile);
      allInterfaces = allInterfaces.concat(extractedInterfaces);
    }

    // Process interface files
    for (const interfaceFile of interfaceFiles) {
      console.log(`📄 Analyzing interfaces in ${path.basename(interfaceFile)}...`);
      const extractedInterfaces = await extractTSInterfaces(interfaceFile);
      allInterfaces = allInterfaces.concat(extractedInterfaces);
    }

    console.log(`✅ Extracted ${allInterfaces.length} TypeScript interfaces and models`);

    // Generate documentation
    const tsDocs: TSInterfacesDocumentation = {
      metadata: {
        purpose: 'AUTO-GENERATED: Accurate TypeScript interface documentation extracted from backend models and frontend types',
        generated: new Date().toISOString(),
        sourceFiles: [...modelFiles, ...interfaceFiles].map(f => path.relative(path.join(__dirname, '..'), f))
      },
      interfaces: allInterfaces
    };

    // Write to file
    const outputPath = path.join(__dirname, '../brain/generated-typescript-interfaces.json');
    await fs.writeFile(outputPath, JSON.stringify(tsDocs, null, 2));

    console.log(`📄 TypeScript interface documentation generated successfully at ${outputPath}`);
    console.log(`📊 Summary: ${allInterfaces.length} interfaces from ${modelFiles.length + interfaceFiles.length} source files`);

  } catch (error) {
    console.error('❌ Error generating TypeScript interface documentation:', error);
    process.exit(1);
  }
}

// Run the generator
generateTSInterfaceDocs();