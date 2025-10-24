import InstanceCard from '../InstanceCard';

export default function InstanceCardExample() {
  return (
    <div className="p-8 space-y-4 max-w-md">
      <InstanceCard
        instanceName="Agencia Principal"
        status="created"
        onGenerateQR={() => console.log('Generate QR')}
        onDisconnect={() => console.log('Disconnect')}
        onDelete={() => console.log('Delete')}
      />
      <InstanceCard
        instanceName="Ventas Departamento"
        phoneNumber="+1 (555) 123-4567"
        status="connected"
        onGenerateQR={() => console.log('Generate QR')}
        onDisconnect={() => console.log('Disconnect')}
        onDelete={() => console.log('Delete')}
      />
      <InstanceCard
        instanceName="Soporte Cliente"
        status="connecting"
        onGenerateQR={() => console.log('Generate QR')}
        onDisconnect={() => console.log('Disconnect')}
        onDelete={() => console.log('Delete')}
      />
    </div>
  );
}
