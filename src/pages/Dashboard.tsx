import BedBoard from '../components/BedBoard';
import DischargeQueue from '../components/DischargeQueue';
import PatientPanel from '../components/PatientPanel';

export default function Dashboard() {
  return (
    <>
      <div className="flex flex-1 overflow-hidden">
        {/* Main bed board area */}
        <BedBoard />
        {/* Right: discharge queue */}
        <DischargeQueue />
      </div>
      {/* Patient slide-in panel (portal-style overlay) */}
      <PatientPanel />
    </>
  );
}
