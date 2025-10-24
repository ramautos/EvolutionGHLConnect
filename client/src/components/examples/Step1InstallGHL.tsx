import Step1InstallGHL from '../Step1InstallGHL';

export default function Step1InstallGHLExample() {
  return (
    <div className="p-8">
      <Step1InstallGHL onNext={() => console.log('Next step triggered')} />
    </div>
  );
}
