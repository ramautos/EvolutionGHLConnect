import { useState } from "react";
import OnboardingProgress from "@/components/OnboardingProgress";
import Step1InstallGHL from "@/components/Step1InstallGHL";
import Step2SelectSubaccounts from "@/components/Step2SelectSubaccounts";
import Step3ScanQR from "@/components/Step3ScanQR";
import { Sparkles } from "lucide-react";

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  
  const handleNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };
  
  const handleComplete = () => {
    console.log("Onboarding completed!");
    window.location.href = "/dashboard";
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-accent)' }}>
              WhatsApp AI
            </span>
          </div>
        </div>
        
        <OnboardingProgress currentStep={currentStep} totalSteps={3} />
        
        <div className="mt-12">
          {currentStep === 1 && <Step1InstallGHL onNext={handleNextStep} />}
          {currentStep === 2 && <Step2SelectSubaccounts onNext={handleNextStep} />}
          {currentStep === 3 && <Step3ScanQR onComplete={handleComplete} />}
        </div>
      </div>
    </div>
  );
}
