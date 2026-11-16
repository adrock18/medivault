import {
  checkFrontendBuild,
  ENTRY_BYTE_LIMIT,
} from '../server/frontend-build.ts'

try {
  const { entries, files } = checkFrontendBuild('dist', {
    entryByteLimit: ENTRY_BYTE_LIMIT,
  })
  for (const entry of entries)
    console.log(
      `${entry.file}: ${entry.size} bytes (limit ${ENTRY_BYTE_LIMIT}, passed)`,
    )
  console.log(`Build artifacts passed: ${files} files checked.`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
