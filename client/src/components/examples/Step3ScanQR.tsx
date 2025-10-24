import Step3ScanQR from '../Step3ScanQR';

export default function Step3ScanQRExample() {
  return (
    <div className="p-8">
      <Step3ScanQR onComplete={() => console.log('Setup completed!')} />
    </div>
  );
}
