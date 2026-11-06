import { useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import { useWorkspaces } from "../contexts/WorkspaceContext";

// A navegacao agora fica toda no menu lateral. Este layout so mantem a
// unidade da URL sincronizada com a unidade selecionada no menu.
export function WorkspaceLayout() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { selectWorkspace } = useWorkspaces();

  useEffect(() => {
    if (workspaceId) selectWorkspace(workspaceId);
  }, [workspaceId, selectWorkspace]);

  return <Outlet />;
}
