import { createFileRoute } from '@tanstack/react-router'
import { ContactMessagesPage } from '../features/contact-messages'

export const Route = createFileRoute('/messages')({
  component: ContactMessagesPage,
  head: () => ({
    meta: [{ title: 'Yhteydenotot – Majakka' }],
  }),
})
