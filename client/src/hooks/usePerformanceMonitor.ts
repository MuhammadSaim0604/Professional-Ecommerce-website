import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
}

export const usePerformanceMonitor = (pageName: string) => {
  const metricsRef = useRef<Partial<PerformanceMetrics>>({});

  useEffect(() => {
    // Measure initial page load metrics
    const measureInitialMetrics = () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        metricsRef.current.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
        metricsRef.current.timeToInteractive = navigation.domInteractive - navigation.fetchStart;
        
        // Get paint metrics
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            metricsRef.current.firstContentfulPaint = entry.startTime;
          }
        });

        // Get LCP metric
        if ('PerformanceObserver' in window) {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            metricsRef.current.largestContentfulPaint = lastEntry.startTime;
          });
          
          try {
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
          } catch (e) {
            // LCP not supported
          }

          // Cleanup observer after 10 seconds
          setTimeout(() => {
            lcpObserver.disconnect();
          }, 10000);
        }

        // Log metrics in development
        if (process.env.NODE_ENV === 'development') {
          setTimeout(() => {
            console.group(`📊 Performance Metrics - ${pageName}`);
            console.log('Page Load Time:', metricsRef.current.pageLoadTime?.toFixed(2), 'ms');
            console.log('Time to Interactive:', metricsRef.current.timeToInteractive?.toFixed(2), 'ms');
            console.log('First Contentful Paint:', metricsRef.current.firstContentfulPaint?.toFixed(2), 'ms');
            console.log('Largest Contentful Paint:', metricsRef.current.largestContentfulPaint?.toFixed(2), 'ms');
            console.groupEnd();
          }, 2000);
        }
      }
    };

    // Wait for page to load
    if (document.readyState === 'complete') {
      measureInitialMetrics();
    } else {
      window.addEventListener('load', measureInitialMetrics);
    }

    return () => {
      window.removeEventListener('load', measureInitialMetrics);
    };
  }, [pageName]);

  return metricsRef.current;
};