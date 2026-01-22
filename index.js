#!/usr/bin/env node

// index.js（CommonJS，适用于 Node.js 12+）
const fs = require('fs');
const path = require('path');
const clipboardy = require('clipboardy'); // ✅ v2.3.0 支持 require()

// ✅ 解析命令行参数：默认为 'vue,js'，也可传入如 'vue,js,jsx,html'
const extArg = process.argv[2] || 'vue,js';
const extensions = extArg.split(',').map(ext => ext.trim()).filter(Boolean);

// 构建正则：例如 /\.(vue|js|jsx|html)$/i
const extPattern = new RegExp(`\\.(${extensions.map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})$`, 'i');


function getAllVueAndJsFiles(dir, fileList = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (item === 'node_modules' || item === '.git') continue;
      getAllVueAndJsFiles(fullPath, fileList);
      } else if (extPattern.test(item)) {
    // } else if (/\.(vue|js)$/.test(item)) {
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
    // console.log(`✅ 已复制 ${files.length} 个 .vue/.js 文件内容到剪贴板！`);
    console.log(`✅ 已复制 ${files.length} 个 .${extensions.join('/.')} 文件内容到剪贴板！`);
  } catch (err) {
    console.error('❌ 出错:', err.message);
  }
}

main();