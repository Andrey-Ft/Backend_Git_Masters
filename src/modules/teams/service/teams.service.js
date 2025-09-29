import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getAllTeams = async () => {
  return prisma.team.findMany({
    include: {
      members: {
        select: { id: true, username: true, avatarUrl: true },
      },
      _count: {
        select: { members: true },
      }
    },
  });
};

export const createTeam = async (teamName, userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { teamId: true },
  });

  if (user.teamId) {
    throw new Error("El usuario ya pertenece a un equipo.");
  }

  return prisma.team.create({
    data: {
      name: teamName,
      members: {
        connect: { id: userId },
      },
    },
  });
};

export const getTeamById = async (teamId) => {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        select: { id: true, username: true, avatarUrl: true, pointsBalance: true },
      },
    },
  });
};

export const joinTeam = async (teamId, userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { teamId: true },
  });

  if (user.teamId) {
    throw new Error("El usuario ya pertenece a un equipo y no puede unirse a otro.");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { teamId: teamId },
  });
};

export const leaveTeam = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { teamId: true },
  });

  if (!user.teamId) {
    throw new Error("El usuario no pertenece a ningún equipo.");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { teamId: null },
  });
};