// Default build site
import rimraf from 'rimraf'
import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import { readFile } from 'fs/promises'

import child_process from 'child_process'

import buildHtml from './builders/buildHtml.mjs'
import buildStaticTemplate from './builders/buildStaticTemplate.mjs'
import buildCatchTemplate from './builders/buildCatchTemplate.mjs'

const build = async (root, site, _yx, fileRoutingTable) => {
  const { global, site: siteConfig = {} } = _yx

  const { settings: globalSettings, i18nMessages: i18nm, lang } = global
  const { settings: siteSettings = {} } = siteConfig
  const { viewEngine = {} } = siteSettings

  console.log(chalk.blue(i18nm.info), i18nm.startBuildingSite(site))
  console.log(chalk.blue(i18nm.info), i18nm.cleanPreviousBuild)
  rimraf.sync(path.join(root, '.production'))
  fs.mkdirpSync(path.join(root, '.production'))

  console.log(chalk.blue(i18nm.info), i18nm.copySettings)
  const filesForCopy = ['settings.mjs', 'settings.production.mjs']

  filesForCopy.forEach(file => {
    const target = path.join(root, '.production', file)
    try {
      fs.copySync(path.join(root, file), target)
    } catch (e) {
      // console.log(e)
    }
  })

  for (const table of fileRoutingTable) {
    const [type, segments, file] = table
    if (type === 'static') {
      if (file.endsWith('.html')) {
        console.log(chalk.blue(i18nm.info), i18nm.buildHtml(file))
        await buildHtml(table, root, site, _yx)
      } else if (viewEngine.ext && file.endsWith(viewEngine.ext)) {
        await buildStaticTemplate(table, root, site, _yx)
      }
    } else await buildCatchTemplate(table, root, site, _yx)
  }

  // const cwdNow = process.cwd()

  try {
    const sitePackage = JSON.parse(
      await readFile(new URL(`${root}/package.json`, import.meta.url))
    )
    if (sitePackage.scripts.build) {
      console.log(chalk.blue(i18nm.info), i18nm.runSiteBuild)

      // process.chdir(root)
      child_process.execSync('yarn build', {
        cwd: root,
        stdio: 'inherit',
      })
    }
  } catch (e) {
    // console.log(e)
  }

  // if (err) {
  //   console.log(`error: ${error.message}`)
  //   return
  // }
  // if (stderr) {
  //   console.log(`stderr: ${stderr}`)
  //   return
  // }

  // process.chdir(cwdNow)

  const foldersForCopy = ['src', 'api', ['public', 'static']]
  foldersForCopy.forEach(folder => {
    const _folder = Array.isArray(folder) ? path.join(...folder) : folder

    const target = path.join(root, '.production', _folder)
    fs.mkdirpSync(target)
    console.log(chalk.blue(i18nm.info), i18nm.copyFolder(_folder))
    const source = path.join(root, _folder)
    if (fs.pathExistsSync(source)) {
      try {
        fs.copySync(source, target)
      } catch (e) {
        // console.log(e)
      }
    }
  })

  // copy non template files from pages
  const targetPages = path.join(root, '.production', 'pages')
  fs.mkdirpSync(targetPages)
  console.log(
    chalk.blue(i18nm.info),
    i18nm.copyFolder(path.join(root, 'pages'))
  )

  fs.copySync(path.join(root, 'pages'), targetPages, {
    filter: src => {
      const srcStat = fs.statSync(src)
      if (srcStat.isDirectory()) return true
      if (viewEngine.ext && src.endsWith(viewEngine.ext)) return false
      if (src.endsWith('.boot.mjs')) return false
      return true
    },
  })
}
export { build }
