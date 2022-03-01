const path = require('path')
const fs = require('fs-extra')
const toml = require('@iarna/toml')
const crypto = require('crypto')

function escapeRegExp(string) {
  // $& means the whole matched string
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function main(projectDir) {
  const readmePath = path.join(projectDir, 'README.md')
  const envExamplePath = path.join(projectDir, '.env.example')
  const envPath = path.join(projectDir, '.env')
  const flyConfigPath = path.join(projectDir, 'fly.toml')

  const projectName = path.basename(path.resolve(projectDir))
  const randomHash = crypto.randomBytes(2).toString('hex')
  const appName = `${projectName}-${randomHash}`
  const replacer = 'YOUR_APP_NAME'

  const [readme, envExample, flyConfig] = await Promise.all([
    fs.readFile(readmePath, 'utf-8'),
    fs.readFile(envExamplePath, 'utf-8'),
    fs.readFile(flyConfigPath, 'utf-8'),
  ])

  const flyConfigToml = toml.parse(flyConfig)
  flyConfigToml.app = appName
  const newreadme = readme.replace(
    new RegExp(escapeRegExp(replacer), 'g'),
    appName,
  )

  await Promise.all([
    fs.writeFile(readmePath, newreadme),
    fs.writeFile(envPath, envExample),
    fs.writeFile(flyConfigPath, toml.stringify(flyConfigToml)),
    fs.remove(envExamplePath),
  ])
}

module.exports = main
