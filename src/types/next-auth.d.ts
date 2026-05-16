import "next-auth";
import "next-auth/jwt";

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    /** Set on credentials sign-in to lengthen JWT when "remember me" is checked. */
    rememberMe?: boolean;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    rememberMe?: boolean;
  }
}

declare module "@auth/core/types" {
  interface User {
    role?: string;
    rememberMe?: boolean;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role?: string;
    };
  }
}
