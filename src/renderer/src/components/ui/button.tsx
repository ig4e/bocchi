import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary-500 text-white shadow-soft hover:bg-primary-600 hover:shadow-medium active:scale-[0.98] dark:shadow-dark-soft dark:hover:shadow-dark-medium',
        destructive:
          'bg-red-600 text-white shadow-soft hover:bg-red-700 hover:shadow-medium active:scale-[0.98]',
        outline:
          'border border-border/50 bg-transparent hover:bg-secondary-50/50 dark:hover:bg-secondary-900/50 text-text-primary backdrop-blur-sm',
        secondary:
          'bg-surface/50 text-text-primary shadow-soft hover:shadow-medium dark:shadow-dark-soft dark:hover:shadow-dark-medium active:scale-[0.98] backdrop-blur-sm border border-border/30',
        ghost: 'text-text-primary hover:bg-secondary-100/50 dark:hover:bg-secondary-800/50',
        link: 'text-primary-500 dark:text-primary-400 underline-offset-4 hover:underline',
        warm: 'bg-secondary-300/50 dark:bg-secondary-700/50 text-text-primary hover:bg-secondary-400/50 dark:hover:bg-secondary-600/50 active:scale-[0.98] backdrop-blur-sm'
      },
      size: {
        default: 'h-10 px-5 py-2 text-sm',
        sm: 'h-8 px-4 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
        xs: 'h-7 px-3 text-xs'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
