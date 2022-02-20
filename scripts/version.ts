import { execSync } from 'child_process'
import jsonfs from 'jsonfile'
import nodepath from 'path'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Confirm from 'prompt-confirm'
import semver from 'semver'

type ReleaseType = semver.ReleaseType | 'experimental'

run(...process.argv.slice(2))
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.log(err)
    process.exit(1)
  })

async function run(...args: string[]) {
  const givenVersion = args[0]
  const preRelease = args[1]

  ensureCleanWorkingDirectory()

  const currentVersion = getCurrentVersion()
  let nextVersion = semver.valid(givenVersion)

  if (nextVersion === null) {
    nextVersion = getNextVersion(
      currentVersion,
      givenVersion as ReleaseType,
      preRelease,
    )
  }

  const confirm = await confirmUpgrade(
    `Continue upgrading the versions from ${currentVersion} to ${nextVersion}? (Y/n)`,
  )

  if (!confirm) {
    process.exit(1)
  }

  updatePackageVersion(nextVersion)

  execSync(`git commit --all --message="🚀 Version ${nextVersion}"`)
  execSync(`git tag -a -m "🚀 Version ${nextVersion}" v${nextVersion}`)
}

function getNextVersion(
  currentVersion: string,
  givenVersion: ReleaseType,
  prereleaseId = 'pre',
) {
  if (givenVersion == null) {
    console.error('Missing next version. Usage: node version.js [nextVersion]')
    process.exit(1)
  }

  let nextVersion
  if (givenVersion === 'experimental') {
    const hash = execSync(`git rev-parse --short HEAD`).toString().trim()
    nextVersion = `0.0.0-experimental-${hash}`
  } else {
    nextVersion = semver.inc(currentVersion, givenVersion, prereleaseId)
  }

  if (nextVersion == null) {
    console.error(`Invalid version specifier: ${givenVersion}`)
    process.exit(1)
  }

  return nextVersion
}

async function confirmUpgrade(message: string) {
  const confirm = new Confirm(message)
  return confirm.run()
}

async function updatePackageVersion(version: string) {
  const pkg = getPackage()
  pkg.version = version
  writePackage(pkg)
}

function packagePath() {
  return nodepath.resolve(process.cwd(), 'src', 'package.json')
}

function getPackage() {
  return jsonfs.readFileSync(packagePath())
}

function writePackage(json: string) {
  jsonfs.writeFileSync(packagePath(), json, { spaces: 2 })
}

function getCurrentVersion() {
  const pkg = getPackage()

  return pkg.version
}

function ensureCleanWorkingDirectory() {
  const status = execSync(`git status --porcelain`).toString().trim()
  const lines = status.split('\n')
  if (!lines.every(line => line === '' || line.startsWith('?'))) {
    console.error(
      'Working directory is not clean. Please commit or stash your changes.',
    )
    process.exit(1)
  }
}
