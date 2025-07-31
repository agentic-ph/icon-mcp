#!/usr/bin/env node

/**
 * Build Index Script for Icon MCP Server
 *
 * This script scans all NPM packages in the node_modules directory
 * and generates a comprehensive icons.json index file.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
// import { execSync } from 'child_process'; // No longer needed

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const nodeModulesDir = path.join(projectRoot, 'node_modules');
const outputFile = path.join(projectRoot, 'dist', 'icons.json');

/**
 * Library configurations for processing different icon libraries
 */
const LIBRARY_CONFIGS = {
  'bootstrap-icons': {
    name: 'bootstrap-icons',
    displayName: 'Bootstrap Icons',
    description: 'Official open source SVG icon library for Bootstrap',
    sourceUrl: 'https://github.com/twbs/icons',
    license: 'MIT',
    iconPaths: ['icons/*.svg'],
    styles: ['regular'],
  },
  'feather-icons': {
    name: 'feather',
    displayName: 'Feather Icons',
    description: 'Simply beautiful open source icons',
    sourceUrl: 'https://github.com/feathericons/feather',
    license: 'MIT',
    iconPaths: ['dist/icons/*.svg'],
    styles: ['regular'],
  },
  '@primer/octicons': {
    name: 'octicons',
    displayName: 'Octicons',
    description: "GitHub's icon library",
    sourceUrl: 'https://github.com/primer/octicons',
    license: 'MIT',
    iconPaths: ['build/svg/*.svg'],
    styles: ['regular'],
  },
  '@tabler/icons': {
    name: 'tabler-icons',
    displayName: 'Tabler Icons',
    description: 'Free and open source icons',
    sourceUrl: 'https://github.com/tabler/tabler-icons',
    license: 'MIT',
    iconPaths: ['icons/*.svg'],
    styles: ['regular'],
  },
};

/**
 * Main function to build the icon index
 */
async function buildIndex() {
  console.log('🚀 Building icon index...');
  console.log(`📂 Node modules directory: ${nodeModulesDir}`);
  console.log(`📄 Output file: ${outputFile}`);

  try {
    // Check if node_modules exists
    if (!(await directoryExists(nodeModulesDir))) {
      console.log('⚠️  Node modules directory not found. Skipping icon index build.');
      console.log('   Please run "npm install" first to install dependencies.');
      console.log('   Then run "npm run build-icons" to generate the icon index.');
      process.exit(0); // Exit gracefully without error
    }

    // Ensure dist directory exists
    await ensureDirectoryExists(path.dirname(outputFile));
    console.log(`✅ Dist directory ensured: ${path.dirname(outputFile)}`);

    // Scan all libraries from node_modules and build index
    const allIcons = [];
    const libraryStats = {};

    console.log(`🔍 Checking ${Object.keys(LIBRARY_CONFIGS).length} libraries...`);

    let foundLibraries = 0;
    for (const [libraryKey, config] of Object.entries(LIBRARY_CONFIGS)) {
      const libraryPath = path.join(nodeModulesDir, libraryKey);
      console.log(`🔍 Checking library: ${libraryKey} at ${libraryPath}`);

      if (await directoryExists(libraryPath)) {
        console.log(`📁 Processing ${config.displayName}...`);
        const icons = await processLibrary(libraryPath, config);
        allIcons.push(...icons);
        libraryStats[config.name] = icons.length;
        foundLibraries++;
        console.log(`✅ Found ${icons.length} icons in ${config.displayName}`);
      } else {
        console.log(`⚠️  Skipping ${config.displayName} (directory not found at ${libraryPath})`);
        libraryStats[config.name] = 0;
      }
    }

    if (foundLibraries === 0) {
      console.log('⚠️  No icon libraries found in node_modules.');
      console.log('   This might indicate that dependencies are not fully installed.');
      console.log('   Please run "npm install" and then "npm run build-icons" again.');
      process.exit(0); // Exit gracefully without error
    }

    console.log(`📊 Total icons collected: ${allIcons.length}`);

    // Write the index file
    await writeIndexFile(allIcons);

    // Print summary
    console.log('\n📊 Index Build Summary:');
    console.log(`Total icons: ${allIcons.length}`);
    console.log('Library breakdown:');
    for (const [library, count] of Object.entries(libraryStats)) {
      console.log(`  ${library}: ${count} icons`);
    }
    console.log(`\n✅ Index saved to: ${outputFile}`);
  } catch (error) {
    console.error('❌ Error building index:', error);
    process.exit(1);
  }
}

/**
 * Process a single icon library
 */
async function processLibrary(libraryPath, config) {
  const icons = [];

  for (const iconPath of config.iconPaths) {
    const fullPath = path.join(libraryPath, iconPath);
    const svgFiles = await findSVGFiles(fullPath);

    for (const svgFile of svgFiles) {
      try {
        const icon = await processIconFile(svgFile, libraryPath, config);
        if (icon) {
          icons.push(icon);
        }
      } catch (error) {
        console.warn(`⚠️  Error processing ${svgFile}:`, error.message);
      }
    }
  }

  return icons;
}

