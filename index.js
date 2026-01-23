#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const clipboardy = require('clipboardy');

// 参数解析
const includeArg = process.argv[2] || '.vue,.js,package.json';
const excludeArg = process.argv[3] || ''; // 可选，第二个参数

const includePatterns = includeArg.split(',').map(p => p.trim()).filter(Boolean);
const excludePatterns = excludeArg.split(',').map(p => p.trim()).filter(Boolean);

// 通用匹配函数
function matchesPattern(filename, patterns) {
  for (const p of patterns) {
    // 1. 精确文件名匹配
    if (filename === p) {
      return true;
    }
    // 2. 扩展名匹配（使用 path.extname 确保是主扩展名）
    if (p.startsWith('.')) {
      if (path.extname(filename) === p) {
        return true;
      }
    }
  }
  return false;
}

function shouldInclude(filename) {
  return matchesPattern(filename, includePatterns);
}

function shouldExclude(filename) {
  return matchesPattern(filename, excludePatterns);
}

function collectFiles(dir, fileList = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (['node_modules', '.git'].includes(item)) continue;
      collectFiles(fullPath, fileList);
    } else {
      // 先包含，再排除
      if (shouldInclude(item) && !shouldExclude(item)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

function main() {
  try {
    const files = collectFiles('.');
    let output = '';

    for (const file of files) {
      const relPath = path.relative('.', file).replace(/\\/g, '/');
      const content = fs.readFileSync(file, 'utf8');
      output += `[${relPath}]\n${content}\n\n`;
    }

    clipboardy.writeSync(output);

    const includes = includePatterns.length ? includePatterns.join(', ') : '（无）';
    const excludes = excludePatterns.length ? excludePatterns.join(', ') : '（无）';
    console.log(`✅ 已复制 ${files.length} 个文件到剪贴板！`);
    console.log(`   包含: [${includes}]`);
    if (excludePatterns.length) {
      console.log(`   排除: [${excludes}]`);
    }
  } catch (err) {
    console.error('❌ 错误:', err.message);
  }
}

main();