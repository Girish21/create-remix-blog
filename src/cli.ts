import * as inquirer from 'inquirer'
import nodepath from 'path'
import meow from 'meow'

import type { DB, Language, Servers } from '.'
import { createApp } from '.'

const Banner = `
  Usage:
    $ npx create-remix-blog [flags...] [<dir>]

  if <dir> is not provided upfront you will be promted later

  Flags:
    --help, -h        Show this help message
    --version, -v     Show the version of this script
`

run()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

async function run() {
  const { input } = meow(Banner, {
    flags: {
      help: { default: false, type: 'boolean', alias: 'h' },
      version: { default: false, type: 'boolean', alias: 'v' },
    },
  })

  console.log('\n💿 Remix Blog\n')

  const projectDir = nodepath.resolve(
    process.cwd(),
    input.length > 0
      ? input[0]
      : (
          await inquirer.prompt<{ name: string }>({
            message: 'Where would you like to create your Remix Blog?',
            default: './my-personal-blog',
            type: 'input',
            name: 'name',
          })
        ).name
  )

  const answers = await inquirer.prompt<{
    server: Servers
    cacheType: DB
    lang: Language
  }>([
    {
      message: 'Where do you want to deploy your blog?',
      type: 'list',
      choices: [{ name: 'Fly.io (https://fly.io/)', value: 'fly' }],
      name: 'server',
    },
    {
      message:
        "How would you want to persist your MDX? Choose SQLite if you're unsure",
      when(answers) {
        return answers.server === 'fly'
      },
      type: 'list',
      choices: [
        { name: 'SQLite', value: 'sqlite' },
        // { name: 'Postgres (Fly.io)', value: 'fly-pg' },
        // { name: 'Redis (Fly.io)', value: 'redis' },
        // { name: 'Postgres', value: 'pg' },
        { name: 'None', value: 'none' },
      ],
      name: 'cacheType',
    },
    {
      message: 'TypeScript or JavaScript',
      type: 'list',
      choices: [
        { name: 'TypeScript', value: 'ts' },
        { name: 'JavaScript', value: 'js' },
      ],
      name: 'lang',
    },
  ])

  createApp(projectDir, answers.server, answers.lang, answers.cacheType)
}