/**
 * Process a single SVG icon file
 */
async function processIconFile(filePath, libraryPath, config) {
  const relativePath = path.relative(projectRoot, filePath);
  const fileName = path.basename(filePath, '.svg');
  const dirName = path.basename(path.dirname(filePath));

  // Determine style from path
  let style = 'regular';
  if (config.styles.length > 1) {
    for (const configStyle of config.styles) {
      if (filePath.includes(configStyle) || dirName.includes(configStyle)) {
        style = configStyle;
        break;
      }
    }
  }

  // Generate tags from filename
  const tags = generateTags(fileName);

  // Determine categories
  const categories = generateCategories(fileName, dirName);

  // Read SVG content to get size information and store the content
  const svgContent = await fs.readFile(filePath, 'utf-8');
  const size = extractSizeFromSVG(svgContent);

  return {
    name: fileName,
    library: config.name,
    tags,
    style,
    path: relativePath,
    svg: svgContent,
    categories,
    size,
    source: config.sourceUrl,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Find all SVG files matching a glob pattern
 */
async function findSVGFiles(pattern) {
  const files = [];

  // Simple glob implementation for *.svg patterns
  if (pattern.includes('*')) {
    const basePath = pattern.split('*')[0];
    const isRecursive = pattern.includes('**');

    if (await directoryExists(basePath)) {
      const foundFiles = await scanDirectory(basePath, isRecursive);
      files.push(...foundFiles.filter((file) => file.endsWith('.svg')));
    }
  } else if ((await fileExists(pattern)) && pattern.endsWith('.svg')) {
    files.push(pattern);
  }

  return files;
}

/**
 * Recursively scan directory for files
 */
async function scanDirectory(dirPath, recursive = false) {
  const files = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory() && recursive) {
        const subFiles = await scanDirectory(fullPath, recursive);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
    console.debug(`Directory scan failed: ${error.message}`);
  }

  return files;
}

/**
 * Generate searchable tags from icon name
 */
function generateTags(iconName) {
  const tags = [];

  // Add the original name
  tags.push(iconName);

  // Split on common separators and add parts
  const parts = iconName.split(/[-_\s]+/);
  tags.push(...parts.filter((part) => part.length > 1));

  // Add common synonyms
  const synonyms = {
    home: ['house', 'building'],
    user: ['person', 'profile', 'account'],
    search: ['find', 'magnify', 'lookup'],
    settings: ['config', 'preferences', 'options'],
    delete: ['remove', 'trash', 'bin'],
    edit: ['modify', 'change', 'update'],
    add: ['plus', 'create', 'new'],
    arrow: ['direction', 'pointer'],
  };

  for (const [key, values] of Object.entries(synonyms)) {
    if (iconName.includes(key)) {
      tags.push(...values);
    }
  }

  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Generate categories from icon name and directory
 */
function generateCategories(iconName, dirName) {
  const categories = [];

  // Category mapping based on common patterns
  const categoryMap = {
    navigation: ['arrow', 'chevron', 'menu', 'home', 'back', 'forward'],
    communication: ['mail', 'message', 'chat', 'phone', 'call'],
    media: ['play', 'pause', 'stop', 'volume', 'music', 'video'],
    file: ['document', 'folder', 'file', 'download', 'upload'],
    ui: ['button', 'input', 'form', 'modal', 'tooltip'],
    social: ['share', 'like', 'follow', 'twitter', 'facebook'],
    commerce: ['cart', 'shop', 'buy', 'sell', 'money', 'payment'],
    weather: ['sun', 'cloud', 'rain', 'snow', 'storm'],
  };

  const searchText = `${iconName} ${dirName}`.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some((keyword) => searchText.includes(keyword))) {
      categories.push(category);
    }
  }

  return categories.length > 0 ? categories : ['general'];
}

/**
 * Extract size information from SVG content
 */
function extractSizeFromSVG(svgContent) {
  // Try to extract viewBox
  const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/);
  if (viewBoxMatch) {
    const [, , width, height] = viewBoxMatch[1].split(/\s+/);
    return `${width}x${height}`;
  }

  // Try to extract width/height attributes
  const widthMatch = svgContent.match(/width=["']([^"']+)["']/);
  const heightMatch = svgContent.match(/height=["']([^"']+)["']/);

  if (widthMatch && heightMatch) {
    return `${widthMatch[1]}x${heightMatch[1]}`;
  }

  return '24x24'; // Default size
}

/**
 * Write the final index file
 */
async function writeIndexFile(icons) {
  const indexData = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalIcons: icons.length,
    libraries: [...new Set(icons.map((icon) => icon.library))],
    icons,
  };

  await fs.writeFile(outputFile, JSON.stringify(indexData, null, 2), 'utf-8');
}

/**
 * Utility functions
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function directoryExists(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function fileExists(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildIndex();
}

export { buildIndex };
