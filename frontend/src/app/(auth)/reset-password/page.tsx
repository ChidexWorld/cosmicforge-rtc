import VerifyEmailModal from "@/components/auth/VerifyEmailModal";

export default function PasswordPage() {
  return (
    <VerifyEmailModal
      email="uiuxwithdema@gmail.com"
      title="Reset Password!"
      maskedEmail
      showReturnToLogin={true}
    />
  );
}
