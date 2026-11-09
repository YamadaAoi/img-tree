## 调试

打开`src\extension.ts`文件，按下`F5`键，会打开一个新的vscode窗口进行插件调试

## Webview 热更调试

- 终端运行 `pnpm dev-vue`（启动 vite dev server，端口固定 5173）
- F5 选择 `Run Extension (Webview HMR)` 启动配置（通过环境变量 `IMG_TREE_DEV_SERVER` 让插件从 dev server 加载 webview）
- 之后修改 Vue 代码即时热更，无需重新 `pnpm build-vue`；postMessage、文件监听等均为真实交互

## 打包

- 标记tag
  `git tag v0.0.1`
  `git push origin v0.0.1`
- 安装依赖
  `npm i -g @vscode/vsce`
- 运行命令
  `pnpm vsix`
