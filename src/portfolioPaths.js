const deskPath = /\/bikas-desk(?:\/index\.html|\/)?$/

export function isDeskRoute() {
  return deskPath.test(location.pathname)
}

export const portfolioRoot = isDeskRoute()
  ? new URL(location.pathname.replace(deskPath, '/'), location.origin)
  : new URL('./', location.href)

export function portfolioAsset(path) {
  return new URL(path, portfolioRoot).href
}

export const deskUrl = portfolioAsset('bikas-desk/')
