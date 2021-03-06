import fs from 'fs-extra'

import path from 'path'
import { pathToFileURL } from 'url'

import chalk from 'chalk'

import { removeSuffix } from '../utils.mjs'

import { bootTemplateProps, buildToFile } from '../templateRunner.mjs'

const buildStaticTemplate = async (routeTable, root, site, _yx) => {
  const [, , file] = routeTable

  const {
    site: { root: siteRoot },
    global,
  } = _yx

  const i18nm = global.i18nMessages

  console.log(chalk.blue(i18nm.info), i18nm.buildStaticTemplate(file))

  const bootJsPath = path.join(siteRoot, 'pages', file + '.boot.mjs')
  let bootJs
  try {
    bootJs = await import(pathToFileURL(bootJsPath))
  } catch (e) {
    // console.log(e)
  }
  if (!bootJs || bootJs.getServerProps) {
    const filesForCopy = [file, file + '.boot.mjs']

    filesForCopy.forEach(file => {
      const target = path.join(root, '.production', 'pages', file)
      try {
        fs.copySync(path.join(root, 'pages', file), target)
      } catch (e) {
        // console.log(e)
      }
    })
  } else {
    const { staticProps } = await bootTemplateProps({
      file,
      _yx,
      whichOnes: ['static'],
    })

    await buildToFile({
      outputFileName: removeSuffix(file),
      file,
      _yx,
      booted: staticProps,
    })
  }
}

export default buildStaticTemplate
