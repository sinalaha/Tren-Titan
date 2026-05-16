import { CoachChat } from "@/components/coach/CoachChat";
import { CoachPageHero } from "@/components/coach/CoachPageHero";

export default function CoachPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6">
      <CoachPageHero />
      <CoachChat />
    </div>
  );
}
