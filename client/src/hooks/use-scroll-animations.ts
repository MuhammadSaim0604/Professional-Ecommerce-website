import { useEffect } from 'react';
import { gsap } from 'gsap';

// Note: ScrollTrigger is a premium GSAP plugin
// For now we'll use basic intersection observer approach

export const useScrollAnimations = () => {
  useEffect(() => {
    // Simple intersection observer for animating elements on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            
            if (element.classList.contains('animate-on-scroll')) {
              gsap.fromTo(
                element,
                {
                  opacity: 0,
                  y: 30,
                  scale: 0.95,
                },
                {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  duration: 0.6,
                  ease: 'power2.out',
                }
              );
              
              // Remove observer after animating
              observer.unobserve(element);
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    // Observe all elements with animation class
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach((el) => observer.observe(el));

    // Cleanup
    return () => observer.disconnect();
  }, []);
};

export const animateOnScroll = (element: HTMLElement, options?: {
  delay?: number;
  duration?: number;
  y?: number;
  scale?: number;
}) => {
  const {
    delay = 0,
    duration = 0.6,
    y = 30,
    scale = 1,
  } = options || {};

  gsap.fromTo(
    element,
    {
      opacity: 0,
      y,
      scale: scale * 0.95,
    },
    {
      opacity: 1,
      y: 0,
      scale,
      duration,
      delay,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: element,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    }
  );
};