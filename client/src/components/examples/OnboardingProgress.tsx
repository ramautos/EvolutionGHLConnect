import OnboardingProgress from '../OnboardingProgress';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function OnboardingProgressExample() {
  const [step, setStep] = useState(1);
  
  return (
    <div className="p-8 space-y-8">
      <OnboardingProgress currentStep={step} totalSteps={3} />
      <div className="flex gap-4 justify-center">
        <Button onClick={() => setStep(Math.max(1, step - 1))} variant="outline">
          Anterior
        </Button>
        <Button onClick={() => setStep(Math.min(3, step + 1))}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}
