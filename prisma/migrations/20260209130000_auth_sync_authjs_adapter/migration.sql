-- Auth.js (@auth/prisma-adapter): User.emailVerified для OAuth-профиля; Account.session_state для части провайдеров.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3);

ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "session_state" TEXT;
