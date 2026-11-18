/**
 * Document acceptance rules shared by browser and API. Check size, extension,
 * MIME type and file signatures before private upload.
 */

export const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Reject unsupported, empty, oversized or signature-mismatched documents; callers
 * surface the validation error.
 */
export async function validateDocument(file: File) {
  if (file.size === 0 || file.size > MAX_FILE_SIZE)
    throw new Error('Choose a non-empty file no larger than 10 MB.')
  const allowed: Record<string, string[]> = {
    'application/pdf': ['pdf'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
  }
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!allowed[file.type]?.includes(extension))
    throw new Error('Only PDF, JPG, and PNG documents are supported.')
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  const valid =
    file.type === 'application/pdf'
      ? [0x25, 0x50, 0x44, 0x46, 0x2d].every((b, i) => bytes[i] === b)
      : file.type === 'image/png'
        ? [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
            (b, i) => bytes[i] === b,
          )
        : bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (!valid)
    throw new Error(
      'The file contents do not match its type. Choose a valid PDF or image.',
    )
}
