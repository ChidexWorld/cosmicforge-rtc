// components/auth/VerifyEmailModal.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import AuthHeader from "./AuthHeader";

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - 2, 0))}@${domain}`;
}

const VerifyEmailModal = ({
  email = "uiuxwithdema@gmail.com",
  title = "Verify your Email",
  maskedEmail = false,
  showReturnToLogin = false,
}: {
  email?: string;
  title?: string;
  maskedEmail?: boolean;
  showReturnToLogin?: boolean;
}) => {
  const displayEmail = maskedEmail ? maskEmail(email) : email;

  return (
    <div className="relative z-10 flex flex-col items-center w-full max-w-[520px]">
      <div className="bg-white rounded-2xl sm:rounded-[40px] shadow-2xl w-full max-w-[520px] px-5 py-6 sm:p-8 md:p-12 my-4 sm:my-6 flex flex-col items-center">
        {/* Header */}
        <AuthHeader title={title} subtitle="Enter OTP code" />

        <div className="text-center mb-2 space-y-1">
          <p className="text-sm text-gray-400">
            We sent you a 6-digit code via your email
          </p>
          <p className="text-sm font-bold text-gray-900">{displayEmail}</p>
        </div>

        {/* OTP Input Group */}
        <form className="w-full flex flex-col items-start space-y-2">
          <InputOTP
            maxLength={6}
            containerClassName="group flex items-center justify-between w-full"
          >
            <InputOTPGroup className="flex justify-between w-full">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="w-9 h-8 sm:w-11 sm:h-9 md:w-13 md:h-10 rounded-sm border-none bg-sky-100 text-black text-lg sm:text-xl"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <div>
            <p className="text-sm text-gray-500">
              Didn&apos;t receive code?{" "}
              <Button
                type="button"
                className="text-[#029CD4] font-bold p-1"
                variant="link"
              >
                Resend!
              </Button>
            </p>
          </div>

          {/* Submit Button */}
          <Button size="lg" className="w-full">
            Submit Code
          </Button>
        </form>

        {showReturnToLogin && (
          <Link
            href="/login"
            className="mt-2 text-sm "
          >
            <Button variant="link"> Return to Log In Page</Button>{" "}
          </Link>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailModal;
