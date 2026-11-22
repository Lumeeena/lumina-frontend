"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { t, type MessageKey } from "@/lib/i18n";

interface TourStep {
  id: string;
  titleKey: MessageKey;
  bodyKey: MessageKey;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "explorer",
    titleKey: "onTour.stepExplorerTitle",
    bodyKey: "onTour.stepExplorerBody",
  },
  {
    id: "transactions",
    titleKey: "onTour.stepTransactionsTitle",
    bodyKey: "onTour.stepTransactionsBody",
  },
  {
    id: "events",
    titleKey: "onTour.stepEventsTitle",
    bodyKey: "onTour.stepEventsBody",
  },
  {
    id: "graphql",
    titleKey: "onTour.stepGraphqlTitle",
    bodyKey: "onTour.stepGraphqlBody",
  },
  {
    id: "registry",
    titleKey: "onTour.stepRegistryTitle",
    bodyKey: "onTour.stepRegistryBody",
  },
];

const STORAGE_KEY = "lumina_onboarding_completed";

export default function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasCompleted = localStorage.getItem(STORAGE_KEY);
    if (!hasCompleted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- post-hydration restore from localStorage
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-2xl p-8 max-w-sm w-full shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
              {t("onTour.welcomeTitle")}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t("onTour.welcomeSubtitle")}
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="p-1 hover:bg-[var(--color-bg-subtle)] rounded-lg transition-colors flex-shrink-0"
            aria-label={t("onTour.closeTour")}
          >
            <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        <div className="mb-6">
          <div className="text-lg font-bold text-[var(--color-text-primary)] mb-3">
            {t(step.titleKey)}
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {t(step.bodyKey)}
          </p>
        </div>

        <div className="w-full h-1 bg-[var(--color-bg-subtle)] rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-[var(--color-accent-fill)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-secondary)]">
            {t("onTour.stepPosition", {
              current: currentStep + 1,
              total: TOUR_STEPS.length,
            })}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] rounded-lg transition-colors"
            >
              {t("onTour.skip")}
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 text-sm font-semibold bg-[var(--color-accent-fill)] hover:bg-[var(--color-accent-fill-hover)] text-white rounded-lg transition-colors"
            >
              {currentStep === TOUR_STEPS.length - 1
                ? t("onTour.done")
                : t("onTour.next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
