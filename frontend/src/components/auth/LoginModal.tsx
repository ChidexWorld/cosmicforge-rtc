// components/LoginModal.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";
import AuthInput from "@/components/auth/AuthInput";
import { Button } from "@/components/ui/button";
import AuthHeader from "./AuthHeader";
import { Checkbox } from "../ui/checkbox";
import Divider from "./Divider";

const LoginModal = () => {
  return (
    <div className="relative z-10 bg-white rounded-2xl sm:rounded-[40px] shadow-2xl w-full max-w-[520px] px-5 py-6 sm:p-8 md:p-12 my-4 sm:my-6">
      {/* Header */}
      <AuthHeader title="Welcome Back" subtitle="Log in to your account." />

      {/* Form Fields */}
      <form className="space-y-3">
        <AuthInput label="Email" type="email" placeholder="you@example.com" />
        <AuthInput
          label="Password"
          type="password"
          placeholder="Enter your password"
        />

        {/* Forgot Password */}
        <div className="flex justify-end">
          <Link
            href="#"
            className="text-sm text-[#029CD4] font-semibold hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-center gap-3 py-1">
          <Checkbox id="terms" />
          <label
            htmlFor="terms"
            className="text-sm text-[#029CD4] cursor-pointer"
          >
            Remember Me
          </label>
        </div>

        {/* Main Log In Button */}
        <Button size="lg" className="w-full">
          Log In
        </Button>
      </form>

      {/* Signup Redirect */}
      <div className="text-center md:mt-2 text-[12px] md:text-[14px] space-x-1">
        <p>
          Don&apos;t have an account?{" "}
          <Link href="/signup">
            <Button variant="link" className="p-1 text-[14px] md:text-[16px]">
              Sign Up
            </Button>
          </Link>
        </p>
      </div>

      {/* Divider */}
      <Divider text="OR" />

      {/* Google Sign In */}
      <Button
        variant="outline"
        className="w-full border-gray-100 text-gray-500 hover:bg-gray-50 rounded-2xl group"
      >
        <div className="relative w-5 h-5 group-hover:scale-110 transition-transform">
          <Image
            src="/GoogleLogo.png"
            alt="Google"
            fill
            className="object-contain"
          />
        </div>
        Continue with Google
      </Button>
    </div>
  );
};

export default LoginModal;
