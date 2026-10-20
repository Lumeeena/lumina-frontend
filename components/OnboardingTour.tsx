'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'explorer',
    title: 'Account Explorer',
    description: 'Search and analyze any Stellar account. View balances, transaction history, and assets in detail.',
  },
  {
    id: 'transactions',
    title: 'All Transactions',
    description: 'Browse all transactions on the network in real-time. Filter by account, asset, or operation type.',
  },
  {
    id: 'events',
    title: 'Contract Events',
    description: 'Monitor Soroban contract events. Track smart contract executions and their effects.',
  },
  {
    id: 'graphql',
    title: 'GraphQL Playground',
    description: 'Query the Lumina API directly. Build custom queries to extract exactly the data you need.',
  },
  {
    id: 'registry',
    title: 'Registry',
    description: 'Register your Soroban contracts for indexing. Make your contracts discoverable to the network.',
  },
];

const STORAGE_KEY = 'lumina_onboarding_completed';

export default function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasCompleted = localStorage.getItem(STORAGE_KEY);
    if (!hasCompleted) {
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
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
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
              Welcome to Lumina
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Let's explore what makes Lumina unique
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="p-1 hover:bg-[var(--color-bg-subtle)] rounded-lg transition-colors flex-shrink-0"
            aria-label="Close tour"
          >
            <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        <div className="mb-6">
          <div className="text-lg font-bold text-[var(--color-text-primary)] mb-3">
            {step.title}
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {step.description}
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
            {currentStep + 1} of {TOUR_STEPS.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] rounded-lg transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 text-sm font-semibold bg-[var(--color-accent-fill)] hover:bg-[var(--color-accent-fill-hover)] text-white rounded-lg transition-colors"
            >
              {currentStep === TOUR_STEPS.length - 1 ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
