const fs = require('fs')
const path = require('path')

// Efter standalone build: kopier static og public ind i build/standalone,
// så mappen er klar til upload og kørsel med node server.js
const buildDir = path.join(__dirname, '..', 'build')
const standaloneDir = path.join(buildDir, 'standalone')

if (!fs.existsSync(standaloneDir)) {
  console.error('Standalone mappe ikke fundet. Kør npm run build først.')
  process.exit(1)
}

// Kopier build/static til standalone/build/static (distDir er 'build')
const staticSrc = path.join(buildDir, 'static')
const staticDest = path.join(standaloneDir, 'build', 'static')
if (fs.existsSync(staticSrc)) {
  fs.mkdirSync(path.dirname(staticDest), { recursive: true })
  fs.cpSync(staticSrc, staticDest, { recursive: true })
  console.log('Kopieret build/static -> standalone/build/static')
}

// Kopier public til standalone/public
const publicSrc = path.join(__dirname, '..', 'public')
const publicDest = path.join(standaloneDir, 'public')
if (fs.existsSync(publicSrc)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true })
  console.log('Kopieret public -> standalone/public')
}

console.log('Build klar. Upload mappen "build/standalone" og kør: node server.js')
