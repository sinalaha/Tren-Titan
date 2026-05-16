import { TRPCClientError } from "@trpc/client";
import { TRPCError } from "@trpc/server";

export function getTrpcUserMessage(error: unknown): string {
  if (error instanceof TRPCClientError) {
    return error.message || "Something went wrong.";
  }
  if (error instanceof TRPCError) {
    switch (error.code) {
      case "UNAUTHORIZED":
        return "Please sign in again.";
      case "FORBIDDEN":
        return "You do not have access to this.";
      case "NOT_FOUND":
        return "Resource not found.";
      case "TIMEOUT":
        return "Request timed out. Try again.";
      case "TOO_MANY_REQUESTS":
        return "Too many requests. Slow down.";
      default:
        return error.message || "Request failed.";
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred.";
}
