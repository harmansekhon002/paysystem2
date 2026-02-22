// Animation and transition utilities

export const animations = {
  // Fade animations
  fadeIn: "animate-in fade-in duration-300",
  fadeOut: "animate-out fade-out duration-200",
  fadeInUp: "animate-in fade-in slide-in-from-bottom-4 duration-300",
  fadeInDown: "animate-in fade-in slide-in-from-top-4 duration-300",
  fadeInLeft: "animate-in fade-in slide-in-from-left-4 duration-300",
  fadeInRight: "animate-in fade-in slide-in-from-right-4 duration-300",

  // Slide animations
  slideInUp: "animate-in slide-in-from-bottom duration-300",
  slideInDown: "animate-in slide-in-from-top duration-300",
  slideInLeft: "animate-in slide-in-from-left duration-300",
  slideInRight: "animate-in slide-in-from-right duration-300",

  // Scale animations
  scaleIn: "animate-in zoom-in duration-200",
  scaleOut: "animate-out zoom-out duration-150",

  // Bounce
  bounce: "animate-bounce",

  // Pulse
  pulse: "animate-pulse",

  // Spin
  spin: "animate-spin",

  // Custom transitions
  smoothTransition: "transition-all duration-300 ease-in-out",
  fastTransition: "transition-all duration-150 ease-out",
  slowTransition: "transition-all duration-500 ease-in-out",
}

export const staggerAnimationDelays = {
  delay0: "animation-delay-0",
  delay75: "animation-delay-75",
  delay100: "animation-delay-100",
  delay150: "animation-delay-150",
  delay200: "animation-delay-200",
  delay300: "animation-delay-300",
  delay500: "animation-delay-500",
}

// Spring animation config for framer-motion
export const spring = {
  default: { type: "spring", stiffness: 300, damping: 30 },
  gentle: { type: "spring", stiffness: 200, damping: 25 },
  bouncy: { type: "spring", stiffness: 400, damping: 20 },
  stiff: { type: "spring", stiffness: 500, damping: 35 },
}

// Easing functions
export const easing = {
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
}

// Parallax utilities
export function calculateParallaxOffset(scrollY: number, speed: number = 0.5): number {
  return scrollY * speed
}

export function getParallaxStyle(scrollY: number, speed: number = 0.5): React.CSSProperties {
  return {
    transform: `translateY(${calculateParallaxOffset(scrollY, speed)}px)`,
    transition: "transform 0.1s ease-out",
  }
}

// Intersection Observer hook utility types
export interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  root?: Element | null
  rootMargin?: string
  freezeOnceVisible?: boolean
}

// Scroll progress utility
export function calculateScrollProgress(element?: HTMLElement): number {
  if (!element) {
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    const scrollTop = window.scrollY
    return Math.min(scrollTop / (documentHeight - windowHeight), 1)
  }

  const rect = element.getBoundingClientRect()
  const elementHeight = rect.height
  const elementTop = rect.top
  const windowHeight = window.innerHeight

  if (elementTop > windowHeight) return 0
  if (elementTop + elementHeight < 0) return 1

  const visibleHeight = Math.min(windowHeight - elementTop, elementHeight)
  return visibleHeight / elementHeight
}

// Animation state machine
export type AnimationState = "idle" | "loading" | "success" | "error"

export interface AnimationStateConfig {
  idle: string
  loading: string
  success: string
  error: string
}

export const defaultAnimationStates: AnimationStateConfig = {
  idle: "",
  loading: "animate-pulse",
  success: "animate-in zoom-in duration-200",
  error: "animate-in shake duration-300",
}

// Stagger children animation helper
export function getStaggerDelay(index: number, baseDelay: number = 50): number {
  return index * baseDelay
}

// Gesture animation thresholds
export const gestureThresholds = {
  swipe: 50, // pixels
  longPress: 500, // ms
  doubleTap: 300, // ms between taps
}

// Loading states
export const loadingAnimations = {
  spinner: "animate-spin",
  dots: "animate-pulse",
  bars: "animate-bounce",
  skeleton: "animate-pulse bg-muted",
}
