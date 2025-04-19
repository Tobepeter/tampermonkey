import artTemplate from 'art-template'
import { dirname } from 'dirname-filename-esm'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { clearDir } from './utils/node-util.js'
import { program } from 'commander'

const __dirname = dirname(import.meta)
dotenv.config()

program.option('-n, --dry-run', 'dry run')
program.option('-v, --verbose', 'verbose')
program.option('-c, --clean', 'clean')
program.parse(process.argv)
const { verbose, dryRun, clean } = program.opts()

// eg: javascript:(function(){var url='https://raw.githack.com/Tobepeter/tampermonkey/main/bookmark/stats.js';var s=document.createElement('script');s.onload=function(){};s.src=url;document.body.appendChild(s);})();

const prevMap = {
  raw: 'https://raw.githack.com',
  rawcdn: 'https://rawcdn.githack.com',
  rawgithub: 'https://raw.githubusercontent.com',
}
const { GIT_REPO } = process.env
const projectRoot = path.resolve(__dirname, '../')
const bookmarkRelativeDir = 'bookmark'
const bookmarkDir = path.resolve(projectRoot, bookmarkRelativeDir)
const outputDir = path.join(bookmarkDir, 'template/')
const templatePath = path.resolve(__dirname, './bookmark.art')
const branch = 'main'

function getJsFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.js'))
    .filter((file) => !fs.statSync(path.join(dir, file)).isDirectory())
    .map((file) => path.join(bookmarkRelativeDir, file))
}

function prepare() {
  if (dryRun) return

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  // TODO: 寻找通用的代码，多个项目自己手写还是比较麻烦的
  clearDir(outputDir)
}

function setNoEscape() {
  artTemplate.defaults.excape = false
  // NOTE: 声明文件不知道手写，其实拼写错了
  // @ts-ignore
  artTemplate.defaults.escape = false
}

function main() {
  prepare()
  if (clean) return
  const jsFiles = getJsFiles(bookmarkDir)

  // NOTE: 这是https协议，不能用path join，会少一个`/`
  const baseUrl = prevMap.raw + '/' + path.join(GIT_REPO, branch)

  setNoEscape()

  let verboseStr = ''
  for (const jsFile of jsFiles) {
    const scriptUrl = baseUrl + '/' + jsFile

    const result = artTemplate(templatePath, {
      url: `\"${scriptUrl}\"`,
    })
    const outputFileName = path.basename(jsFile, '.js') + '.template'
    const outputPath = path.resolve(outputDir, outputFileName)

    if (!dryRun) {
      fs.writeFileSync(outputPath, result, 'utf-8')
    } else {
      console.log(`${jsFile} -> ${outputPath}`)
      console.log('=== result ===')
      console.log(result)
      console.log('')
    }

    verboseStr += `Generated bookmark for ${jsFile} at: ${outputPath}\n`
  }

  if (verbose) {
    console.log(verboseStr)
  }
}

main()
