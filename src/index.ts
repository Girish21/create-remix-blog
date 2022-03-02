import fs from 'fs-extra'
import path from 'path'
import jsonfs from 'jsonfile'
import childprocess from 'child_process'
import sortPackage from 'sort-package-json'

export type Servers = 'fly'

export type Language = 'ts' | 'js'

export type DB = 'sqlite'

export async function createApp(
  projectDir: string,
  server: Servers,
  language: Language,
  db: DB,
) {
  const versions = process.versions

  if (!versions.node) {
    throw new Error(
      'Remix requires Node.js, please setup Node in your environment before continuing with the rest of the setup',
    )
  }

  // check Node version
  if (versions.node && parseInt(versions.node) < 14) {
    throw new Error(
      `Remix requires a Node.js version of 14 or greater, but an older version of Node.js was detected ${versions.node}. Please update to Node.js version 14 or greater before continuing`,
    )
  }

  const relativePath = path.relative(process.cwd(), projectDir)
  const isCurrentDirectory = relativePath === ''

  // create directory if not exist
  if (!isCurrentDirectory) {
    if (fs.existsSync(projectDir)) {
      console.log(
        `\n'${relativePath}' already exist. Please try again with another directory\n`,
      )
      process.exit(1)
    } else {
      fs.mkdirSync(relativePath)
    }
  }

  // copy from templates to project directory
  const commonTemplate = path.resolve(
    __dirname,
    'templates',
    `common-${language}`,
  )
  fs.copySync(commonTemplate, projectDir, { overwrite: true })

  const serverTemplate = path.resolve(__dirname, 'templates', server)
  if (fs.existsSync(serverTemplate)) {
    fs.copySync(serverTemplate, projectDir, {
      overwrite: true,
    })
  }

  const dbTemplate = path.resolve(
    __dirname,
    'templates',
    `${server}-${db}-${language}`,
  )
  if (fs.existsSync(dbTemplate)) {
    fs.copySync(dbTemplate, projectDir, {
      overwrite: true,
    })
  }

  // transform all dot files (they were removed to play nicely with linters)
  const dotFiles = [
    'github',
    'env.example',
    'eslintignore',
    'eslintrc.js',
    'gitignore',
    'prettierignore',
    'prettierrc',
    'dockerignore',
  ]
  for (const file of dotFiles) {
    const filePath = path.join(projectDir, file)
    if (fs.existsSync(filePath)) {
      fs.renameSync(
        path.join(projectDir, file),
        path.join(projectDir, `.${file}`),
      )
    }
  }

  // merge packages from templates
  const appPkg = jsonfs.readFileSync(path.join(commonTemplate, 'package.json'))
  for (const template of [serverTemplate, dbTemplate]) {
    if (fs.existsSync(template)) {
      const templatePkg = jsonfs.readFileSync(
        path.join(template, 'package.json'),
      )
      for (const section of ['dependencies', 'devDependencies', 'scripts']) {
        Object.assign(appPkg[section], templatePkg[section])
      }
    }
  }

  // write back project package
  jsonfs.writeFileSync(
    path.join(projectDir, 'package.json'),
    sortPackage(appPkg),
    {
      spaces: 2,
    },
  )

  // setup prject if any specific setup is required
  const projectScriptsDir = path.resolve(projectDir, 'scripts')
  const projectScripts = path.resolve(projectDir, 'scripts', 'init.js')

  if (fs.existsSync(projectScriptsDir)) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const initProject = require(projectScripts)
    await initProject(projectDir)
    fs.removeSync(projectScriptsDir)
  }

  // run npm install
  childprocess.execSync('npm install', { cwd: projectDir, stdio: 'inherit' })
}
