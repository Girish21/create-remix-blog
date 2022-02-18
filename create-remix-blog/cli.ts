import * as inquirer from "inquirer";
import { buildApp } from ".";

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

  const { name } = await inquirer.prompt<{ name: string }>([
    { message: "Hello", name: "name" },
  ]);

  console.log(name);

  buildApp();
}
