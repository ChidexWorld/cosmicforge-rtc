import React from "react";
import Link from "next/link";

import AuthHeader from "./AuthHeader";
import AuthInput from "@/components/auth/AuthInput";
import { Button } from "@/components/ui/button";

const PasswordResetModal = () => {
  return (
    <div className="relative z-10 bg-white rounded-[40px] shadow-2xl w-full p-6 md:p-9">
      {/* Header */}
      <AuthHeader title="Password Reset!" subtitle="Create New Password." />

      {/* Form */}
      <form className="space-y-2">
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

        {/* Submit Button */}
        <Button size="lg" className="w-full mt-4">
          Submit
        </Button>
      </form>

      {/* Back to Login */}
      <div className="text-center mt-6">
        <Link href="/login">
          <Button variant="link"> Return to Log In Page</Button>{" "}
        </Link>
      </div>
    </div>
  );
};

export default PasswordResetModal;
