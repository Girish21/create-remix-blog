#! /usr/bin/env node

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

async function run() {
  console.log("💿 Remix Blog");
}
