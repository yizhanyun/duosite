import fs from 'fs-extra'

import path from 'path'

import chalk from 'chalk'

import { removeSuffix } from '../utils.mjs'

import {
  bootTemplateProps,
  bootTemplateStaticPaths,
  serveTemplate,
  buildToFile,
} from '../templateRunner.mjs'

const buildStaticTemplate = async (routeTable, root, site, _duosite) => {
  const [, , file] = routeTable

  const {
    site: { root: siteRoot, engine },
    global,
  } = _duosite

  const i18nm = global.i18nMessages

  console.log(chalk.blue(i18nm.info), i18nm.buildStaticTemplate(file))

  const bootJsPath = path.join(siteRoot, 'pages', file + '.boot.mjs')
  let bootJs
  try {
    bootJs = await import(bootJsPath)
  } catch (e) {
    console.log(e)
  }
  if (!bootJs || bootJs.getServerProps) {
    const filesForCopy = [file, file + '.boot.mjs']

    filesForCopy.forEach(file => {
      const target = path.join(root, '.production', 'pages', file)
      console.log(chalk.blue(i18nm.info), i18nm.buildServerSideRender(file))
      try {
        fs.copySync(path.join(root, 'pages', file), target)
      } catch (e) {
        // console.log(e)
      }
    })
  } else {
    const { staticProps } = await bootTemplateProps({
      file,
      _duosite,
      whichOnes: ['static'],
    })

    await buildToFile({
      outputFileName: removeSuffix(file),
      file,
      _duosite,
      booted: staticProps,
    })
  }
}

export default buildStaticTemplate
