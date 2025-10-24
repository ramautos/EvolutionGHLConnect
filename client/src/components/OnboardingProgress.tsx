import { Check } from "lucide-react";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

const steps = [
  { number: 1, title: "Instalar App GHL" },
  { number: 2, title: "Seleccionar Subcuentas" },
  { number: 3, title: "Escanear QR" },
];

export default function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  return (
    <div className="w-full max-w-3xl mx-auto mb-12" data-testid="onboarding-progress">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  currentStep > step.number
                    ? 'bg-primary border-primary text-white'
                    : currentStep === step.number
                    ? 'border-primary text-primary'
                    : 'border-muted text-muted-foreground'
                }`}
                data-testid={`step-indicator-${step.number}`}
              >
                {currentStep > step.number ? (
                  <Check className="w-8 h-8" />
                ) : (
                  <span className="text-2xl font-bold">{step.number}</span>
                )}
              </div>
              <div className="mt-3 text-center">
                <div className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </div>
              </div>
            </div>
            
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-4 bg-muted">
                <div
                  className={`h-full bg-primary transition-all duration-500 ${
                    currentStep > step.number ? 'w-full' : 'w-0'
                  }`}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
