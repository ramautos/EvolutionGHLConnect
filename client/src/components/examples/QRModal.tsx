import QRModal from '../QRModal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function QRModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [phoneDetected, setPhoneDetected] = useState<string>();
  
  const handleOpen = () => {
    setIsOpen(true);
    setPhoneDetected(undefined);
    // Simulate phone detection after 3 seconds
    setTimeout(() => {
      setPhoneDetected('+1 (555) 987-6543');
    }, 3000);
  };
  
  return (
    <div className="p-8">
      <Button onClick={handleOpen}>Abrir Modal QR</Button>
      <QRModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        qrValue="https://wa.me/qr/SAMPLE123"
        isScanning={!phoneDetected}
        phoneDetected={phoneDetected}
      />
    </div>
  );
}
