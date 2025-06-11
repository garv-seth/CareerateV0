#!/usr/bin/env node

// Careerate Deployment Verification Script
console.log('🔍 Careerate Deployment Verification');
console.log('====================================');

console.log('\n📊 Environment Information:');
console.log(`Node.js Version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);
console.log(`Memory Usage: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);

console.log('\n🔧 Environment Variables:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${process.env.PORT}`);
console.log(`NODE_OPTIONS: ${process.env.NODE_OPTIONS || 'not set'}`);

console.log('\n📁 File System Check:');
const fs = require('fs');
const path = require('path');

const checkFile = (filePath, description) => {
    try {
        const stats = fs.statSync(filePath);
        const size = stats.isFile() ? `${Math.round(stats.size / 1024)}KB` : 'directory';
        console.log(`✅ ${description}: ${filePath} (${size})`);
        return true;
    } catch (error) {
        console.log(`❌ ${description}: ${filePath} - ${error.message}`);
        return false;
    }
};

checkFile('./dist/server.js', 'Server File');
checkFile('./package.json', 'Package Config');
checkFile('./public/index.html', 'Frontend Index');

console.log('\n📦 Dependencies Check:');
const checkModule = (moduleName) => {
    try {
        require.resolve(moduleName);
        console.log(`✅ ${moduleName}: Available`);
        return true;
    } catch (error) {
        console.log(`❌ ${moduleName}: Missing`);
        return false;
    }
};

const criticalModules = [
    'express',
    'cors',
    'winston',
    'helmet',
    'express-rate-limit',
    'socket.io'
];

criticalModules.forEach(checkModule);

console.log('\n🚀 Server Syntax Check:');
try {
    if (fs.existsSync('./dist/server.js')) {
        require('./dist/server.js');
        console.log('✅ Server file syntax is valid');
    } else {
        console.log('❌ Server file not found');
    }
} catch (error) {
    console.log(`❌ Server file has errors: ${error.message}`);
}

console.log('\n✅ Verification Complete');
console.log('========================'); 