import Toast from './Toast'
import { useToast } from './toastStore'

/** The site-wide toast, see showToast. Rendered once, in the root layout. */
export default function GlobalToast() {
  const { show, message } = useToast()
  return <Toast show={show} message={message} />
}
