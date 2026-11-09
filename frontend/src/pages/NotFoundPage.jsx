import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-6xl font-bold text-neutral-200">404</h1>
      <p className="text-xl text-neutral-600 mt-4">Page not found</p>
      <p className="text-neutral-400 mt-2">The page you're looking for doesn't exist or has been moved.</p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
