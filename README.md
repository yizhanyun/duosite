
[中文](#中文)

# duosite

Duosite (duo: 多, many in Simplified Chinese) is a web server that aims to host and run many sub sites, each with its own sub setting, folder structure and template / view engine, and file system based routing (in progress)  as Nextjs.

Duosite is built on top of the excellent [fastify](https://github.com/fastify/fastify) webserver.

## Why duosite?

The reason to develop duosite is simple: I need a web server that allows me to experiment html / css / js, with each site and setup indepent of each other.

The same goal can be achieved by checkouting out different branches with a different setup. The problem is that then each branch would not be visible to eachother at the same time.

Using `yarn` workspace can achieve it to but each subsite needs to maintian a separate server setup and ports. It's inconvinient as well.

Say I would like to expriment a subsite with ejs template engine and another one with marko engine. I don't want to swith branches or servers with different port, which is hard to memorize.

The two should coexist in harmony. And I can visit `site-ejs.localhost` and `site-marko.localhost` at the same time. That's the starting idea of duosite.

## Usage

### Install

Yarn:

`yarn add duosite`

Npm:

`npm install duosite`

This project uses yarn. So documentation below uses yarn too.


### List templates

`yarn duosite ls`

### Create new site from template

`yarn duosite new <template-name> <new-site-name>`

The new site name is subdomain name so it must comply with subdomain rules

### Run development server

`yarn duosite dev`

### Visit a subsite:

Open your browser and visit `<sub-site-name>.localhost:5000`.

Duosite uses 5000 as default port. You can change it by modifying `settings.js`

### Custom settings


#### Global / cross site settings

You can create custom global settings by creating two files at root your project:

1. settings.js

```
// shared settings
module.exports = {
  defaultSite: 'www', // default site name
  lang: 'en', // locale
  port: 5000, // server port number
}
```

2. settings.development.js

```
//  settings for development environment
module.exports = {
// any settings
}
```

Eventual setting is a deep merge of `settings.js` and `settings.development.js, the latter overwrites the former.

Currently duosite only uses `defaultSite`, `lang` and `port`.

In future it may support more settings


#### Subsite site settings

You can create subsite settings by creating two files at root the subsite:

1. settings.js

```
// shared settings
module.exports = {
  viewEngine: {
    name: 'liquid', // template name
    ext: '.liquid', // template extension
    options: {
      // options to be passed to view engine
    },
  },
}
```

2. settings.development.js

```
//  settings for development environment
module.exports = {
// any settings
}
```

Currently duosite only uses `viewEngine`.

Eventual setting is a deep merge of `settings.js` and `settings.development.js`, the latter overwrites the former.

In future it may support more settings



## Current goal and most import concepts

The current goal is to provide a convinient environment for expirementing, studing and demoing web technology that allow co-exist of multiple subsites.

When it matures, duosite may target production depoyment. But that is NOT the goal yet.

### Subsite

Each subsite is indepent.

Duosite doens't make much many assumptions about subsites, only three simple folder structure rules and one special reserved extensions:

- <site-root>/pages : where to put html / template files etc.
- <site-root>/public/static: where to put assets that don't require processing.
- <site-root>/public/bundle: where to put assets generated by bundle tools or compilers.
- <site-root>/pages/**/<filename>.boot.js: this file extension is specially reserved for booting data for templates. Duosite will NOT server files from pages folder with this exention. But it will serve this file from `static` and `bundle` folder


But if you choose so you can put any static contents in side `pages` folders as well.

And if you are a `fastify` developer who wants to further enhance your subsite, you can add routers and handlers to subsite. More documentation is coming for this.

### Template Projects

Duosite will gradually add template project set up for typical frameworks or libraries,  to save you time.

Now following are included.

`template-html` - bare html template project

`template-tailwind` - template for tailwind

`template-alpine` - template for alpine js

`template-liquid` - template for liquidjs template engine

You can run `yarn duosite ls` to show list of templates.

You can also run `yarn duosite new <template-name> <target-site-name>` to create a site with a template.

You are welcome to submit pull request to add more templates.

### View Engine / Template Engine

One goal of duosite is to allow users to experiment view engines easily.

Currently it only provides rudimental support for liquid engine developed of [harttle/liquidjs](https://github.com/harttle/liquidjs).

More is coming.

### Unified booting view / template

When duosite renders a template file, let's say `index.liquid`, it will look at the same folder a file named `index.liquid.boot.js`, which should export an asycn function getServerProps with following signature:

```
const getServerProps = async (ctx) => data
```

`ctx` has following properties that are to be expanded down the road:

```
{
  request: // fastify request object
  reply: // fastify reply object
}
```

Duosite will pass down `{...data, _ctx: ctx}` to the template engine


You can try with below:

`yarn duosite new template-liquid liquid-1`

`yarn duosite dev`

Visit `liquid-1.localhost:5000`

It will show following page:

```
Hello from boot.js

Below is from template

Alice
Bob
Carol

```

The first line is from data from `index.liquid.boot.js`:

```
const getServerProps = async ctx => {
  return {
    text: 'Hello from index.liquid.boot.js ',
  }
}

module.exports = {
  getServerProps,
}

```

## Why choose fastify as the base server

Of course because I used it before and liked it, but also some of its cool features.

### rewriteUrl

This one cool feature rewriteUrl allows duosite to rewrite a request like `my-site-in-ejs.localhost/index.ejs` to `localhost/my-site-in-ejs/index.ejs`. This allows duosite to use Fasity's plugin with a prefix feature that makes it transparent to develop router and handlers for subsite like a normal request without a subsite context.

### plugin with prefix and isoloated subserver

Fastify supports plugin with `prefix`, with each plugin's fastify server indepedent and isolated with others, which makes it perfect to handle each subsite's request indepently.


## Design and development ideas

This section logs important designs, ideas, reationale and choices along the development. As duosite is still at early stage, this section is NOT intended to be complete and well structured but rather to reflect design ideas and choices down the road.

### Duosite Project Folder structure

```
<duosite project root>
 |- server.js : server source code
 |- settings.js : shared settings accross environment
 |- settings.development.js: settings for development only
 |- settings.production.js` : settings for production
 |- src : server source code  folder
    |- utils.js : utils used by server
    |- lang : i18n dictionary
        |- messages : folder for message dictionaries
          |- zh-cn : Simplified Chinese
          |- en : English
          |- ...
    |- engines : source code for view / template engines
 |- sites : root for sites
    |- www : default site
    |- site1 : sub site
       |- settings.js : shared settings accross environment
       |- settings.development.js: settings for development only
       |- settings.production.js` : settings for production
       |- public : folders for public files served as is. Use url <sub-site.host>/[static|bundle]/...
          |- static : static files such as images, icons etc that is going to be served as is.
          |- bundle : static files generated by bundlers like webpack or other compilers generated
                      from other sources. bundle folder can be added to `.gitignore`
       |- pages :  static html pages or templates subject to individual engine's
                   interpretation
       |- src : source code (html / template etc.)
         |- lang : i18n dictonary for handlers
           |- zh-cn : Simplified Chinese
           |- en : English
           |- ...
         |- views / templates / includes / components : source code / templates etc. subject to each individual engine's interpretation
```

### Url try rules

#### Static files

Duosite mandates url starts with `/static/`  or `/bundle/` as static files and will be served as is, not subject to any other interpretation or redirect.

`static` is intended for static files requiring no processing. They should be managed by source control tools.

`bundle` is intended for static files that are generated by bundle tools for example webpack or compilers. They should NOT be managed by source control tools. They can be put in .gitignore.

Root forlder of the two is `<site-root>/public`

#### Non-static files

The current release supports `GET` only.

The server will serve files with follwing try rules in order, a term borrowed from nginx:

- `site-1.abc.com/` or `site-1.abc.com/abcd/.../` - `<site-root>/<url>/index.html`, then `<site-root>/<url>/index.[view-ext]`

- `site-1.abc.com/<segments>/abc` - `<site-root>/<segments>/abc.html`, then `<site-root>/<segments>/abc.[view-ext]`, then `<site-root>/<segments>/abc/index.html`, then `<site-root>/<segments>/abc/index.[view-ext]`

- `site-1.abc.com/<segments>/abc.[ext]` - `<site-root>/<segments>/abc.[ext]`



Root folder of each site's pages is `<site-name>/pages`.


### Duosite server settings

Duosite server settings are composed of three files:

```
- settings.js : shared settings accross environment
- settings.development.js: settings for development only
- settings.production.js : settings for production
```

Eventual setting will be a deep merge of `settings.js` and`settings.[development|production].js`.

### Subsite setting

Each subsite's settings for renderring each subsite.

Similar to duosite server, it has:

```
- settings.js : shared settings accross environment
- settings.development.js: settings for development only
- settings.production.js : settings for production
```

### Request decoration to add  `_duosite` to `request`

When duosite is booted, each subsite's settings, view engines, plugins etc. should be initiated and passed down as property `_duosite` of `request` to handlers.

### Boot duosite

Duosite is booted with following steps:

1. load server settings
2. scan sites folder, load site list and site settings
3. initiate view engine and other plugins with site settings
4. enhance `request` with `_duosite` property, which is a object with properties and methods for the subsite's handlers to use.

### Practical Functional Programming

Duosite follows pratical functional programming principles:

1. Avoid side effects unless absolutely necessary
2. Avoid closure / external variables unless absolutely necessary
3. Avoid too much functional abstraction for code readability

### Booting functions

1. loadGlobalSettings: siteRoot => globalSettingsObject
2. enhanceGlobalSettings: globalSettingsObject => globalSettingsObject
3. buildGlobalServices: globalSettingObject => globalServicesObject
4. enahceGlobalServicesObject: (globalSettingsObject, globalServicesObject) => globalServicesObject
5. loadLocalSettings: siteRoot => localSettingObject
6. enhanceLocalSettings: localSettingObject => localSettingObject
7. buildLocalSerServices: (localSettingObject, globalServicesObject) => localServicesObject
8. enhanceLocalServices: (localSettingObject, globalServicesObject, localSericesObject) => localServicesObject

### GET try rules

When a request hit, the URL will be resovled to a handler. The handler needs to decide the rules to try different resources. Duosite follows the following rules:

1. ends with `.[non view engine / template ext]`: server static file.
2. ends with `.[view engine ext]`: run engine, render file and serve output
3. ends with `/` : try `/index.html`, `/index.[view engine ext]`
4. ends with `/abc`, try `/abc.html`, `/abc.[view engine ext]`, `/abc/index.html`, `/index.[view engine ext]`
5. when resolve to view template, try to locate `abc.ext.boot.js`, run `getServerProps, getStaticProps`

### `_duosite` object

`request._duosite` has following shape:

```
{
  settings: {...}  // merged subsite settings
  engine: {...} // instantiated engine instance
  ... // TBD along development
}

```

### i18n

i18n is supported by dictionary of message or function per key to generate message for each locale with following folder structure:

```
<duosite-root>
  |- src
    |- lang
      |- messages  // for server and application messages

```

i18n will be merged in the order of <duosite-source>/src/lang and <site-root>/src/lang/
site i18n will loaded from site.

```
<subsite-root>
  |- src
    |- lang
      |- handlers  // for handlers

```

### RewriteUrl

Leveraging fastify's `rewriteUrl` function, http request to `subsite.abc.com/...` is rewritten to `abc.com/subsite/...`


### Duosite enhancers

Duosite should allow developers to enhance fasity server:

- global enhancer: enhance the global fastify server
- site enhancer: enhance the local site server

### globalSettings

Sometimes server needs to pass down some sharedSettings to all subsites. Site settings can set globalSettings property.

### globalServices

Sometimes server needs to pass down global services such as database connection etc. to all subsites. Duosite booter will require this file `<root>/src/globalServices.js`, which should export default `buildGlobalServices` function with following signature:

```
const buildGlobalServices = (settings, root) => Object
```


#### Global enhancer

Booter will require this file `<root>/src/enhancer.js` to get the enhancer function, which should have following signature:

```
const enhancer = (fastify, duositeRoot, duositeSettings, globalServices) => void
```

Server booter will call enhancer with the global fastify object, siteRoot,  siteSettings and globalServices

### Local enhancer

Booter will require this file `<root>/sites/<subsite>/src/enhancer.js` to get the site enhancer function, which should have following signature:

```
const enhancer = (fastify, subsiteRoot, siteSettings, globalSettings, globalServices) => void
```

Subsite server booter will call enhancer with the global fastify object, subsiteRoot,  siteSettings, globalSettings and globalServices.

### Local view engine first, then global default view engine

Duosite provides global default view engines. Developers can bring their own view engines.

Each subsite can provide its own engines through this file:

```
<site-root>
 |- src
    |- engines.js
```

`engines.js` should expose a default function build with signature of
```
const build = (siteRoot, name, ext, options, lang, i18n)  => engineObject
```

engine object should has at least one async method: renderFile with signature of:

```
async renderFile(filepath)
```

`filepath` is relative path under site root.

## License

MIT

# 中文

# duosite
Duosite (duo: 多)， 多站，是一个可以支持独立多子站点的web服务器。每个子站点有自己的独立设置、目录、模板(template) / View引擎，同时也支持基于文件的路由（类似于nextjs）（该特性还在开发中）

Duosite基于[fastify](https://github.com/fastify/fastify) web服务器开发。

## 为什么开发Duosite，多站

理由很简单：我需要一个方便实验不同的html / css / js技术和框架的web服务器。

这个目标可以通过git不同配置的不同分支实现，但是这个方案的不便之处是不同配置服务共存，不能进行比较。

使用`yarn` workspace也可以实现这个目标，但是每个子站点需要配置一套服务器和端口，也很不方便。

比如说我想实验使用`ejs`的模板引擎和`marko`的模板引擎，我不想不停的切换git 分支，或者切换localhost端口。

这两个实验服务器应该可以和谐共存。我可以同时使用比如`site-ejs.localhost` 和 `site-marko.localhost` 。

这就是duosite多站的最初想法。

## 用法

### 安装

Yarn:

Yarn:

`yarn add duosite`

Npm:

`npm install duosite`

本项目使用yarn，所以后续文档也使用yarn作为说明。

### 列举模板

`yarn duosite ls`

### 使用模板创建新站点

`yarn duosite new <template-name> <new-site-name>`

新站点的名字是子域名，所以必须服务子域名的规则。

### 运行开发服务器

`yarn duosite dev`

### 访问子站点

打开浏览器，访问`<sub-site-name>.localhost:5000`.

多站duosite使用5000作为默认端口。可以修改`settings.js`设置不同端口。

#### 全局 （跨站点）设置

您可以在自己项目的根目录下创建自定义全局设置文件，配置项目。

1. settings.js

```
// 开发、生产环境共享设置
module.exports = {
  defaultSite: 'www', // 默认站点名称
  lang: 'en', // 语言locale
  port: 5000, // 服务端口
}
```

2. settings.development.js

```
//  开发环境设置
module.exports = {
// 任何设置
}
```

3. settings.production.js 暂时不使用


最终设置为`settings.js` 与 `settings.development.js`的深度合并, 后者覆盖前者。

目前 多站 duosite 只使用 `defaultSite`, `lang` 与 `port`.

未来会使用更多设置。

## 当前目标与最重要概念

本项目的当前目标是提供一个允许多子站点并存、方便的实验、学习与演示web技术的服务器环境。

当时机成熟时，duosite可能会瞄准生成部署。但这不是当前目标。

### 子站点

每个子站点之间独立。

多站 duosite 对子站点不做过多假设，只有三个简单的目录结构要求和一个保留文件后缀名。

- <site-root>/pages : 用于html / 模板文件等
- <site-root>/public/static: 用于不需要额外处理的静态文件
- <site-root>/public/bundle: 用于使用打包工具或编译工具生成静态文件
- <site-root>/pages/**/<filename>.boot.js:`.boot.js`文件扩展用作为模板预加载数据。 多站 duosite不会从`pages`目录发送该后缀的文件，但会从 `static` 与 `bundle` 目录发送该后缀的文件。


不过如果您愿意，也可以在 `pages` 目录放置任何静态文件。

如果您是 `fastify` 开发者，想进一步增强您的子站点, 您可以给子站点增加路由与请求处理器。后续将增加这一部分文档。

### 项目模板

多站 duosite 后续将逐步为典型的框架和库增加预设置的项目模板，为您节省时间。

目前包括:

`template-html` - 原生html开发

`template-tailwind` - tailwind

`template-alpine` - alpinejs

`template-liquid` - liquidjs模板引擎

您可以运行`yarn duosite ls` 显示项目模板列表。

您也可以运行 `yarn duosite new <项目模板名template-name> <目标站点名target-site-name>`， 使用模板创建新项目。

欢迎您提交pull请求，增加更多模板。

### HTML View引擎 / 模板引擎

多站的一个目标是方便实验不同的HTML view引擎 / 模板引擎。

当前只配置了对[harttle/liquidjs](https://github.com/harttle/liquidjs)引擎的基本支持。

后续将增加更多引擎。

### 统一的初始化view / template方法

当 多站 duosite 渲染一个html模板时，比如 `index.liquid`, 会首先在同一目录下寻找 `index.liquid.boot.js`文件。该文件应该export提供一个名为`getServerProps` 的异步函数，该函数有如下签名：

```
const getServerProps = async (ctx) => data
```

`ctx` 有如下属性，后续会进一步增加更多属性。

```
{
  request: // fastify request object
  reply: // fastify reply object
}
```

多站将会把 `{...data, _ctx: ctx}` 发送给模板引擎。


您可以尝试一下：

`yarn duosite new template-liquid liquid-1`

`yarn duosite dev`

访问 `liquid-1.localhost:5000`

浏览器将显示：

```
Hello from boot.js

Below is from template

Alice
Bob
Carol

```

第一行是 `index.liquid.boot.js`返回的数据:

```
const getServerProps = async ctx => {
  return {
    text: 'Hello from index.liquid.boot.js ',
  }
}

module.exports = {
  getServerProps,
}

```

## 为什么选择Fastify为基础开发多站 duosite

当然因为我们用过Fastify，而且也觉得Fastify不错，不过更主要是因为它的一些很不错的功能。

### rewriteUrl

 rewriteUrl 让多站duosite可以把其一个类似于 `my-site-in-ejs.localhost/index.ejs` 的请求重写为 `localhost/my-site-in-ejs/index.ejs`. 这个功能结合下面描述的支持前缀的plugin功能，让多站duosite可以就像没有子站点一样，方便的开发路由器与handler。

### 带前缀与独立子服务器的plugin

Fastify支持带有 `prefix`的plugin, 每个plugin的fastify是个独立的子服务器，和其他分开，非常时独立的处理每个子站点的请求。


## 设计与开发思想

这部分记录duosite开发中的重要的设计，想法，理念与选择决定。 由于多站 duosite正在早期阶段，本部分不追求完备性和良好的结构，而是及时反应开发中设计理念和决定。

### 多站Duosite 代码目录结构

```
<duosite代码根目录>
 |- server.js : 服务器代码
 |- settings.js : 跨环境共享设置
 |- settings.development.js: 开发环境设置
 |- settings.production.js` : 生产环境设置
 |- src : 服务器端代码目录
    |- utils.js : 服务器使用的一些功能库
    |- lang : i18n国际化辞典
        |- messages : 消息辞典
          |- zh-cn : 简体中文
          |- en : 英文
          |- ...
    |- engines : view / template模板引擎代码
 |- sites : 各站点根目录
    |- www : 默认站点
    |- site1 : 子站点
       |- settings.js : 跨环境共享设置
       |- settings.development.js: 开发环境设置
       |- settings.production.js` : 生产环境设置
       |- public : 公开静态文件. 使用链接 <sub-site.host>/[static|bundle]/...
          |- static : 类似图片、图标等不需要二次处理的静态内容
          |- bundle : 通过打包工具如webpack、编译器等从其他文件生成的静态文件
                       bundle可以被添加到 `.gitignore`中。
       |- pages :  静态html页面或有不同引擎渲染的模板
       |- src : 源代码 (html / template等.)
         |- lang : router/handler需要i18n字典
           |- zh-cn : 简体中文
           |- en : 英文
           |- ...
         |- views / templates / includes / components : 模板源代码
         |- ... 更多
```
