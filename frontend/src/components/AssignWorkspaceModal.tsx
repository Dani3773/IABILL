import { useEffect, useState } from "react";
import { X, Building2 } from "lucide-react";
import { fetchWorkspaces } from "../api/workspaceService";
import { addUserToWorkspace, fetchUserWorkspaces } from "../api/userService";
import type { Workspace } from "../types/workspace";
import type { WorkspaceMembership } from "../types/user";
import { getErrorMessage } from "../api/errorUtils";

import { tr } from '../i18n/tr'
interface Props {
  userId: string;
  username: string;
  onClose: () => void;
}

export function AssignWorkspaceModal({ userId, username, onClose }: Props) {
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([]);
  const [memberships, setMemberships] = useState<WorkspaceMembership[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    Promise.all([fetchWorkspaces(), fetchUserWorkspaces(userId)]).then(
      ([workspaces, userMemberships]) => {
        setAllWorkspaces(workspaces);
        setMemberships(userMemberships);
        const available = workspaces.find(
          (w) => !userMemberships.some((m) => m.workspaceId === w.id),
        );
        if (available) setSelectedWorkspaceId(available.id);
      },
    );
  }, [userId]);

  const availableWorkspaces = allWorkspaces.filter(
    (w) => !memberships.some((m) => m.workspaceId === w.id),
  );

  async function handleAssign() {
    if (!selectedWorkspaceId) return;
    setError(null);
    setIsLoading(true);
    try {
      await addUserToWorkspace(userId, selectedWorkspaceId);
      const updated = await fetchUserWorkspaces(userId);
      setMemberships(updated);
      const nextAvailable = allWorkspaces.find(
        (w) => !updated.some((m) => m.workspaceId === w.id),
      );
      setSelectedWorkspaceId(nextAvailable?.id ?? "");
    } catch (err) {
      setError(getErrorMessage(err, tr('Não foi possível vincular a unidade.')));
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg bg-[#fbfaf6] text-[#0A0A0A] text-sm px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/30 focus:border-[#0A0A0A]";

  return (
    <div className="fixed inset-0 bg-[#0A0A0A]/40 flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl border border-[#0A0A0A]/10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D92B21]/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-[#B4201A]" />
            </div>
            <h2 className="text-lg text-[#0A0A0A]">{tr('Unidades de')}{' '}{username}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#0A0A0A]/40 hover:text-[#0A0A0A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-xs font-medium text-[#0A0A0A]/60 mb-2">{tr('Já vinculado a:')}</p>
          {memberships.length === 0 ? (
            <p className="text-sm text-[#0A0A0A]/40">{tr('Nenhuma unidade ainda.')}</p>
          ) : (
            <ul className="space-y-1.5">
              {memberships.map((m) => (
                <li
                  key={m.workspaceId}
                  className="text-sm text-[#0A0A0A] bg-[#fbfaf6] rounded-lg px-3 py-2"
                >
                  {m.workspaceName}{" "}
                  <span className="text-[#0A0A0A]/45">({m.workspaceType})</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {availableWorkspaces.length > 0 && (
          <div className="border-t border-[#0A0A0A]/10 pt-4">
            <label className="block text-xs font-medium text-[#0A0A0A]/60 mb-1.5">{tr('Vincular a uma nova unidade')}</label>
            <div className="flex gap-2">
              <select
                value={selectedWorkspaceId}
                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                className={inputClass}
              >
                {availableWorkspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssign}
                disabled={isLoading}
                className="bg-[#D92B21] hover:bg-[#B4201A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors shrink-0"
              >{tr('Vincular')}</button>
            </div>
          </div>
        )}

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </div>
    </div>
  );
}