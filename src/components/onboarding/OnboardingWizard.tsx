"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  INITIAL_FORM_DATA,
  ONBOARDING_STEPS,
  type OnboardingFormData,
  type UploadedDocument,
} from "@/lib/types/onboarding";
import StepAboutYou from "./StepAboutYou";
import StepCareerFinance from "./StepCareerFinance";
import StepWellness from "./StepWellness";
import StepGoals from "./StepGoals";
import StepDocuments from "./StepDocuments";
import styles from "./Onboarding.module.css";

const TOTAL_STEPS = ONBOARDING_STEPS.length;

export default function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingFormData>(INITIAL_FORM_DATA);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = useCallback(
    (field: keyof OnboardingFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleDocumentsChange = useCallback((docs: UploadedDocument[]) => {
    setFormData((prev) => ({ ...prev, documents: docs }));
  }, []);

  const handleAudioCapture = useCallback((blob: Blob | null) => {
    setAudioBlob(blob);
  }, []);

  const goNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Store profile data in sessionStorage for the simulation page
      const profilePayload = {
        ...formData,
        skills: formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        // Don't include document content in sessionStorage (too large)
        documents: formData.documents.map((d) => ({
          name: d.name,
          type: d.type,
          size: d.size,
        })),
        hasVoiceRecording: !!audioBlob,
      };

      sessionStorage.setItem("futurelens_profile", JSON.stringify(profilePayload));
      router.push("/simulation");
    } catch (error) {
      console.error("Failed to save profile:", error);
      setIsSubmitting(false);
    }
  };

  const progressPercent = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  // Determine if current step has enough data to proceed
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.name && formData.age && formData.location);
      case 2:
        return !!(formData.currentRole && formData.industry);
      case 3:
        return true; // All optional with selects
      case 4:
        return true; // Goals are optional, voice is optional
      case 5:
        return true; // Documents are optional
      default:
        return true;
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.ambient} ${styles.ambient1}`} />
      <div className={`${styles.ambient} ${styles.ambient2}`} />

      {/* Nav back to home */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "1.25rem 2rem",
          background: "linear-gradient(to bottom, rgba(5,8,15,0.95), transparent)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.4rem",
            fontWeight: 700,
            color: "var(--warm-white)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "2px solid var(--cyan-glow)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 12px rgba(0,229,255,0.3)",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "var(--cyan-glow)",
                boxShadow: "0 0 8px var(--cyan-glow)",
                display: "block",
              }}
            />
          </div>
          FutureLens
        </Link>
      </nav>

      {/* Progress Bar */}
      <div className={styles.progressWrapper}>
        <div className={styles.progressSteps}>
          <div className={styles.progressLine}>
            <div
              className={styles.progressLineFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {ONBOARDING_STEPS.map((step) => (
            <div key={step.number} className={styles.progressStep}>
              <div
                className={`${styles.stepDot} ${
                  currentStep === step.number ? styles.active : ""
                } ${currentStep > step.number ? styles.completed : ""}`}
              >
                {currentStep > step.number ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`${styles.stepLabel} ${
                  currentStep >= step.number ? styles.active : ""
                }`}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <div className={styles.formCard} key={currentStep}>
        {currentStep === 1 && (
          <StepAboutYou data={formData} onChange={handleFieldChange} />
        )}
        {currentStep === 2 && (
          <StepCareerFinance data={formData} onChange={handleFieldChange} />
        )}
        {currentStep === 3 && (
          <StepWellness data={formData} onChange={handleFieldChange} />
        )}
        {currentStep === 4 && (
          <StepGoals
            data={formData}
            onChange={handleFieldChange}
            onAudioCapture={handleAudioCapture}
          />
        )}
        {currentStep === 5 && (
          <StepDocuments
            data={formData}
            onDocumentsChange={handleDocumentsChange}
          />
        )}

        {/* Navigation */}
        <div className={styles.formActions}>
          {currentStep > 1 ? (
            <button type="button" className={styles.backBtn} onClick={goBack}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back
            </button>
          ) : (
            <div className={styles.spacer} />
          )}

          {currentStep < TOTAL_STEPS ? (
            <button
              type="button"
              className={styles.nextBtn}
              onClick={goNext}
              disabled={!canProceed()}
            >
              Continue
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              className={styles.nextBtn}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Build My Future Selves"}
              {!isSubmitting && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
