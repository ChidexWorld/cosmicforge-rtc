import React from "react";
import PasswordResetModal from "@/components/auth/PasswordResetModal";

const ResetPasswordPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <PasswordResetModal />
    </div>
  );
};

export default ResetPasswordPage;
