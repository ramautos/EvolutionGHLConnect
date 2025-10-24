import { useState, useEffect } from "react";
import OnboardingProgress from "@/components/OnboardingProgress";
import Step1InstallGHL from "@/components/Step1InstallGHL";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  
  const handleInstallComplete = () => {
    setCurrentStep(2);
  };
  
  const handleRedirectToDashboard = () => {
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
        
        <OnboardingProgress currentStep={currentStep} totalSteps={2} />
        
        <div className="mt-12">
          {currentStep === 1 && <Step1InstallGHL onNext={handleInstallComplete} />}
          {currentStep === 2 && (
            <div className="max-w-2xl mx-auto">
              <Card className="p-8 border-card-border">
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  
                  <div>
                    <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-accent)' }}>
                      ¡Instalación Completada!
                    </h2>
                    <p className="text-muted-foreground">
                      Tu cuenta de GoHighLevel está conectada correctamente
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-xl p-6">
                    <p className="text-sm text-muted-foreground">
                      Ahora puedes ir al dashboard para ver tus locations y generar códigos QR de WhatsApp para cada una.
                    </p>
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="w-full gap-2" 
                    onClick={handleRedirectToDashboard}
                    data-testid="button-go-to-dashboard"
                  >
                    Ir al Dashboard
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
