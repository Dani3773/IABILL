import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchWorkspaces } from '../api/workspaceService'
import { useAuth } from './AuthContext'
import type { Workspace } from '../types/workspace'

export type AssistantMode = 'chat' | 'search'

interface WorkspaceContextValue {
  workspaces: Workspace[]
  isLoading: boolean
  currentWorkspaceId: string | null
  currentWorkspace: Workspace | null
  selectWorkspace: (id: string) => void
  refreshWorkspaces: () => Promise<void>
  assistantOpen: boolean
  assistantMode: AssistantMode
  pendingQuestion: string | null
  openAssistant: (mode?: AssistantMode, question?: string) => void
  closeAssistant: () => void
  setAssistantMode: (mode: AssistantMode) => void
  clearPendingQuestion: () => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined)

// A ultima unidade usada e so uma conveniencia: se o navegador bloquear o
// armazenamento, o sistema continua funcionando e abre a matriz.
function readLastWorkspace(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLastWorkspace(key: string, id: string) {
  try {
    window.localStorage.setItem(key, id)
  } catch {
    // Sem armazenamento, a escolha vale apenas para esta sessao.
  }
}

export function pickDefaultWorkspace(workspaces: Workspace[]): Workspace | null {
  return workspaces.find((w) => w.type === 'MATRIZ') ?? workspaces[0] ?? null
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { tenantId, userId } = useAuth()
  const storageKey = `iabill.lastWorkspace.${userId ?? 'anon'}`
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(tenantId))
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(() =>
    readLastWorkspace(storageKey),
  )
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('chat')
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null)

  const refreshWorkspaces = useCallback(async () => {
    if (!tenantId) return
    try {
      setWorkspaces(await fetchWorkspaces())
    } catch {
      // As telas que dependem das unidades mostram o proprio erro.
    } finally {
      setIsLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    void refreshWorkspaces()
  }, [refreshWorkspaces])

  const selectWorkspace = useCallback(
    (id: string) => {
      setCurrentWorkspaceId(id)
      writeLastWorkspace(storageKey, id)
    },
    [storageKey],
  )

  const currentWorkspace = useMemo(
    () =>
      workspaces.find((w) => w.id === currentWorkspaceId) ?? pickDefaultWorkspace(workspaces),
    [workspaces, currentWorkspaceId],
  )

  const openAssistant = useCallback((mode: AssistantMode = 'chat', question?: string) => {
    setAssistantMode(mode)
    setAssistantOpen(true)
    if (question) setPendingQuestion(question)
  }, [])

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      isLoading,
      // Sem lista carregada (super-admin vendo outra empresa), vale o id da URL.
      currentWorkspaceId: currentWorkspace?.id ?? currentWorkspaceId,
      currentWorkspace,
      selectWorkspace,
      refreshWorkspaces,
      assistantOpen,
      assistantMode,
      pendingQuestion,
      openAssistant,
      closeAssistant: () => setAssistantOpen(false),
      setAssistantMode,
      clearPendingQuestion: () => setPendingQuestion(null),
    }),
    [
      workspaces,
      isLoading,
      currentWorkspace,
      currentWorkspaceId,
      selectWorkspace,
      refreshWorkspaces,
      assistantOpen,
      assistantMode,
      pendingQuestion,
      openAssistant,
    ],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspaces() {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspaces precisa estar dentro de WorkspaceProvider')
  return context
}
