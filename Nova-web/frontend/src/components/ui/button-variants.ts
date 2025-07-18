import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-purple-600 text-white hover:bg-purple-700 hover:glow-purple",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        outline: "border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50",
        secondary: "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20",
        ghost: "text-gray-400 hover:text-white hover:bg-white/5",
        link: "text-purple-400 underline-offset-4 hover:underline hover:text-purple-300",
        purple: "bg-purple-600 text-white hover:bg-purple-700 hover:glow-purple hover:scale-105",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8",
        xl: "h-14 rounded-xl px-12 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
); 