import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FocusEvent, SubmitEvent } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'
import {
  email,
  hasErrors,
  maxLength,
  oneOf,
  required,
  validate,
  validateField,
} from '../../lib/validation'
import type { FieldErrors, Rules } from '../../lib/validation'

const cutCorner =
  '[clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,0_100%)]'

const field =
  'w-full rounded-xl border bg-[#121a26] px-4 py-2.5 text-sm text-[#E3E3E3] placeholder:text-[#526077] focus:outline-none focus:ring-1 transition'
const fieldValid =
  'border-[#2A3548] focus:border-[#1D90F4] focus:ring-[#1D90F4]'
const fieldInvalid = 'border-red-400 focus:border-red-400 focus:ring-red-400'

const labelClass = 'block text-xs tracking-wider text-[#9fb0c7] mb-1.5'
const errorClass = 'mt-1.5 text-xs text-red-300'

const topics = [
  'Palautetta simulaattorista',
  'Koulutus- ja kurssisisällöt',
  'Väylä- ja loistotietojen korjaus',
  'Muu yhteydenotto',
]

type ContactValues = {
  firstName: string
  lastName: string
  email: string
  topic: string
  message: string
}

type FieldName = keyof ContactValues

const emptyValues: ContactValues = {
  firstName: '',
  lastName: '',
  email: '',
  topic: topics[0],
  message: '',
}

const rules: Rules<ContactValues> = {
  firstName: [required('Kirjoita etunimesi.'), maxLength(100)],
  lastName: [required('Kirjoita sukunimesi.'), maxLength(100)],
  email: [required('Kirjoita sähköpostiosoitteesi.'), maxLength(254), email()],
  topic: [oneOf(topics)],
  message: [
    required('Kirjoita viesti.'),
    maxLength(2000, 'Viesti on liian pitkä, enintään 2000 merkkiä.'),
  ],
}

// Order of the fields on the page, for focusing the first invalid one.
const fieldOrder: Array<FieldName> = [
  'firstName',
  'lastName',
  'email',
  'topic',
  'message',
]

const SUCCESS_VISIBLE_MS = 5000

export default function ContactForm() {
  const [values, setValues] = useState<ContactValues>(emptyValues)
  const [errors, setErrors] = useState<FieldErrors<ContactValues>>({})
  const [sent, setSent] = useState(false)
  const [submitFailed, setSubmitFailed] = useState(false)
  const fieldRefs = useRef<Partial<Record<FieldName, HTMLElement | null>>>({})

  useEffect(() => {
    if (!sent) return
    const timeout = setTimeout(() => setSent(false), SUCCESS_VISIBLE_MS)
    return () => clearTimeout(timeout)
  }, [sent])

  function setFieldError(name: FieldName, value: string) {
    const error = validateField(value, rules[name])
    setErrors((previous) => {
      const next = { ...previous }
      if (error === null) delete next[name]
      else next[name] = error
      return next
    })
  }

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const name = event.currentTarget.name as FieldName
    const value = event.currentTarget.value
    setValues((previous) => ({ ...previous, [name]: value }))

    // After a failed submit, or once a field shows an error, check it on
    // every change so the error follows what the user types.
    if (submitFailed || errors[name]) setFieldError(name, value)
  }

  function handleBlur(
    event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const name = event.currentTarget.name as FieldName
    const value = event.currentTarget.value

    // Tabbing past an empty field is not an error yet; submitting is.
    if (submitFailed || value.trim() !== '' || errors[name]) {
      setFieldError(name, value)
    }
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validate(values, rules)
    setErrors(nextErrors)

    if (hasErrors(nextErrors)) {
      const firstInvalid = fieldOrder.find((name) => nextErrors[name])
      if (firstInvalid) fieldRefs.current[firstInvalid]?.focus()
      setSubmitFailed(true)
      setSent(false)
      return
    }

    // There is no backend endpoint for messages yet, so sending is simulated.
    setValues(emptyValues)
    setSubmitFailed(false)
    setSent(true)
  }

  // Props shared by every field: value, handlers and the error wiring.
  function fieldProps(name: FieldName) {
    const error = errors[name]
    return {
      id: `contact-${name}`,
      name,
      value: values[name],
      onChange: handleChange,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? `contact-${name}-error` : undefined,
      ref: (element: HTMLElement | null) => {
        fieldRefs.current[name] = element
      },
    }
  }

  function fieldClass(name: FieldName) {
    return `${field} ${errors[name] ? fieldInvalid : fieldValid}`
  }

  function fieldError(name: FieldName) {
    const error = errors[name]
    return error ? (
      <p id={`contact-${name}-error`} className={errorClass}>
        {error}
      </p>
    ) : null
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact-firstName" className={labelClass}>
              Etunimi
            </label>
            <input
              {...fieldProps('firstName')}
              type="text"
              required
              placeholder="Etunimi"
              className={fieldClass('firstName')}
              autoComplete="given-name"
              onBlur={handleBlur}
            />
            {fieldError('firstName')}
          </div>
          <div>
            <label htmlFor="contact-lastName" className={labelClass}>
              Sukunimi
            </label>
            <input
              {...fieldProps('lastName')}
              type="text"
              required
              placeholder="Sukunimi"
              className={fieldClass('lastName')}
              autoComplete="family-name"
              onBlur={handleBlur}
            />
            {fieldError('lastName')}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact-email" className={labelClass}>
              Sähköpostiosoite
            </label>
            <input
              {...fieldProps('email')}
              type="email"
              required
              placeholder="email@address.com"
              className={fieldClass('email')}
              autoComplete="email"
              onBlur={handleBlur}
            />
            {fieldError('email')}
          </div>
          <div>
            <label htmlFor="contact-topic" className={labelClass}>
              Aihe
            </label>
            <div className="relative">
              <select
                {...fieldProps('topic')}
                className={`${fieldClass('topic')} appearance-none pr-10 cursor-pointer`}
              >
                {topics.map((topic) => (
                  <option key={topic}>{topic}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#718096]">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            {fieldError('topic')}
          </div>
        </div>
        <div>
          <label htmlFor="contact-message" className={labelClass}>
            Viesti
          </label>
          <textarea
            {...fieldProps('message')}
            rows={4}
            required
            placeholder="Kirjoita viestisi tai havaintosi tähän..."
            className={`${fieldClass('message')} block resize-none`}
            onBlur={handleBlur}
          />
          {fieldError('message')}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row justify-end">
          <button
            type="submit"
            className={`${cutCorner} w-full sm:w-auto bg-[#1D90F4] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-[#1D90F4]/20 transition hover:bg-[#3BA0F6] active:scale-95 cursor-pointer`}
          >
            Lähetä viesti <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      </form>

      {/* Always rendered, so screen readers announce the message when it appears. */}
      <output className="block">
        {sent && (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/20 p-3 text-center font-mono text-xs text-emerald-300">
            Viesti lähetetty onnistuneesti! Vastaus toimitetaan sähköpostiisi.
          </div>
        )}
      </output>
    </>
  )
}
