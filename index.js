#!/usr/bin/env node

// index.js（CommonJS，适用于 Node.js 12+）
const fs = require('fs');
const path = require('path');
const clipboardy = require('clipboardy'); // ✅ v2.3.0 支持 require()

function getAllVueAndJsFiles(dir, fileList = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (item === 'node_modules' || item === '.git') continue;
      getAllVueAndJsFiles(fullPath, fileList);
    } else if (/\.(vue|js)$/.test(item)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function main() {
  try {
    const targetDir = '.';
    const files = getAllVueAndJsFiles(targetDir);
    let output = '';

    for (const file of files) {
      const relativePath = path.relative(targetDir, file).replace(/\\/g, '/');
      const content = fs.readFileSync(file, 'utf8');
      output += `[${relativePath}]\n${content}\n\n`;
    }

    clipboardy.writeSync(output); // ✅ v2 支持 sync
    console.log(`✅ 已复制 ${files.length} 个 .vue/.js 文件内容到剪贴板！`);
  } catch (err) {
    console.error('❌ 出错:', err.message);
  }
}

main();