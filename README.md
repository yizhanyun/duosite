# duosite

Duosite (duo: 多, many in Simplified Chinese) is a web server on top of fastify that aims to host and run many sub sites, each with its own sub setting, folder structure and template / view engine, and file system based routing  as Nextjs.

## why duosite?

The reason to develop duosite is simple: I need a web server that allows me experiment old school html / css / js, with each site and setup indepent of each other.

The same goal can be achieved by checkouting out different branches with a different setup. The problem is that then each branch would not be visible to eachother at the same time.

Say I would like to expriment a subsite with ejs template engine and another one with marko engine. I don't want to swith branches. The two should coexist harmony. That's the staring idea of duosite.

## Current goal

The current goal is to provide a convinient environment for development, experiments and web tech teaching and study.

Why it matures, duosite may target production level efficiency. But that is NOT the goal yet.

## Why choose fastify

Of course because I used it before and liked it.

And its has one cool feature: rewriteUrl that allows duosite to rewrite a request like `my-site-in-ejs.localhost/index.html` to `localhost/my-site-in-ejs/index.html`.

## Development log

This section logs important ideas, design reationale and choices along the development. It is not intended to be complete and well structured but to reflect technology design and choices along the road.

### Folder structure

duosite
 |- server.js : server source code
 |- settings.js : shared settings accross environment
 |- settings.development.js: settings for development only
 |- settings.production.js` : settings for production
 |- src : server source code  folder
    |- utils.js : utils used by server
    |- lang : i18n dictionary
        |- zh-cn : Ssimplified Chinese
        |- en : English
    |- engines : source code for view / template engines
 |- sites : root for sites
    |- www : default site
    |- site1 : sub site
       |- settings.js : shared settings accross environment
       |- settings.development.js: settings for development only
       |- settings.production.js` : settings for production
       |- static : static files such as images, icons etc.
       |- src : source code (html / template etc.)
          |- pages : static html pages or templates subject to each individual engine's interpretation
          |- views / templates / includes / components : source code / templates etc. subject to each individual engine's interpretation

### Duosite server settings

Duotsite server settings are composed of three files:

- `settings.js` : shared settings accross environment
- `settings.development.js`: settings for development only
- `settings.production.js` : settings for production

Eventual setting will be a deep merge of `settings.js` and`settings.development.js` in development environment, and  `settings.js` and`settings.production.js` in production environment.
