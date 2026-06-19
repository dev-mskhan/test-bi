import React from "react";
import { Spinner } from "./Spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  isLoading = false,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyle =
    "inline-flex items-center justify-center px-4 py-2 rounded-md font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-[#6366f1] hover:bg-indigo-700 text-white focus:ring-indigo-500",
    secondary: "bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#ededed] border border-[#2a2a2a] focus:ring-indigo-500",
    danger: "bg-[#ef4444] hover:bg-red-700 text-white focus:ring-red-500",
    ghost: "bg-transparent hover:bg-[#1a1a1a] text-[#ededed] focus:ring-indigo-500",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading && <Spinner className="w-4 h-4 mr-2" />}
      {children}
    </button>
  );
};
export default Button;
