import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export const metadata = {
  title: "FutureLens — Start Your Simulation",
  description: "Tell us about yourself so we can build your future selves.",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
