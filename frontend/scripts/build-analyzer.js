#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Build Optimization Report');
console.log('================================\n');

// Function to get file size in human readable format
function getFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Function to analyze build directory
function analyzeBuildDir(buildPath) {
  if (!fs.existsSync(buildPath)) {
    console.log('❌ Build directory not found. Run npm run build first.');
    return;
  }

  const files = [];
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else {
        const relativePath = path.relative(buildPath, fullPath);
        files.push({
          path: relativePath,
          size: stat.size,
          ext: path.extname(item)
        });
      }
    });
  }
  
  scanDirectory(buildPath);
  
  // Sort by size descending
  files.sort((a, b) => b.size - a.size);
  
  console.log('📊 Largest Files:');
  console.log('------------------');
  files.slice(0, 15).forEach(file => {
    console.log(`${getFileSize(file.size).padStart(8)} - ${file.path}`);
  });
  
  // Group by extension
  const byExtension = {};
  let totalSize = 0;
  
  files.forEach(file => {
    const ext = file.ext || 'no-ext';
    if (!byExtension[ext]) {
      byExtension[ext] = { count: 0, size: 0 };
    }
    byExtension[ext].count++;
    byExtension[ext].size += file.size;
    totalSize += file.size;
  });
  
  console.log('\n📁 By File Type:');
  console.log('------------------');
  Object.entries(byExtension)
    .sort(([,a], [,b]) => b.size - a.size)
    .forEach(([ext, stats]) => {
      const percentage = ((stats.size / totalSize) * 100).toFixed(1);
      console.log(`${ext.padEnd(8)} - ${getFileSize(stats.size).padStart(8)} (${percentage}%) - ${stats.count} files`);
    });
  
  console.log(`\n📦 Total Build Size: ${getFileSize(totalSize)}`);
}

// Run analysis
const buildPath = path.join(__dirname, '..', 'build');

try {
  console.log('⏱️  Build Time Analysis:');
  console.log('------------------------');
  
  const startTime = Date.now();
  execSync('npm run build', { stdio: 'inherit' });
  const endTime = Date.now();
  
  console.log(`\n✅ Build completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds\n`);
  
  analyzeBuildDir(buildPath);
  
  console.log('\n🎯 Optimization Recommendations:');
  console.log('----------------------------------');
  console.log('1. Consider lazy loading for large components');
  console.log('2. Use dynamic imports for vendor libraries');
  console.log('3. Optimize images with WebP format');
  console.log('4. Enable gzip/brotli compression on server');
  console.log('5. Use CDN for static assets');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
}
