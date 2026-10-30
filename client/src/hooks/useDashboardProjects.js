import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  getProjects, 
  acceptInvitation, 
  rejectInvitation 
} from '../services/projectService';
import { extractEntityId } from '../utils/expenseHelpers';

export function useDashboardProjects(user) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [invitationActionId, setInvitationActionId] = useState(null);

  const currentUserId = String(
    user?._id || user?.id || user?.user?._id || user?.user?.id || extractEntityId(user) || ''
  ).trim();

  const currentUserEmail = String(
    user?.email || user?.user?.email || ''
  ).toLowerCase().trim();

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getProjects();
      const list = res.data?.data?.projects || res.data?.projects || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error cargando proyectos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const { pendingInvitations, activeProjects } = useMemo(() => {
    const pending = [];
    const active = [];

    projects.forEach((p) => {
      const ownerId = String(p.owner?._id || p.owner?.id || p.owner || '').trim();
      const ownerEmail = String(p.owner?.email || '').toLowerCase().trim();

      const isOwner = Boolean(
        (currentUserId && ownerId && currentUserId === ownerId) ||
        (currentUserEmail && ownerEmail && currentUserEmail === ownerEmail)
      );

      if (isOwner) {
        active.push(p);
        return;
      }

      const myMemberEntry = Array.isArray(p.members)
        ? p.members.find((m) => {
            const mUser = m?.user || m;
            const mId = String(mUser?._id || mUser?.id || mUser || '').trim();
            const mEmail = String(mUser?.email || '').toLowerCase().trim();
            return (
              (currentUserId && mId && currentUserId === mId) ||
              (currentUserEmail && mEmail && currentUserEmail === mEmail)
            );
          })
        : null;

      if (myMemberEntry && myMemberEntry.status === 'pending') {
        pending.push(p);
      } else {
        active.push(p);
      }
    });

    return { pendingInvitations: pending, activeProjects: active };
  }, [projects, currentUserId, currentUserEmail]);

  const handleAcceptInvite = async (projectId) => {
    setInvitationActionId(projectId);
    try {
      await acceptInvitation(projectId);
      await fetchProjects();
      setToastMessage('✅ Te has unido al proyecto');
    } catch (err) {
      console.error('Error al aceptar invitación:', err);
    } finally {
      setInvitationActionId(null);
    }
  };

  const handleRejectInvite = async (projectId) => {
    setInvitationActionId(projectId);
    try {
      await rejectInvitation(projectId);
      await fetchProjects();
      setToastMessage('Invitación rechazada');
    } catch (err) {
      console.error('Error al rechazar invitación:', err);
    } finally {
      setInvitationActionId(null);
    }
  };

  const removeProjectFromList = (deletedId) => {
    setProjects((prev) => prev.filter((p) => String(p._id || p.id) !== String(deletedId)));
  };

  return {
    projects,
    loading,
    pendingInvitations,
    activeProjects,
    toastMessage,
    setToastMessage,
    invitationActionId,
    fetchProjects,
    handleAcceptInvite,
    handleRejectInvite,
    removeProjectFromList,
  };
}