#!/usr/bin/env node

/**
 * Security Cleaner - Post-build script to remove development traces
 * This script removes any remaining development information from the build
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const BUILD_DIR = path.join(__dirname, '..', 'build');

function cleanJavaScriptFiles() {
  console.log('🧹 Cleaning JavaScript files...');
  
  const jsFiles = glob.sync(`${BUILD_DIR}/**/*.js`);
  
  jsFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove any remaining console.log, console.warn, console.error statements
    content = content.replace(/console\.(log|warn|error|debug|info)\([^)]*\);?/g, '');
    
    // Remove any development URLs or paths that might leak information
    content = content.replace(/localhost:\d+/g, '');
    content = content.replace(/127\.0\.0\.1:\d+/g, '');
    content = content.replace(/http:\/\/localhost/g, '');
    content = content.replace(/webpack-dev-server/g, '');
    content = content.replace(/Hot Module Replacement/g, '');
    content = content.replace(/HMR/g, '');
    
    // Remove any file path references that might reveal structure
    content = content.replace(/[a-zA-Z]:\\[\w\\.-]*\.(js|jsx|ts|tsx|css|scss)/g, '');
    content = content.replace(/\/[\w\/.-]*\.(js|jsx|ts|tsx|css|scss)/g, '');
    
    fs.writeFileSync(file, content);
  });
  
  console.log(`✅ Cleaned ${jsFiles.length} JavaScript files`);
}

function cleanHtmlFiles() {
  console.log('🧹 Cleaning HTML files...');
  
  const htmlFiles = glob.sync(`${BUILD_DIR}/**/*.html`);
  
  htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove any comments that might contain build information
    content = content.replace(/<!--[\s\S]*?-->/g, '');
    
    // Remove any data attributes that might reveal information
    content = content.replace(/data-reactroot/g, '');
    content = content.replace(/data-react[^=]*="[^"]*"/g, '');
    
    fs.writeFileSync(file, content);
  });
  
  console.log(`✅ Cleaned ${htmlFiles.length} HTML files`);
}

function removeSourceMaps() {
  console.log('🗑️  Removing source maps...');
  
  const mapFiles = glob.sync(`${BUILD_DIR}/**/*.map`);
  
  mapFiles.forEach(file => {
    fs.unlinkSync(file);
  });
  
  console.log(`✅ Removed ${mapFiles.length} source map files`);
}

function addSecurityHeaders() {
  console.log('🔒 Adding security headers to HTML...');
  
  const htmlFiles = glob.sync(`${BUILD_DIR}/**/*.html`);
  
  htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Add additional security meta tags if not present
    if (!content.includes('referrer')) {
      content = content.replace(
        '<meta name="viewport"',
        '<meta name="referrer" content="no-referrer">\n    <meta name="viewport"'
      );
    }
    
    fs.writeFileSync(file, content);
  });
  
  console.log(`✅ Added security headers to ${htmlFiles.length} HTML files`);
}

function main() {
  console.log('🚀 Starting security cleanup process...');
  console.log(`📁 Build directory: ${BUILD_DIR}`);
  
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌ Build directory not found. Please run build first.');
    process.exit(1);
  }
  
  cleanJavaScriptFiles();
  cleanHtmlFiles();
  removeSourceMaps();
  addSecurityHeaders();
  
  console.log('✨ Security cleanup completed!');
  console.log('🔐 Your build is now production-ready with enhanced security.');
}

main();
