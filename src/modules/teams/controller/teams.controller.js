import * as teamService from '../service/teams.service.js';

export const listTeams = async (req, res) => {
  try {
    const teams = await teamService.getAllTeams();
    res.status(200).json(teams);
  } catch (error) {
    res.status(500).json({ message: "Error al listar equipos.", error: error.message });
  }
};

export const createNewTeam = async (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: "El nombre del equipo es requerido." });
  }

  try {
    const newTeam = await teamService.createTeam(name, userId);
    res.status(201).json(newTeam);
  } catch (error) {
    if (error.message.includes("ya pertenece a un equipo")) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: "Error al crear el equipo.", error: error.message });
  }
};

export const getTeamDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const team = await teamService.getTeamById(id);
    if (!team) {
      return res.status(404).json({ message: "Equipo no encontrado." });
    }
    res.status(200).json(team);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener detalles del equipo.", error: error.message });
  }
};

export const joinTeamById = async (req, res) => {
  const { id: teamId } = req.params;
  const userId = req.user.id;
  try {
    await teamService.joinTeam(teamId, userId);
    res.status(200).json({ message: "Te has unido al equipo exitosamente." });
  } catch (error) {
    if (error.message.includes("ya pertenece a un equipo")) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: "Error al unirse al equipo.", error: error.message });
  }
};

export const leaveCurrentTeam = async (req, res) => {
  const userId = req.user.id;
  try {
    await teamService.leaveTeam(userId);
    res.status(200).json({ message: "Has abandonado el equipo exitosamente." });
  } catch (error) {
    if (error.message.includes("no pertenece a ningún equipo")) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Error al abandonar el equipo.", error: error.message });
  }
};