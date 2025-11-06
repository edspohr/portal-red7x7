import { validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';

export const listRequests = async (req, res, next) => {
  try {
    const requests = await prisma.contactRequest.findMany({
      where: {
        OR: [
          { requesterId: req.user.id },
          { targetId: req.user.id },
        ],
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        target: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(requests);
  } catch (error) {
    return next(error);
  }
};

export const createRequest = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { targetId } = req.body;
    const numericTargetId = Number(targetId);

    if (Number.isNaN(numericTargetId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    if (numericTargetId === req.user.id) {
      return res.status(400).json({ message: 'No puedes solicitar tus propios datos' });
    }

    const existing = await prisma.contactRequest.findFirst({
      where: {
        requesterId: req.user.id,
        targetId: numericTargetId,
        status: 'PENDING',
      },
    });

    if (existing) {
      return res.status(409).json({ message: 'Ya existe una solicitud pendiente' });
    }

    const request = await prisma.contactRequest.create({
      data: {
        requesterId: req.user.id,
        targetId: numericTargetId,
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        target: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    return res.status(201).json(request);
  } catch (error) {
    return next(error);
  }
};

export const updateRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const request = await prisma.contactRequest.findUnique({ where: { id: Number(id) } });

    if (!request) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    if (req.user.role !== 'ADMIN' && request.targetId !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permisos para actualizar esta solicitud' });
    }

    const updated = await prisma.contactRequest.update({
      where: { id: Number(id) },
      data: {
        status,
        resolvedAt: status !== 'PENDING' ? new Date() : null,
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        target: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
};
