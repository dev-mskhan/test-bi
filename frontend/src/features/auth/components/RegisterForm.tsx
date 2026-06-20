import React, { useState, useEffect } from "react";
import { useRegisterMutation } from "../authApi";
import { useNavigate, Link } from "react-router-dom";
import { useAppSelector } from "../../../app/hooks";
import toast from "react-hot-toast";
import Button from "../../../components/ui/Button";

export const RegisterForm: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"analyst" | "viewer">("viewer");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [register, { isLoading }] = useRegisterMutation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Navigate to dashboard once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name) {
      newErrors.name = "Name is required";
    }
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
      const res = await register({ name, email, password, role }).unwrap();
      if (res.success) {
        toast.success("Account created successfully");
      } else {
        toast.error(res.message || "Failed to create account");
      }
    } catch (err: any) {
      toast.error(
        err?.data?.message || "Registration failed. Try a different email.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1">
          Full Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-[#ededed] px-3.5 py-2 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          placeholder="John Doe"
        />
        {errors.name && (
          <p className="text-[#ef4444] text-xs mt-1">{errors.name}</p>
        )}
      </div>

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
        <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1">
          Password
        </label>
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

      <div>
        <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1">
          Select Role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-[#ededed] px-3.5 py-2 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        >
          <option value="viewer">Viewer (Read Only)</option>
          <option value="analyst">Analyst (Create Analysis/Workflows)</option>
        </select>
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full mt-2">
        Create Account
      </Button>

      <div className="text-center pt-2">
        <span className="text-xs text-[#888888]">
          Already have an account?{" "}
        </span>
        <Link
          to="/login"
          className="text-xs text-[#6366f1] hover:underline font-medium"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
};
export default RegisterForm;
