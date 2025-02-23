const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

// Read package.json to get version.
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json')));
const version = packageJson.version;

// Create build directory if it doesn't exist.
const buildDir = path.join(__dirname, '../build');
if (!fs.existsSync(buildDir)) {
	fs.mkdirSync(buildDir, { recursive: true });
}

// Create zip file.
const zip = new AdmZip();

// Add the extension directory with 'extension' as the root folder in zip.
const extensionDir = path.join(__dirname, '../extension');
const files = fs.readdirSync(extensionDir);
files.forEach(file => {
	const filePath = path.join(extensionDir, file);
	const zipPath = path.join('extension', file);
	if (fs.statSync(filePath).isDirectory()) {
		zip.addLocalFolder(filePath, zipPath);
	} else {
		zip.addLocalFile(filePath, 'extension');
	}
});

// Generate zip file name with version.
const zipFileName = `wpforms-devtools-chrome-ext-${version}.zip`;
const zipFilePath = path.join(buildDir, zipFileName);

// Write the zip file.
zip.writeZip(zipFilePath);

console.log(`Created ${zipFileName} in build directory successfully.`);
