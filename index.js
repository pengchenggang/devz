#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const clipboardy = require('clipboardy')
const inquirer = require('inquirer')
const prompt = inquirer.default.prompt // 👈 关键！

// ===== 获取版本号 =====
let VERSION = 'unknown'
try {
  const pkg = require('./package.json')
  VERSION = pkg.version || 'unknown'
} catch (e) {
  try {
    const pkgPath = path.join(__dirname, 'package.json')
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
      VERSION = pkg.version || 'unknown'
    }
  } catch (err) {
    // ignore
  }
}

// ===== 帮助信息 =====
function showHelp () {
  console.log(`
devz v${VERSION} —— 开发辅助工具

用法:
  devz                          # 显示交互菜单
  devz copy [包含规则] [排除规则]  # 复制项目文件内容到剪贴板
  devz template <name>          # 复制指定模板（如 vue2init）
  devz help | -h | --help       # 显示此帮助

子命令:
  copy        收集指定文件内容并复制到剪贴板
  template    复制代码模板（当前支持: vue2init）

示例:
  devz
  devz copy ".ts,.tsx" "dist,node_modules"
  devz template vue2init

选项:
  -h, --help    显示帮助信息
`)
}

// ===== Vue 2 模板（从文件读取）=====
function copyVue2Template () {
  const templatePath = path.join(__dirname, 'template', 'vue2init.vue')

  try {
    if (!fs.existsSync(templatePath)) {
      console.error(`❌ 模板文件不存在: ${templatePath}`)
      process.exit(1)
    }

    const template = fs.readFileSync(templatePath, 'utf8')
    clipboardy.writeSync(template)
    console.log('✅ Vue 2 初始化模板已复制到剪贴板！')
  } catch (err) {
    console.error('❌ 读取或复制模板失败:', err.message)
    process.exit(1)
  }
}

// ===== 原有文件收集逻辑 =====
function runCopyCommand (includeArg, excludeArg) {
  const userIncludePatterns = (includeArg || '.vue,.js,package.json')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean)

  const userExcludePatterns = (excludeArg || '')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean)

  const FORCE_EXCLUDE_DIRS = ['node_modules', '.git']
  const excludePatterns = [...new Set([...FORCE_EXCLUDE_DIRS, ...userExcludePatterns])]

  function matchesPattern (name, patterns) {
    for (const p of patterns) {
      if (name === p) return true
      if (p.startsWith('.') && path.extname(name) === p) return true
    }
    return false
  }

  function shouldIncludeFile (filename) {
    return matchesPattern(filename, userIncludePatterns)
  }

  function shouldExcludeItem (itemName) {
    return matchesPattern(itemName, excludePatterns)
  }

  function collectFiles (dir, fileList = []) {
    const items = fs.readdirSync(dir)
    for (const item of items) {
      if (shouldExcludeItem(item)) continue

      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        collectFiles(fullPath, fileList)
      } else {
        if (shouldIncludeFile(item)) {
          fileList.push(fullPath)
        }
      }
    }
    return fileList
  }

  try {
    const files = collectFiles('.')
    let output = ''

    for (const file of files) {
      const relPath = path.relative('.', file).replace(/\\/g, '/')
      const content = fs.readFileSync(file, 'utf8')
      output += `[${relPath}]\n${content}\n\n`
    }

    clipboardy.writeSync(output)

    console.log(`✅ 已复制 ${files.length} 个文件到剪贴板！`)
    console.log(`   包含: [${userIncludePatterns.join(', ') || '（无）'}]`)
    console.log(`   排除: [${excludePatterns.join(', ')}]`)
  } catch (err) {
    console.error('❌ 错误:', err.message)
    process.exit(1)
  }
}

// ===== 菜单交互 =====
function showMenu () {
  prompt([
    {
      type: 'rawlist',
      name: 'action',
      message: '请选择操作：',
      choices: [
        { name: '复制项目文件内容（devz copy）', value: 'copy' },
        { name: '复制 Vue 2 初始化模板（devz template vue2init）', value: 'vue2' },
        { name: '帮助（devz help）', value: 'help' },
        { name: '退出', value: 'exit' }
      ],
      // pageSize: 10,     // 必须 ≥ 选项数
      loop: false,
      // 👇 关键：禁用内置帮助提示，减少渲染复杂度
    }
  ], {
    // 👇 强制使用标准输入输出流，并假设是 TTY
    input: process.stdin,
    output: process.stdout
  })
    .then((answers) => {
      switch (answers.action) {
        case 'copy':
          runCopyCommand()
          break
        case 'vue2':
          copyVue2Template()
          break
        case 'help':
          showHelp()
          break
        case 'exit':
        default:
          console.log('👋 已退出。')
          process.exit(0)
      }
    })
    .catch((err) => {
      console.error('❌ 菜单错误:', err.message)
      process.exit(1)
    })
}

// ===== 主入口：命令解析 =====
const args = process.argv.slice(2)

// 统一处理 help
if (
  args.includes('-h') ||
  args.includes('--help') ||
  args[0] === 'help'
) {
  showHelp()
  process.exit(0)
}

const command = args[0]

if (command === 'copy') {
  // devz copy [include] [exclude]
  runCopyCommand(args[1], args[2])
} else if (command === 'template') {
  // devz template <name>
  const templateName = args[1]
  if (templateName === 'vue2init') {
    copyVue2Template()
  } else {
    console.error(`❌ 未知模板: ${templateName}`)
    console.log('当前支持的模板: vue2init')
    process.exit(1)
  }
} else if (args.length === 0) {
  // devz （无参数）→ 菜单
  showMenu()
} else {
  // 未知命令
  console.error(`❌ 未知命令: ${command}`)
  console.log('可用命令: copy, template, help')
  console.log('运行 `devz help` 查看帮助')
  process.exit(1)
}