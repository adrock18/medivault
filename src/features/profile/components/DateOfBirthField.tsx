/**
 * Profile date-of-birth adapter for the shared typed calendar-date control.
 * Retains birthday autocomplete and the existing profile form contract.
 */

import type { ComponentProps } from 'react'
import { DateField } from '@/components/DateField'

/** Present the shared date fields with birthday-specific labeling. */
export function DateOfBirthField(
  props: Omit<ComponentProps<typeof DateField>, 'label' | 'birthday'>,
) {
  return <DateField {...props} label="Date of birth" birthday />
}
