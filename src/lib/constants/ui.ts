// Badge variants
export type BadgeVariants = 'default' | 'secondary' | 'destructive' | 'outline'
export const badgeVariants = {
  default: 'bg-primary hover:bg-primary/80 border-transparent text-primary-foreground',
  secondary: 'bg-secondary hover:bg-secondary/80 border-transparent text-secondary-foreground',
  destructive: 'bg-destructive hover:bg-destructive/80 border-transparent text-destructive-foreground',
  outline: 'text-foreground',
}

// Button variants
export const buttonVariants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'underline-offset-4 hover:underline text-primary',
}

// Form constants
export const Form = {
  labelVariants: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
}

// Navigation menu constants
export const NavigationMenuConstants = {
  viewportSlideIn: 'origin-top-center animate-in data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 md:data-[state=closed]:slide-out-to-right-1/2 md:data-[state=open]:slide-in-from-right-1/2',
}

// Toggle variants
export const toggleVariants = {
  default: 'bg-transparent hover:bg-muted hover:text-muted-foreground',
  outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
}