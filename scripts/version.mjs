// Current version: the latest release tag (releases do not commit back to main), else package.json.
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

export function currentVersion() {
  try {
    return execSync('git describe --tags --abbrev=0 --match "v*"', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim().replace(/^v/, '')
  } catch {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../package.json'), 'utf8'))
    return pkg.version === '0.0.0-development' ? null : pkg.version
  }
}
