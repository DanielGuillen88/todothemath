import { extractUserId } from './extractUserId.js';

export const isProjectMember = (project, userId) => {
  if (!project || !userId) return false;

  const targetId = String(userId).trim();
  const ownerId = extractUserId(project.owner?._id || project.owner);

  if (ownerId === targetId) return true;

  if (Array.isArray(project.members)) {
    return project.members.some((m) => {
      const memberUserData = m?.user || m;
      const mId = extractUserId(memberUserData?._id || memberUserData?.id || memberUserData);
      return mId === targetId;
    });
  }

  return false;
};