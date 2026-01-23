#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const clipboardy = require('clipboardy');

// ===== 获取版本号 =====
let VERSION = 'unknown';
try {
  // 尝试从 package.json 读取版本
  const pkg = require('./package.json');
  VERSION = pkg.version || 'unknown';
} catch (e) {
  // 如果找不到 package.json（比如全局安装时路径不对），尝试从 __dirname 找
  try {
    const pkgPath = path.join(__dirname, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      VERSION = pkg.version || 'unknown';
    }
  } catch (err) {
    // 忽略错误，保留 unknown
  }
}

// ===== 帮助信息 =====
function showHelp() {
  console.log(`
devz v${VERSION} —— 快速收集项目文件内容到剪贴板

用法:
  devz [包含规则] [排除规则]

参数说明:
  [包含规则]  : 逗号分隔的文件匹配规则（默认: ".vue,.js,package.json"）
                - 扩展名：如 .vue, .ts
                - 完整文件名：如 package.json, vite.config.js

  [排除规则]  : 逗号分隔的文件或目录名（可选）
                - 文件：如 package-lock.json, .DS_Store
                - 目录：如 dist, coverage, __tests__
                - 注意：node_modules 和 .git 始终被排除，无需手动指定

示例:
  devz                          # 默认包含 .vue/.js/package.json
  devz ".ts,.tsx" "dist,__tests__"
  devz "" ".env.local"          # 使用默认包含，但排除 .env.local

选项:
  -h, --help    显示此帮助信息
`);
}

// ===== 参数解析 =====
const args = process.argv.slice(2);

if (args.includes('-h') || args.includes('--help')) {
  showHelp();
  process.exit(0);
}

const includeArg = args[0] || '.vue,.js,package.json';
const excludeArg = args[1] || '';

const userIncludePatterns = includeArg.split(',').map(p => p.trim()).filter(Boolean);
const userExcludePatterns = excludeArg.split(',').map(p => p.trim()).filter(Boolean);

const FORCE_EXCLUDE_DIRS = ['node_modules', '.git'];
const excludePatterns = [...new Set([...FORCE_EXCLUDE_DIRS, ...userExcludePatterns])];

// ===== 匹配逻辑 =====
function matchesPattern(name, patterns) {
  for (const p of patterns) {
    if (name === p) return true;
    if (p.startsWith('.') && path.extname(name) === p) return true;
  }
  return false;
}

function shouldIncludeFile(filename) {
  return matchesPattern(filename, userIncludePatterns);
}

function shouldExcludeItem(itemName) {
  return matchesPattern(itemName, excludePatterns);
}

// ===== 文件收集 =====
function collectFiles(dir, fileList = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (shouldExcludeItem(item)) continue;

    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      collectFiles(fullPath, fileList);
    } else {
      if (shouldIncludeFile(item)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

// ===== 主函数 =====
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

    console.log(`✅ 已复制 ${files.length} 个文件到剪贴板！`);
    console.log(`   包含: [${userIncludePatterns.join(', ') || '（无）'}]`);
    console.log(`   排除: [${excludePatterns.join(', ')}]`);
  } catch (err) {
    console.error('❌ 错误:', err.message);
    process.exit(1);
  }
}

main();