import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/IALA-lights')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/IALA-lights"!</div>
}
