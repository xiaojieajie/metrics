//Imports
import { createFromBuffer } from "@dprint/formatter"
import { getBuffer as json } from "@dprint/json"
import { getBuffer as javascript } from "@dprint/typescript"
import { getBuffer as markdown } from "@dprint/markdown"
import { getBuffer as dockerfile } from "@dprint/dockerfile"
import fs from "fs/promises"
import glob from "glob"

//Formatters
const formatters = {
  json:createFromBuffer(json()),
  javascript:createFromBuffer(javascript()),
  markdown:createFromBuffer(markdown()),
  dockerfile:createFromBuffer(dockerfile())
}

//Configuration
const config = {
  indentWidth: 2,
  lineWidth: 280,
}
formatters.javascript.setConfig(config, {
  semiColons: "asi",
	quoteStyle: "preferDouble",
	quoteProps: "asNeeded",
	useBraces: "preferNone",
	singleBodyPosition: "nextLine",
	preferSingleLine: true,
	"arrowFunction.useParentheses": false,
	"typeLiteral.separatorKind": "comma",
	spaceSurroundingProperties: false,
})
formatters.json.setConfig(config, {})
formatters.markdown.setConfig(config, {emphasisKind: "asterisks", strongKind: "asterisks"})
formatters.dockerfile.setConfig(config, {})

//Format
const ignore = `${await fs.readFile(".gitignore")}`.split("\n").filter(line => (!line.startsWith("#"))&&(line.trim().length)).map(line => line.trim().replace(/\/$/, "/**"))
for (const [pattern, formatter] of [
  ["Dockerfile", formatters.dockerfile],
  ["**/*.md", formatters.markdown],
  ["**/*.json", formatters.json],
  ["**/*.{js,mjs}", formatters.javascript],
])
glob(`${pattern}`, {nodir:true, ignore}, async (error, paths) => {
  if (error)
    throw error
  for (const path of paths) {
    const content = `${await fs.readFile(path)}`
    const formatted = formatter.formatText(path, content)
    if (content !== formatted) {
      console.log(path)
      await fs.writeFile(path, formatted)
    }
  }
})