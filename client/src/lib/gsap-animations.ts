import { gsap } from "gsap";

// GSAP Utility functions for reusable animations

export const animateIn = {
  // Fade in animation
  fadeIn: (element: HTMLElement | string, duration = 0.6, delay = 0) => {
    return gsap.fromTo(
      element,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration, delay, ease: "power2.out" }
    );
  },

  // Scale in animation
  scaleIn: (element: HTMLElement | string, duration = 0.5, delay = 0) => {
    return gsap.fromTo(
      element,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration, delay, ease: "back.out(1.7)" }
    );
  },

  // Slide in from left
  slideInLeft: (element: HTMLElement | string, duration = 0.6, delay = 0) => {
    return gsap.fromTo(
      element,
      { x: -50, opacity: 0 },
      { x: 0, opacity: 1, duration, delay, ease: "power2.out" }
    );
  },

  // Slide in from right
  slideInRight: (element: HTMLElement | string, duration = 0.6, delay = 0) => {
    return gsap.fromTo(
      element,
      { x: 50, opacity: 0 },
      { x: 0, opacity: 1, duration, delay, ease: "power2.out" }
    );
  },

  // Stagger animation for multiple elements
  stagger: (elements: HTMLElement[] | string, duration = 0.6, staggerDelay = 0.1) => {
    return gsap.fromTo(
      elements,
      { opacity: 0, y: 30, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration,
        stagger: staggerDelay,
        ease: "power2.out",
      }
    );
  },
};

export const animateOut = {
  // Fade out animation
  fadeOut: (element: HTMLElement | string, duration = 0.4) => {
    return gsap.to(element, {
      opacity: 0,
      y: -20,
      duration,
      ease: "power2.in",
    });
  },

  // Scale out animation
  scaleOut: (element: HTMLElement | string, duration = 0.4) => {
    return gsap.to(element, {
      scale: 0.8,
      opacity: 0,
      duration,
      ease: "power2.in",
    });
  },

  // Slide out to left
  slideOutLeft: (element: HTMLElement | string, duration = 0.4) => {
    return gsap.to(element, {
      x: -50,
      opacity: 0,
      duration,
      ease: "power2.in",
    });
  },

  // Slide out to right
  slideOutRight: (element: HTMLElement | string, duration = 0.4) => {
    return gsap.to(element, {
      x: 50,
      opacity: 0,
      duration,
      ease: "power2.in",
    });
  },
};

export const overlayAnimations = {
  // Full screen overlay entrance
  overlayIn: (overlay: HTMLElement | string, duration = 0.5) => {
    const tl = gsap.timeline();
    tl.fromTo(
      overlay,
      { opacity: 0 },
      { opacity: 1, duration: duration * 0.6, ease: "power2.out" }
    );
    return tl;
  },

  // Full screen overlay exit
  overlayOut: (overlay: HTMLElement | string, duration = 0.4) => {
    return gsap.to(overlay, {
      opacity: 0,
      duration,
      ease: "power2.in",
    });
  },

  // Search overlay content animation
  searchContentIn: (content: HTMLElement | string, duration = 0.6) => {
    const tl = gsap.timeline();
    tl.fromTo(
      content,
      { y: 50, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration, ease: "back.out(1.7)" }
    );
    return tl;
  },

  // Search results stagger animation
  searchResultsIn: (results: HTMLElement[] | string, staggerDelay = 0.05) => {
    return gsap.fromTo(
      results,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: staggerDelay,
        ease: "power2.out",
      }
    );
  },
};

export const hoverAnimations = {
  // Card hover effect
  cardHover: (card: HTMLElement) => {
    const tl = gsap.timeline({ paused: true });
    tl.to(card, {
      y: -8,
      scale: 1.02,
      boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
      duration: 0.3,
      ease: "power2.out",
    });
    return tl;
  },

  // Button hover effect
  buttonHover: (button: HTMLElement) => {
    const tl = gsap.timeline({ paused: true });
    tl.to(button, {
      scale: 1.05,
      duration: 0.2,
      ease: "power2.out",
    });
    return tl;
  },

  // Image hover effect
  imageHover: (image: HTMLElement) => {
    const tl = gsap.timeline({ paused: true });
    tl.to(image, {
      scale: 1.1,
      duration: 0.4,
      ease: "power2.out",
    });
    return tl;
  },
};

export const loadingAnimations = {
  // Pulse animation for loading states
  pulse: (element: HTMLElement | string) => {
    return gsap.to(element, {
      scale: 1.02,
      duration: 1,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
    });
  },

  // Shimmer effect for skeleton loading
  shimmer: (element: HTMLElement | string) => {
    return gsap.fromTo(
      element,
      { opacity: 0.5 },
      {
        opacity: 1,
        duration: 1.5,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
      }
    );
  },
};

// Utility to kill all animations on an element
export const killAnimations = (element: HTMLElement | string) => {
  gsap.killTweensOf(element);
};

// Set initial states for elements that will be animated
export const setInitialState = {
  hidden: (element: HTMLElement | string) => {
    gsap.set(element, { opacity: 0, y: 30 });
  },
  
  scaled: (element: HTMLElement | string) => {
    gsap.set(element, { scale: 0.8, opacity: 0 });
  },
  
  slideLeft: (element: HTMLElement | string) => {
    gsap.set(element, { x: -50, opacity: 0 });
  },
  
  slideRight: (element: HTMLElement | string) => {
    gsap.set(element, { x: 50, opacity: 0 });
  },
};