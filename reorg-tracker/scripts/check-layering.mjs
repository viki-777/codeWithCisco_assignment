// Fails if anything under src/ imports from tests/. Keeps tests/expected.ts
// (and the seeded generator) out of the shipped app, per CLAUDE.md architecture rule.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC_DIR = join(import.meta.dirname, '..', 'src')
const BAD_IMPORT = /from\s+['"].*\/tests\//

function walk(dir) {
  const violations = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stats = statSync(full)
    if (stats.isDirectory()) {
      violations.push(...walk(full))
    } else if (/\.(ts|tsx)$/.test(entry)) {
      const content = readFileSync(full, 'utf8')
      if (BAD_IMPORT.test(content)) {
        violations.push(full)
      }
    }
  }
  return violations
}

const violations = walk(SRC_DIR)
if (violations.length > 0) {
  console.error('src/ must never import from tests/. Violations:')
  for (const file of violations) console.error(`  ${file}`)
  process.exit(1)
}
console.log('check:layering OK — nothing in src/ imports from tests/')
