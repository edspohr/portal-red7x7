import { validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';

export const listAnnouncements = async (req, res, next) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: [
        { pinned: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.json(announcements);
  } catch (error) {
    return next(error);
  }
};

export const createAnnouncement = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, pinned } = req.body;

    const announcement = await prisma.announcement.create({
      data: {
        content,
        pinned: Boolean(pinned),
        authorId: req.user.id,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.status(201).json(announcement);
  } catch (error) {
    return next(error);
  }
};

export const updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, pinned } = req.body;

    const existing = await prisma.announcement.findUnique({ where: { id: Number(id) } });

    if (!existing) {
      return res.status(404).json({ message: 'Anuncio no encontrado' });
    }

    const announcement = await prisma.announcement.update({
      where: { id: Number(id) },
      data: {
        content: content ?? existing.content,
        pinned: typeof pinned === 'boolean' ? pinned : existing.pinned,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.json(announcement);
  } catch (error) {
    return next(error);
  }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.announcement.delete({ where: { id: Number(id) } });

    return res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Anuncio no encontrado' });
    }
    return next(error);
  }
};
