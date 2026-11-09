import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import ElementPlus from 'unplugin-element-plus/vite'

// https://vite.dev/config/
export default defineConfig(() => {
  const config: UserConfig = {
    plugins: [vue(), vueJsx(), ElementPlus({}), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    base: './',
    build: {
      outDir: '../../dist/webview',
      emptyOutDir: true,
      minify: true
    },
    server: {
      host: true,
      hmr: true,
      // 供 host 侧 F5（IMG_TREE_DEV_SERVER）直连加载，端口固定避免配置漂移；
      // 被占用时直接报错，不再自动递增
      strictPort: true,
      open: false,
      // VS Code webview 的 origin 是 vscode-webview://<uuid>，不在 vite 默认的
      // CORS 白名单（localhost 类来源）里，module script 会被浏览器整体拦截
      cors: { origin: '*' }
    }
  }
  return config
})
