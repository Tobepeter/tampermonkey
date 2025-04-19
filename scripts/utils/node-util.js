import { spawnSync } from 'child_process'
import fs from 'fs'
import { homedir } from 'os'
import path from 'path'

export function commandExists(command) {
  const result = spawnSync('which', [command], { stdio: 'ignore' })
  return result.status === 0
}

/**
 * 将 ~ 替换为当前用户的主目录
 * @desc fs.existsSync 等方法需要使用绝对路径
 */
export function expandTilde(filePath) {
  if (filePath.startsWith('~/') || filePath === '~') {
    return filePath.replace('~', homedir())
  }
  return filePath
}

/**
 * 保证目录存在
 */
export function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

/**
 * 清空目录
 * @desc 只是清空目录，不删除目录
 */
export function clearDir(dirPath) {
  if (!fs.existsSync(dirPath)) return

  fs.readdirSync(dirPath).forEach((file) => {
    fs.unlinkSync(path.join(dirPath, file))
  })
}
