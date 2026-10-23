/**
 * Small form validation helpers.
 *
 * A rule looks at one field's value and returns an error message, or null
 * when the value is fine. Rules other than required() pass an empty value,
 * so an optional field can still be limited: [maxLength(100)].
 */
export type Rule = (value: string) => string | null

export type Rules<TValues> = Partial<Record<keyof TValues, Array<Rule>>>

export type FieldErrors<TValues> = Partial<Record<keyof TValues, string>>

/** Fails on an empty value, including one that is only whitespace. */
export const required =
  (message = 'Tämä kenttä on pakollinen.'): Rule =>
  (value) =>
    value.trim() === '' ? message : null

/** Counts the value without surrounding whitespace, as it will be sent. */
export const maxLength =
  (max: number, message = `Enintään ${max} merkkiä.`): Rule =>
  (value) =>
    value.trim().length > max ? message : null

export const email =
  (message = 'Anna sähköpostiosoite muodossa nimi@esimerkki.fi.'): Rule =>
  (value) =>
    value.trim() === '' || isEmail(value.trim()) ? null : message

export const oneOf =
  (
    allowed: ReadonlyArray<string>,
    message = 'Valitse jokin vaihtoehdoista.',
  ): Rule =>
  (value) =>
    allowed.includes(value) ? null : message

/** The first error of the field's rules, or null when all of them pass. */
export function validateField(
  value: string,
  rules: ReadonlyArray<Rule> = [],
): string | null {
  for (const rule of rules) {
    const error = rule(value)
    if (error !== null) return error
  }
  return null
}

/** Errors of every field that fails; an empty object means the form is valid. */
export function validate<TValues extends Record<string, string>>(
  values: TValues,
  rules: Rules<TValues>,
): FieldErrors<TValues> {
  const errors: FieldErrors<TValues> = {}

  for (const name of Object.keys(rules) as Array<keyof TValues>) {
    const error = validateField(values[name], rules[name])
    if (error !== null) errors[name] = error
  }

  return errors
}

export function hasErrors<TValues>(errors: FieldErrors<TValues>): boolean {
  return Object.values(errors).some(Boolean)
}

// Same idea as the browser's own type="email" check: one @, something before
// it, and a dotted domain after it, with no spaces anywhere.
function isEmail(value: string): boolean {
  const at = value.indexOf('@')
  if (at < 1 || at !== value.lastIndexOf('@') || /\s/.test(value)) {
    return false
  }

  const domain = value.slice(at + 1)
  const labels = domain.split('.')
  return labels.length >= 2 && labels.every((label) => label !== '')
}
