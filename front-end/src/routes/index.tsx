import { createFileRoute } from '@tanstack/react-router';
import { Banner } from '../components/banner';
import '../index.css';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className="flex justify-center">
      <Banner />
    </div>
  );
}
