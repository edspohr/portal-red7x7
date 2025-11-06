import { validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { summarizeMeetingNotes } from '../services/geminiService.js';

const includeMeeting = {
  include: {
    participants: {
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, membership: true },
        },
      },
    },
    createdBy: {
      select: { id: true, name: true, email: true },
    },
  },
};

const sanitizeMeeting = (meeting) => ({
  ...meeting,
  participants: meeting.participants.map((participant) => ({
    id: participant.id,
    status: participant.status,
    user: participant.user,
  })),
});

export const listMeetings = async (req, res, next) => {
  try {
    const whereClause = req.user.role === 'ADMIN'
      ? {}
      : {
          OR: [
            { createdById: req.user.id },
            { participants: { some: { userId: req.user.id } } },
          ],
        };

    const meetings = await prisma.meeting.findMany({
      where: whereClause,
      orderBy: { scheduledAt: 'desc' },
      ...includeMeeting,
    });

    return res.json(meetings.map(sanitizeMeeting));
  } catch (error) {
    return next(error);
  }
};

export const getMeeting = async (req, res, next) => {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: Number(req.params.id) },
      ...includeMeeting,
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Reunión no encontrada' });
    }

    const canView =
      req.user.role === 'ADMIN' ||
      meeting.createdById === req.user.id ||
      meeting.participants.some((participant) => participant.userId === req.user.id);

    if (!canView) {
      return res.status(403).json({ message: 'No tienes acceso a esta reunión' });
    }

    return res.json(sanitizeMeeting(meeting));
  } catch (error) {
    return next(error);
  }
};

export const createMeeting = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, agenda, summary, scheduledAt, participantIds } = req.body;

    const meeting = await prisma.meeting.create({
      data: {
        title,
        agenda,
        summary,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdById: req.user.id,
        participants: {
          create: (participantIds || []).map((userId) => ({ userId })),
        },
      },
      ...includeMeeting,
    });

    return res.status(201).json(sanitizeMeeting(meeting));
  } catch (error) {
    return next(error);
  }
};

export const updateMeeting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, agenda, summary, scheduledAt, participantIds } = req.body;

    const existingMeeting = await prisma.meeting.findUnique({ where: { id: Number(id) } });

    if (!existingMeeting) {
      return res.status(404).json({ message: 'Reunión no encontrada' });
    }

    if (req.user.role !== 'ADMIN' && existingMeeting.createdById !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permisos para editar la reunión' });
    }

    const meeting = await prisma.meeting.update({
      where: { id: Number(id) },
      data: {
        title: title ?? existingMeeting.title,
        agenda: agenda ?? existingMeeting.agenda,
        summary: summary ?? existingMeeting.summary,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : existingMeeting.scheduledAt,
        participants: participantIds
          ? {
              deleteMany: {},
              create: participantIds.map((userId) => ({ userId })),
            }
          : undefined,
      },
      ...includeMeeting,
    });

    return res.json(sanitizeMeeting(meeting));
  } catch (error) {
    return next(error);
  }
};

export const summarizeMeeting = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { notes } = req.body;
    const aiSummary = await summarizeMeetingNotes(notes);

    return res.json(aiSummary);
  } catch (error) {
    return next(error);
  }
};
