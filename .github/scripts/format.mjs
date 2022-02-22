//Imports
import { getBuffer as dockerfile } from "@dprint/dockerfile"
import { createFromBuffer } from "@dprint/formatter"
import { getBuffer as json } from "@dprint/json"
import { getBuffer as markdown } from "@dprint/markdown"
import { getBuffer as javascript } from "@dprint/typescript"
import fs from "fs/promises"
import glob from "glob"

//Formatters
const formatters = {json: createFromBuffer(json()), javascript: {source: createFromBuffer(javascript()), tests: createFromBuffer(javascript())}, markdown: createFromBuffer(markdown()), dockerfile: createFromBuffer(dockerfile())}

//Configuration
const config = {indentWidth: 2, lineWidth: 120}
for (const [type, options] of [["source", {lineWidth: 280}], ["tests", {lineWidth: 80}]]) {
  formatters.javascript[type].setConfig(config, {
    semiColons: "asi",
    quoteStyle: "preferDouble",
    quoteProps: "asNeeded",
    useBraces: "preferNone",
    singleBodyPosition: "nextLine",
    preferSingleLine: true,
    "commentLine.forceSpaceAfterSlashes": false,
    "arrowFunction.useParentheses": false,
    "typeLiteral.separatorKind": "comma",
    spaceSurroundingProperties: false,
    ...options,
  })
}
formatters.json.setConfig(config, {})
formatters.markdown.setConfig(config, {emphasisKind: "asterisks", strongKind: "asterisks"})
formatters.dockerfile.setConfig(config, {})

//Format
const ignore = `${await fs.readFile(".gitignore")}`.split("\n").filter(line => (!line.startsWith("#")) && (line.trim().length)).map(line => line.trim().replace(/\/$/, "/**"))
ignore.push("**/settings.example.json")
for (
  const [pattern, formatter] of [["Dockerfile", formatters.dockerfile], ["**/*.md", formatters.markdown], ["**/*.json", formatters.json], ["source/**/*.{js,mjs}", formatters.javascript.source], [".github/scripts/**/*.{js,mjs}", formatters.javascript.source], [
    "tests/**/*.js",
    formatters.javascript.source,
  ], ["tests/**/*.mjs", formatters.javascript.tests]]
) {
  glob(`${pattern}`, {nodir: true, ignore}, async (error, paths) => {
    if (error)
      throw error
    for (const path of paths) {
      try {
        const content = `${await fs.readFile(path)}`
        const formatted = formatter.formatText(path, content)
        if (content !== formatted) {
          console.log(path)
          await fs.writeFile(path, formatted)
        }
      } catch {
        console.log(`ignored: ${path}`)
      }
    }
  })
}
