import { createFileRoute } from '@tanstack/react-router';
import { Fairness } from '../components/fairness/fairness';

export const Route = createFileRoute('/fairness')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Fairness />;
}
