import Step2SelectSubaccounts from '../Step2SelectSubaccounts';

export default function Step2SelectSubaccountsExample() {
  return (
    <div className="p-8">
      <Step2SelectSubaccounts onNext={() => console.log('Next step triggered')} />
    </div>
  );
}
