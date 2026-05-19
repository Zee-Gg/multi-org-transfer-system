interface Props {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  dot?: boolean;
}

const variants = {
  default: "bg-slate-100 text-slate-600",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  error:   "bg-red-50 text-red-700",
  info:    "bg-indigo-50 text-indigo-700",
};

const dots = {
  default: "bg-slate-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error:   "bg-red-500",
  info:    "bg-indigo-500",
};

export default function Badge({ children, variant = "default", dot = false }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dots[variant]} ${variant === "info" ? "animate-pulse" : ""}`} />}
      {children}
    </span>
  );
}