import { parse } from 'csv-parse/sync'
import type { BulkHandle } from '../db/schema/bulk-scans'

export interface ParsedCSV {
  handles: BulkHandle[]
  errors: string[]
  totalRows: number
}

// Valid Instagram handle pattern
const INSTAGRAM_PATTERN = /^@?[a-zA-Z0-9._]{1,30}$/

// Valid YouTube handle pattern (more permissive)
const YOUTUBE_PATTERN = /^@?[a-zA-Z0-9._-]{1,100}$/

export class CSVParserService {

  parse(csvContent: string, maxHandles: number): ParsedCSV {
    const errors: string[] = []
    const handles: BulkHandle[] = []
    let totalRows = 0

    try {
      const records: any[] = parse(csvContent, {
        columns: true,          // First row is header
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      })

      totalRows = records.length

      if (totalRows === 0) {
        errors.push('CSV file is empty')
        return { handles, errors, totalRows }
      }

      // Validate headers
      const firstRecord = records[0]
      const hasHandle = 'handle' in firstRecord
      const hasPlatform = 'platform' in firstRecord

      if (!hasHandle) {
        errors.push(
          'CSV must have a "handle" column. ' +
          'Expected format: handle,platform'
        )
        return { handles, errors, totalRows }
      }

      // Process each row
      for (let i = 0; i < records.length; i++) {
        const rowNum = i + 2  // +2 because row 1 is header
        const record = records[i]

        // Skip empty rows
        if (!record.handle || record.handle.trim() === '') continue

        const rawHandle = record.handle.trim()
        const rawPlatform = (record.platform ?? 'instagram')
          .trim()
          .toLowerCase()

        // Validate platform
        if (!['instagram', 'youtube'].includes(rawPlatform)) {
          errors.push(
            `Row ${rowNum}: Invalid platform "${rawPlatform}". ` +
            `Must be "instagram" or "youtube"`
          )
          continue
        }

        const platform = rawPlatform as 'instagram' | 'youtube'

        // Validate handle format
        const cleanHandle = rawHandle.replace(/^@/, '')
        const pattern = platform === 'youtube'
          ? YOUTUBE_PATTERN
          : INSTAGRAM_PATTERN

        if (!pattern.test(cleanHandle)) {
          errors.push(
            `Row ${rowNum}: Invalid ${platform} handle "${rawHandle}"`
          )
          continue
        }

        // Check for duplicates
        const isDuplicate = handles.some(
          h => h.handle === cleanHandle && h.platform === platform
        )

        if (isDuplicate) {
          errors.push(
            `Row ${rowNum}: Duplicate handle "${cleanHandle}" skipped`
          )
          continue
        }

        handles.push({
          handle: cleanHandle,
          platform,
          status: 'pending',
        })

        // Check limit
        if (handles.length >= maxHandles) {
          errors.push(
            `Only the first ${maxHandles} valid handles will be ` +
            `processed. Upgrade your plan for larger bulk scans.`
          )
          break
        }
      }

    } catch (err: any) {
      errors.push(`Failed to parse CSV: ${err.message}`)
    }

    return { handles, errors, totalRows }
  }

  // Generate a template CSV for download
  generateTemplate(): string {
    return [
      'handle,platform',
      'cristiano,instagram',
      'natgeo,instagram',
      'mkbhd,youtube',
      'pewdiepie,youtube',
    ].join('\n')
  }
}

export const csvParserService = new CSVParserService()
