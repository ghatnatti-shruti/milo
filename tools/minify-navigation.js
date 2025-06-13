const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');

const sourceDir = path.join(__dirname, '../libs/blocks/global-navigation');
const targetDir = path.join(__dirname, '../libs/blocks/global-navigation-min');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function minifyFile(filePath, targetPath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath);

  if (ext === '.js') {
    try {
      const result = await minify(content, {
        compress: true,
        mangle: true,
        ecma: 2020,
        module: true,
        toplevel: true,
        format: {
          comments: false,
        },
      });
      if (result.code && result.code.trim().length > 0) {
        // Ensure the target directory exists
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.writeFileSync(targetPath, result.code);
        return true;
      } else {
        if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
        return false;
      }
    } catch (error) {
      if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
      console.error(`Error minifying JS file ${filePath}:`, error.message);
      return false;
    }
  } else if (ext === '.css') {
    try {
      const result = new CleanCSS().minify(content);
      if (result.styles && result.styles.trim().length > 0) {
        // Ensure the target directory exists
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.writeFileSync(targetPath, result.styles);
        return true;
      } else {
        if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
        return false;
      }
    } catch (error) {
      if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
      return false;
    }
  }
  return false;
}

async function processDirectory(srcDir, destDir) {
  console.log(`Processing directory: ${srcDir}`);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    
    if (entry.isDirectory()) {
      await processDirectory(srcPath, destPath);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.css'))) {
      const success = await minifyFile(srcPath, destPath);
      if (success) {
        console.log(`Successfully processed ${srcPath} -> ${destPath}`);
      } else {
        console.log(`Failed to process ${srcPath}`);
      }
    } else {
      console.log(`Skipping non-js/css file: ${srcPath}`);
    }
  }
}

console.log('Starting minification process...');
processDirectory(sourceDir, targetDir).catch(error => {
  console.error('Fatal error during minification:', error);
  process.exit(1);
}); 
