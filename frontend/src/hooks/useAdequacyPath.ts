import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchActionItems } from '../api/actionItemService'
import { fetchAdequacyConfirmations } from '../api/adequacyService'
import { fetchComplianceSummary } from '../api/complianceSummaryService'
import { fetchDocumentsByWorkspace } from '../api/documentService'
import { fetchProcessingActivities } from '../api/processingActivityService'
import { fetchSectors } from '../api/sectorService'
import { fetchVendors } from '../api/vendorService'
import { useWorkspaces } from '../contexts/WorkspaceContext'
import { buildAdequacyPath, type LegalRegimeCode } from '../utils/adequacyPath'
import type { ActionItem } from '../types/actionItem'
import type { AdequacyConfirmation } from '../types/adequacy'
import type { ComplianceSummary } from '../types/complianceSummary'
import type { Document } from '../types/document'
import type { ProcessingActivity } from '../types/processingActivity'
import type { Sector } from '../types/sector'
import type { Vendor } from '../types/vendor'

interface PathData {
  summary: ComplianceSummary | null
  documents: Document[]
  activities: ProcessingActivity[]
  vendors: Vendor[]
  sectors: Sector[]
  actions: ActionItem[]
  confirmations: AdequacyConfirmation[]
}

const EMPTY: PathData = {
  summary: null,
  documents: [],
  activities: [],
  vendors: [],
  sectors: [],
  actions: [],
  confirmations: [],
}

function valueOf<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback
}

export function useAdequacyPath(workspaceId: string | undefined) {
  const { workspaces } = useWorkspaces()
  const [data, setData] = useState<PathData>(EMPTY)
  const [isLoading, setIsLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) return
    const results = await Promise.allSettled([
      fetchComplianceSummary(workspaceId),
      fetchDocumentsByWorkspace(workspaceId),
      fetchProcessingActivities(workspaceId),
      fetchVendors(workspaceId),
      fetchSectors(workspaceId),
      fetchActionItems(workspaceId),
      fetchAdequacyConfirmations(workspaceId),
    ])
    const [summary, documents, activities, vendors, sectors, actions, confirmations] = results
    setData({
      summary: valueOf<ComplianceSummary | null>(summary, null),
      documents: valueOf(documents, []),
      activities: valueOf(activities, []),
      vendors: valueOf(vendors, []),
      sectors: valueOf(sectors, []),
      actions: valueOf(actions, []),
      confirmations: valueOf(confirmations, []),
    })
    setFailed(results.some((r) => r.status === 'rejected'))
    setIsLoading(false)
  }, [workspaceId])

  useEffect(() => {
    setIsLoading(true)
    void load()
  }, [load])

  const regimes = useMemo<LegalRegimeCode[]>(() => {
    const workspace = workspaces.find((w) => w.id === workspaceId)
    return workspace?.legalRegimes.length ? workspace.legalRegimes : ['LGPD']
  }, [workspaces, workspaceId])

  const path = useMemo(
    () => buildAdequacyPath({ ...data, regimes, base: `/workspaces/${workspaceId}` }),
    [data, regimes, workspaceId],
  )

  return { ...data, path, regimes, isLoading, failed, reload: load }
}
