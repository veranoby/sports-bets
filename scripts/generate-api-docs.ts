#!/usr/bin/env ts-node
/**
 * API Documentation Generator
 * Extracts API endpoints from backend route files and generates accurate documentation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { promisify } from 'util';

const fsAccess = promisify(fs.access);

interface APIEndpoint {
  method: string;
  path: string;
  authRequired: boolean;
  roles?: string[];
  description?: string;
  requestBody?: any;
  response?: any;
  file: string;
  line: number;
}

interface APIDocumentation {
  metadata: {
    purpose: string;
    generated: string;
    sourceFiles: string[];
  };
  endpoints: APIEndpoint[];
}

// Function to extract API endpoints from route files
async function extractEndpointsFromRouteFile(filePath: string): Promise<APIEndpoint[]> {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n');
  const endpoints: APIEndpoint[] = [];
  
  const methodPatterns = [
    /router\.get\(\s*["']([^"']+)["']/,
    /router\.post\(\s*["']([^"']+)["']/,
    /router\.put\(\s*["']([^"']+)["']/,
    /router\.delete\(\s*["']([^"']+)["']/,
    /router\.patch\(\s*["']([^"']+)["']/,
    /app\.get\(\s*["']([^"']+)["']/,
    /app\.post\(\s*["']([^"']+)["']/,
    /app\.put\(\s*["']([^"']+)["']/,
    /app\.delete\(\s*["']([^"']+)["']/,
    /app\.patch\(\s*["']([^"']+)["']/
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Check for authentication middleware
    const hasAuth = line.includes('authenticate') || line.includes('authMiddleware');
    const hasAuthz = line.includes('authorize') || line.includes('requireRole');
    
    // Extract method and path patterns
    for (const pattern of methodPatterns) {
      const match = line.match(pattern);
      if (match) {
        // Determine the method from the pattern
        let method = 'GET';
        if (line.includes('.post')) method = 'POST';
        if (line.includes('.put')) method = 'PUT';
        if (line.includes('.delete') || line.includes('.del')) method = 'DELETE';
        if (line.includes('.patch')) method = 'PATCH';
        
        const endpointPath = match[1];
        
        // Look for role requirements in the middleware chain
        let roles: string[] = [];
        if (hasAuthz) {
          // Look for authorize calls in surrounding lines to extract roles
          for (let j = Math.max(0, i-5); j < Math.min(lines.length, i+5); j++) {
            const authLine = lines[j];
            if (authLine.includes('authorize') || authLine.includes('requireRole')) {
              // Extract roles from authorize('admin', 'operator') pattern
              const roleMatch = authLine.match(/authorize\(([^)]+)\)|requireRole\(([^)]+)\)/);
              if (roleMatch) {
                const rolesStr = roleMatch[1] || roleMatch[2];
                if (rolesStr) {
                  roles = rolesStr
                    .split(',')
                    .map(r => r.trim().replace(/['"]/g, ''))
                    .filter(r => r.length > 0);
                }
              }
            }
          }
        }
        
        endpoints.push({
          method,
          path: endpointPath,
          authRequired: hasAuth,
          roles: roles.length > 0 ? roles : undefined,
          file: filePath,
          line: i + 1
        });
      }
    }
  }
  
  return endpoints;
}

// Main function
async function generateAPIDocs() {
  try {
    console.log('🔍 Scanning backend route files...');
    
    // Find all route files
    const routeFiles = await glob('**/routes/**/*.ts', {
      cwd: path.join(__dirname, '../backend/src'),
      absolute: true
    });
    
    console.log(`📋 Found ${routeFiles.length} route files to analyze...`);
    
    let allEndpoints: APIEndpoint[] = [];

    for (const routeFile of routeFiles) {
      console.log(`📄 Analyzing ${path.basename(routeFile)}...`);
      const endpoints = await extractEndpointsFromRouteFile(routeFile);
      allEndpoints = allEndpoints.concat(endpoints);
    }

    console.log(`✅ Extracted ${allEndpoints.length} API endpoints`);

    // Generate documentation
    const apiDocs: APIDocumentation = {
      metadata: {
        purpose: 'AUTO-GENERATED: Accurate API endpoint documentation extracted from backend route files',
        generated: new Date().toISOString(),
        sourceFiles: routeFiles.map(f => path.relative(path.join(process.cwd(), 'backend/src'), f))
      },
      endpoints: allEndpoints
    };

    // Write to file
    const outputPath = path.join(process.cwd(), 'brain/generated-api-reference.json');
    await fs.writeFile(outputPath, JSON.stringify(apiDocs, null, 2));

    console.log(`📄 API documentation generated successfully at ${outputPath}`);
    console.log(`📊 Summary: ${allEndpoints.length} endpoints from ${routeFiles.length} source files`);

  } catch (error) {
    console.error('❌ Error generating API documentation:', error);
    process.exit(1);
  }
}

// Run the generator
generateAPIDocs();