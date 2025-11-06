import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';

export const listDirectory = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        position: true,
        phone: true,
        role: true,
        membership: true,
      },
      orderBy: { name: 'asc' },
    });

    return res.json(users);
  } catch (error) {
    return next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, company, position, phone, role = 'MEMBER', membership = 'SOCIO7X7' } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'El correo ya está registrado' });
    }

    const temporaryPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        company,
        position,
        phone,
        role,
        membership,
      },
    });

    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      membership: user.membership,
      company: user.company,
      position: user.position,
      phone: user.phone,
      temporaryPassword,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, company, position, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        company,
        position,
        phone,
      },
    });

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      membership: user.membership,
      company: user.company,
      position: user.position,
      phone: user.phone,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { role, membership } = req.body;

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { role, membership },
    });

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      membership: user.membership,
      company: user.company,
      position: user.position,
      phone: user.phone,
    });
  } catch (error) {
    return next(error);
  }
};
