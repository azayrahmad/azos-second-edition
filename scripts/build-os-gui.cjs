const fs = require('fs');
const path = require('path');
const UglifyJS = require('uglify-js');

const basePath = 'src/os-gui';
const distPath = path.join(basePath, 'dist');

if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
}

// Concatenate JS files
const jsFiles = [
    'utils.js',
    'MenuBar.js',
    'MenuPopup.js',
    'ContextMenu.js',
    '$Window.js',
    'Toolbar.js',
    'AddressBar.js',
];

const jsContent = jsFiles.map(file => fs.readFileSync(path.join(basePath, 'src', file), 'utf-8')).join('\n');
fs.writeFileSync(path.join(distPath, 'os-gui.js'), jsContent);

// Minify JS
const minifiedJs = UglifyJS.minify(jsContent);
fs.writeFileSync(path.join(distPath, 'os-gui.min.js'), minifiedJs.code);

// Concatenate CSS files
const cssFiles = [
    'windows-98.css',
    'Toolbar.css',
    'address-bar.css',
    'animations.css',
    'dialog-window.css',
    'layout.css',
];

const cssContent = cssFiles.map(file => fs.readFileSync(path.join('public/os-gui', file), 'utf-8')).join('\n');
fs.writeFileSync(path.join(distPath, 'os-gui.css'), cssContent);

console.log('os-gui build complete!');
