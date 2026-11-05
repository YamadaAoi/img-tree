import path from 'node:path'

// 将 glob 编译为正则，支持 **、* 、? 与字面量段
// （覆盖 excludeFolders 的常见形式；不认识的语法按字面量处理，宁可漏过滤也不误过滤）
function compileGlob(glob: string): RegExp {
  let re = '^'
  let i = 0
  while (i < glob.length) {
    const c = glob[i]
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i += 2
        if (glob[i] === '/') {
          // '**/'：任意层级目录
          i++
          re += '(?:.*/)?'
        } else {
          // 段内 '**'：任意内容（可跨 /）
          re += '.*'
        }
      } else {
        i++
        re += '[^/]*'
      }
    } else if (c === '?') {
      i++
      re += '[^/]'
    } else if (c === '/' && glob.slice(i) === '/**') {
      // 结尾 '/**'：该目录下的任意内容
      i += 3
      re += '(?:/.*)?'
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&')
      i++
    }
  }
  return new RegExp(re + '$')
}

// 事件路径（相对于监听根目录）本身或任一祖先目录命中排除模式 → 忽略
// 与 fast-glob 的 ignore 目录剪枝语义一致
export function matchesIgnore(
  eventPath: string,
  rootPath: string,
  ignore: string[]
): boolean {
  if (!ignore.length) {
    return false
  }
  const relative = path.relative(rootPath, eventPath)
  if (!relative || relative.startsWith('..')) {
    return false
  }
  const segments = relative.split(path.sep).join('/').split('/')
  const matchers = ignore.map(compileGlob)
  for (let i = 1; i <= segments.length; i++) {
    const candidate = segments.slice(0, i).join('/')
    if (matchers.some(re => re.test(candidate))) {
      return true
    }
  }
  return false
}
