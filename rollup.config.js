import { babel } from "@rollup/plugin-babel";
import nodeResolve from "@rollup/plugin-node-resolve";
import copy from "rollup-plugin-copy";

/** @returns {import("rollup").RollupOptions[]} */
export default function build() {
  return [
    {
      external: [/node_modules/],
      input: ["./create-remix-blog/cli.ts"],
      output: {
        dir: "build",
        format: "cjs",
        banner: "#!/usr/bin/env node\n",
      },
      plugins: [
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          extensions: [".ts"],
        }),
        nodeResolve({ extensions: [".ts"] }),
        copy({
          targets: [{ src: "./create-remix-blog/package.json", dest: "build" }],
        }),
      ],
    },
  ];
}
