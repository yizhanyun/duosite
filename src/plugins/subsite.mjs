import fastifyStatic from 'fastify-static'
import path from 'path'
import { pathToFileURL } from 'url'

import {
  genericGetRoute,
  buildFileRouter,
  buildApiRouter,
} from './getHandler.mjs'

import {
  buildFilesRoutingTable,
  buildCatchRoutingTable,
  buildApiRoutingTable,
  buildApiRouteUrlVariableTable,
  buildFileRouteUrlVariableTable,
} from '../utils.mjs'

const siteRootName = 'sites'

const isProduction = process.env.NODE_ENV === 'production'

//  Plugin to handle each subsite's request

// opts: { prefix, _duosite: { siteRoot }}

const buildSubsitePlugin = async (buildSite, target) => {
  const subsite = async function (fastify, opts, done) {
    const { _duosite, prefix: site, siteSettings: settings } = opts

    // do nothing if building but not self
    if (buildSite && target !== '*' && target !== site) return

    const { global, watcher } = _duosite

    const { root } = global

    const siteRoot = path.join(
      root,
      siteRootName,
      site,
      isProduction && !buildSite ? '.production' : ''
    )

    if (watcher) {
      const { watch = [] } = settings || {}
      for (const _path of watch) {
        const forWatch = path.join('sites', site, _path)
        watcher.add(forWatch)
      }
    }

    const {
      staticRoot = 'static', // Root for statics that are serverved as is.
      staticCompiledRoot = 'bundle', // Root for statics that are generated by bundlers
      viewEngine = {},
    } = settings

    // Build global services

    let buildSiteServices

    try {
      buildSiteServices = (
        await import(
          pathToFileURL(path.join(siteRoot, 'src', 'siteServices.mjs'))
        )
      ).default
    } catch (e) {
      // console.log(e)
    }

    const siteServices = buildSiteServices
      ? await buildSiteServices(_duosite, settings, site, root)
      : {}

    // build site  enhancer

    let enhance
    try {
      enhance = (
        await import(pathToFileURL(path.join(siteRoot, 'src', 'enhancer.mjs')))
      ).default
    } catch (e) {
      // console.log(e)
    }
    // build site engine

    const { name, ext } = viewEngine

    let engine

    if (name && ext) {
      let buildTemplateEngine

      try {
        buildTemplateEngine = (
          await import(pathToFileURL(path.join(siteRoot, 'src', 'engines.mjs')))
        ).default
      } catch (e) {
        // console.log(e)
      }

      if (buildTemplateEngine) {
        // use local provided engines

        engine = await buildTemplateEngine({
          ..._duosite,
          site: {
            root: siteRoot,
            settings,
            name: site,
            services: siteServices,
          },
        })
      } else {
        // use global engines
        let buildTemplateEngine
        try {
          buildTemplateEngine = (await import('./engines.mjs')).default
        } catch (e) {
          // console.log(e)
        }
        if (buildTemplateEngine) {
          engine = await buildTemplateEngine({
            ..._duosite,
            site: {
              root: siteRoot,
              settings,
              name: site,
              services: siteServices,
            },
          })
        }
      }
    }

    // Add static handlers

    fastify.register(fastifyStatic, {
      root: path.join(siteRoot, 'public', staticRoot),
      prefix: `/${staticRoot}`,
    })

    if (staticCompiledRoot !== staticRoot) {
      fastify.register(fastifyStatic, {
        root: path.join(siteRoot, 'public', staticCompiledRoot),
        prefix: `/${staticCompiledRoot}`,
        decorateReply: false, // the reply decorator has been added by the first plugin registration
      })
    }

    fastify.decorateRequest('_duosite', null)

    const duositeConfig = {
      ..._duosite,
      site: {
        root: siteRoot,
        settings,
        prodRoot: path.join('.production', siteRoot),
        name: site,
        engine,
        services: siteServices,
      },
    }

    // enhance request with _duosite

    fastify.addHook('preHandler', (request, reply, done) => {
      request._duosite = {
        ...duositeConfig,
        url:
          request.url[0] === '/'
            ? request.url.replace('/' + site, '')
            : request.url.replace(site, ''),
      }
      done()
    })

    fastify.route(genericGetRoute)

    let fileRoutingTable
    let catchRoutingTable
    try {
      fileRoutingTable = buildFilesRoutingTable(
        path.join(siteRoot, 'pages'),
        ext
      )

      catchRoutingTable = buildCatchRoutingTable(fileRoutingTable)

      const fileRoutingUrlVariableTable = buildFileRouteUrlVariableTable(
        catchRoutingTable
      )

      fileRoutingUrlVariableTable.forEach(tables => {
        tables.forEach(table => {
          const router = buildFileRouter(table)
          fastify.route(router)
        })
      })

      const apiRoutingTable = buildApiRoutingTable(
        path.join(siteRoot, 'api'),
        '.js'
      )
      const apiRoutingUrlVariableTable = buildApiRouteUrlVariableTable(
        apiRoutingTable
      )

      apiRoutingUrlVariableTable.forEach(tables => {
        tables.forEach(table => {
          const router = buildApiRouter(table, siteRoot)
          fastify.route(router)
        })
      })
    } catch (e) {
      // console.log(e)
    }

    enhance && (await enhance(fastify, duositeConfig))

    if (buildSite && (target === '*' || target === site)) {
      let defaultBuildSite
      try {
        defaultBuildSite = await import('../buildSite.mjs')
      } catch (e) {
        // console.log(e)
      }

      let customBuildSite

      try {
        customBuildSite = await import(
          pathToFileURL(path.join(siteRoot, 'src', 'buildSite.mjs'))
        )
      } catch (e) {
        // console.log(e)
      }
      const prebuild =
        (customBuildSite && customBuildSite.prebuild) ||
        (defaultBuildSite && defaultBuildSite.prebuild)

      prebuild &&
        (await prebuild(siteRoot, site, duositeConfig, fileRoutingTable))

      const _build =
        (customBuildSite && customBuildSite.build) ||
        (defaultBuildSite && defaultBuildSite.build)

      _build && (await _build(siteRoot, site, duositeConfig, fileRoutingTable))

      const postbuild =
        (customBuildSite && customBuildSite.postbuild) ||
        (defaultBuildSite && defaultBuildSite.postbuild)

      postbuild &&
        (await postbuild(siteRoot, site, duositeConfig, fileRoutingTable))
    }

    done()
  }

  return subsite
}

export default buildSubsitePlugin
