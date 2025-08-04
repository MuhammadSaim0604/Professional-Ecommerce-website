import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function ScrollRestoration() {
  const [location] = useLocation();

  useEffect(() => {
    // Scroll to top immediately when route changes
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}