import React, { useState } from "react";
import { useLoginMutation } from "../authApi";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../../../components/ui/Button";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [login, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email address is invalid";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const res = await login({ email, password }).unwrap();
      if (res.success) {
        toast.success("Successfully logged in");
        navigate("/");
      } else {
        toast.error(res.message || "Failed to log in");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Invalid email or password");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-[#ededed] px-3.5 py-2 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          placeholder="name@company.com"
        />
        {errors.email && (
          <p className="text-[#ef4444] text-xs mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider">
            Password
          </label>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-[#ededed] px-3.5 py-2 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="text-[#ef4444] text-xs mt-1">{errors.password}</p>
        )}
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full mt-2">
        Sign In
      </Button>

      <div className="text-center pt-2">
        <span className="text-xs text-[#888888]">Don't have an account? </span>
        <Link to="/register" className="text-xs text-[#6366f1] hover:underline font-medium">
          Create account
        </Link>
      </div>
    </form>
  );
};
export default LoginForm;
