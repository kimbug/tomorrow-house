const path = require('path')
const fs = require('fs')
const { copySync } = require('fs-extra')

const postcss = require('postcss')
const cssnano = require('cssnano')
const autoprefixer = require('autoprefixer')
const imageminJpegtran = require('imagemin-jpegtran')

const REPOSITORY_NAME = 'tomorrow-house'
const buildDir = path.resolve(__dirname, '../build')

const faviconFileList = [
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'apple-touch-icon.png',
  'browserconfig.xml',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon.ico',
  'mstile-150x150.png',
  'safari-pinned-tab.svg',
  'site.webmanifest',
]

const faviconUrlList = [
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/site.webmanifest',
  '/safari-pinned-tab.svg',
]

function throwError(err) {
  if (err) {
    console.log('💥 Oops! Something went wrong')
  }
}

function buildHtml() {
  path.resolve(__dirname, '../index.html'), path.resolve(buildDir, 'index.html')

  // Resolve pathname
  fs.readFile(path.resolve(__dirname, '../index.html'), (err, data) => {
    if (err) throwError(err)

    let html = data.toString()
    faviconUrlList.forEach((favicon) => {
      if (!!REPOSITORY_NAME) {
        const newFaviconUrl = favicon.replace('/', `/${REPOSITORY_NAME}/`)
        html = html.replace(favicon, newFaviconUrl)
      }
    })

    fs.writeFile(path.resolve(buildDir, 'index.html'), html, (err) => {
      throwError(err)
    })
  })
}

function buildCss() {
  const cssPath = path.resolve(__dirname, '../style.css')

  fs.readFile(cssPath, (err, css) => {
    if (err) {
      throwError(err)
      return
    }

    postcss([autoprefixer, cssnano])
      .process(css, { from: cssPath })
      .then((result) => {
        fs.writeFile(
          path.resolve(buildDir, 'style.css'),
          result.css,
          throwError
        )
      })
  })
}

function copyFavicons() {
  faviconFileList.forEach((filename) => {
    copySync(
      path.resolve(__dirname, `../${filename}`),
      path.resolve(buildDir, filename)
    )
  })
}

async function optimizeImageAssets() {
  const imagemin = (await import('imagemin')).default
  try {
    await imagemin(
      [path.resolve(__dirname, '../assets/images/*.{jpg,png,svg}')],
      {
        destination: path.resolve(buildDir, 'assets/images'),
        plugins: [imageminJpegtran()],
      }
    )
  } catch (err) {
    throwError(err)
  }
}

async function build() {
  console.log('------------------------')
  console.log('Start building...')

  // Create `build` directory
  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir)

  // Build index.html & style.css
  buildHtml()
  buildCss()

  // Copy js/*.js, assets/fonts/*, favicon files
  copySync(
    path.resolve(__dirname, '../index.html'),
    path.resolve(buildDir, 'index.html')
  )
  copySync(path.resolve(__dirname, '../js'), path.resolve(buildDir, 'js'))
  copySync(
    path.resolve(__dirname, '../assets/fonts'),
    path.resolve(buildDir, 'assets/fonts')
  )
  copyFavicons()

  await optimizeImageAssets()

  console.log('🎉 Successfully build your project')
  console.log('🔜 Ready to deploy')
}

build()
