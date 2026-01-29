// components/SignupModal.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";
import AuthInput from "@/components/auth/AuthInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import AuthHeader from "./AuthHeader";
import Divider from "./Divider";

const SignupModal = () => {
  return (
    <div className="relative z-10 bg-white rounded-2xl sm:rounded-[40px] shadow-2xl w-full max-w-[520px] px-5 py-6 sm:p-8 md:p-12 my-4 sm:my-6">
      {/* Header */}
      <AuthHeader
        title="Create Your Account"
        subtitle="Welcome! Let's get you Started."
      />

      {/* Form Fields */}
      <form className="space-y-3">
        <AuthInput
          label="Username"
          type="text"
          placeholder="Enter your preferred Username"
        />
        <AuthInput label="Email" type="email" placeholder="you@example.com" />
        <AuthInput
          label="Password"
          type="password"
          placeholder="Create a Password"
        />
        <AuthInput
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
        />

        {/* Terms Checkbox */}
        <div className="flex items-center gap-3 py-1">
          <Checkbox id="terms" />
          <label
            htmlFor="terms"
            className="text-sm text-gray-600 cursor-pointer"
          >
            I accept the{" "}
            <Link
              href="#"
              className="text-[#029CD4] font-semibold hover:underline"
            >
              Terms & Condition
            </Link>
          </label>
        </div>

        {/* Main Sign Up Button */}
        <Button size="lg" className="w-full">
          Sign Up
        </Button>
      </form>

      {/* Login Redirect */}
      <div className="text-center md:mt-2 text-[12px] md:text-[14px] space-x-1">
        <p className="">
          Already have an account?
          <Link href="/login">
            <Button variant="link" className="p-1 text-[14px] md:text-[16px]">
              Log In
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

export default SignupModal;
