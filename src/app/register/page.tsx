import { AuthBackButton } from "@/components/auth/AuthBackButton";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthPageFooter } from "@/components/auth/AuthPageFooter";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { CompactLanguageSwitcher } from "@/components/i18n/CompactLanguageSwitcher";

export default function RegisterPage() {
  const googleEnabled = Boolean(
    (process.env.GOOGLE_CLIENT_ID?.trim() || process.env.AUTH_GOOGLE_ID?.trim()) &&
    (process.env.GOOGLE_CLIENT_SECRET?.trim() || process.env.AUTH_GOOGLE_SECRET?.trim())
  );
  const appleEnabled = Boolean(
    (process.env.APPLE_ID?.trim() ||
      process.env.AUTH_APPLE_ID?.trim() ||
      process.env.APPLE_CLIENT_ID?.trim()) &&
    (process.env.APPLE_SECRET?.trim() ||
      process.env.AUTH_APPLE_SECRET?.trim() ||
      process.env.APPLE_CLIENT_SECRET?.trim())
  );

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
      <AuthBackButton />
      <CompactLanguageSwitcher />
      <SocialButtons googleEnabled={googleEnabled} appleEnabled={appleEnabled} />
      <AuthDivider />
      <AuthForm mode="register" />
      <AuthPageFooter mode="register" />
    </main>
  );
}
