import { Suspense } from 'react'
import NewUiApp from '../../new-ui/App'

const ModernDashboard = () => (
  <Suspense fallback={<div className="flex items-center justify-center py-12 text-slate-500">Loading…</div>}>
    <NewUiApp />
  </Suspense>
)

export default ModernDashboard
