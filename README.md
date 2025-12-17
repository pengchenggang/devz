# devz
npm install -g devz

## 安装

npm config get registry

npm config set registry https://registry.npmjs.org/

恢复之前自己的
npm config set registry https://registry.npmmirror.com/

npm login

npm whoami

npm pack
npm install -g devz-1.0.0.tgz

测试你的包
npm uninstall -g devz
rm devz-1.0.0.tgz

npm list -g --depth=0

npm bin -g
C:\Users\Reciter\.nvmd\versions\16.18.0

由于用了 nvmd 所有 环境变量没有添加命令目录

npm config set //registry.npmjs.org/:_authToken=你的令牌字符串

发布包
npm publish

查看当前path的命令
echo %PATH%
$env:PATH

不重启 全部vscode ，更新环境变量 命令，pwsh

$sysPath = [Environment]::GetEnvironmentVariable('PATH','Machine')
$userPath = [Environment]::GetEnvironmentVariable('PATH','User')
$env:PATH = ($sysPath,$userPath -join ';') -replace ';+',';'

版本更新命令
npm version patch      # 1.0.0 → 1.0.1 （修订号）
npm version minor      # 1.0.0 → 1.1.0 （次版本）
npm version major      # 1.0.0 → 2.0.0 （主版本）

## 自动更新版本号并发布的命令

npm version patch -m "chore: release %s" && git push --follow-tags && npm publish