import { createFileRoute } from '@tanstack/react-router';
import { HomePage } from '../features/home-v2'

export const Route = createFileRoute('/HomePage-v2')({
  component: HomePage,
})
