import { Link } from 'react-router-dom'
import { FolderHeart } from 'lucide-react'
import { useVault } from '@/contexts/DataContext'
import { PageTitle, SafetyNote } from '@/components/common'
import { CareHistoryGraph } from '../components/CareHistoryGraph'

export default function MedicalHistoryPage() {
  const { careTracks, visits, records, medications, followUps } = useVault()
  return (
    <>
      <PageTitle
        title="Medical history"
        description="See how this profile's visits, documents and medication schedules connect. Only relationships you have recorded are shown."
        action={
          <Link to="/medical-records" className="action-link">
            <FolderHeart size={16} aria-hidden="true" /> Manage records
          </Link>
        }
      />
      <CareHistoryGraph
        careTracks={careTracks}
        visits={visits}
        records={records}
        medications={medications}
        followUps={followUps}
      />
      <SafetyNote />
    </>
  )
}
