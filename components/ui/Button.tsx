import LoadingSpinner from "./LoadingSpinner";
import { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

const variants = {
  primary:   "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 disabled:bg-indigo-400",
  secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm disabled:opacity-50",
  danger:    "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 disabled:bg-red-400",
  ghost:     "text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-50",
};

const sizes = {
  sm:  "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md:  "px-4 py-2.5 text-sm rounded-lg gap-2",
  lg:  "px-6 py-3 text-base rounded-xl gap-2",
};

export default function Button({
  variant = "primary", size = "md", loading = false,
  icon, children, disabled, className = "", ...props
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-200 focus:outline-none focus-visible:ring-2
        focus-visible:ring-indigo-500 focus-visible:ring-offset-2
        disabled:cursor-not-allowed select-none
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading ? <LoadingSpinner size="sm" /> : icon}
      {children}
    </button>
  );
}