# File based routing rules

```
<segments>/[id].[ext] ->/<segments>/[:id]
<segments>/[a]/[b]/[..]/[m].[ext] -> /<segments>/:a/:b/.../:m
<segments>/[...abc].[ext] -> /<segments>/*
<segments>/[[...abc]].[ext] -> /<segments> && /<segments>/*

```

# Build handlers

## function

```
const buildHandler(filepath) => route with filepath closedOver
```

## route builder

```
const buildRoutes = (siteRoot, ext, buildHandler)  => [[routeUrl, handler],[...],...]
```