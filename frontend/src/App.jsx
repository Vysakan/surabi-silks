import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './router';

const MIN_DISPLAY_MS = 800;
const FADE_MS = 300;
const SAFETY_TIMEOUT_MS = 8000;
const loaderStart = Date.now();
let dismissed = false;

function dismissLoader() {
  if (dismissed) return;
  dismissed = true;
  const loader = document.getElementById('initial-loader');
  if (!loader) {
    document.body.style.overflow = '';
    return;
  }
  loader.classList.add('fade-out');
  const cleanup = () => {
    loader.remove();
    document.body.style.overflow = '';
  };
  loader.addEventListener('transitionend', cleanup, { once: true });
  setTimeout(cleanup, FADE_MS + 50);
}

function scheduleDismiss() {
  const elapsed = Date.now() - loaderStart;
  const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
  setTimeout(dismissLoader, remaining);
}

const shown = sessionStorage.getItem('ss-loader-shown');
if (!shown) {
  document.body.style.overflow = 'hidden';
  sessionStorage.setItem('ss-loader-shown', '1');
  setTimeout(dismissLoader, SAFETY_TIMEOUT_MS);
} else {
  dismissLoader();
}

export default function App() {
  useEffect(() => {
    if (!shown) scheduleDismiss();
    else dismissLoader();
  }, []);
  return <RouterProvider router={router} />;
}
