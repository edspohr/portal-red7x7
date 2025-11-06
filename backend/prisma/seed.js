import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma.js';

const seed = async () => {
  await prisma.contactRequest.deleteMany();
  await prisma.meetingParticipant.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('changeme123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Ana Admin',
      email: 'admin@red7x7.cl',
      passwordHash: password,
      role: 'ADMIN',
      membership: 'PRO',
      company: 'Red7x7',
      position: 'Directora',
      phone: '+56911111111',
    },
  });

  const pro = await prisma.user.create({
    data: {
      name: 'Pedro Pro',
      email: 'pro@red7x7.cl',
      passwordHash: password,
      role: 'PRO',
      membership: 'PRO',
      company: 'Innovar SpA',
      position: 'Gerente',
      phone: '+56922222222',
    },
  });

  const member = await prisma.user.create({
    data: {
      name: 'Maria Socia',
      email: 'maria@red7x7.cl',
      passwordHash: password,
      role: 'MEMBER',
      membership: 'SOCIO7X7',
      company: 'StartUp XYZ',
      position: 'Fundadora',
      phone: '+56933333333',
    },
  });

  await prisma.announcement.createMany({
    data: [
      {
        content: 'Bienvenidos al nuevo portal Red7x7. Recuerden revisar los anuncios todas las mañanas.',
        pinned: true,
        authorId: admin.id,
      },
      {
        content: 'El próximo desayuno de networking será el martes a las 09:00 hrs.',
        pinned: false,
        authorId: admin.id,
      },
    ],
  });

  const meeting = await prisma.meeting.create({
    data: {
      title: 'Reunión de lanzamiento',
      agenda: 'Repasar funcionalidades del portal y próximos pasos',
      summary: 'Se alinearon expectativas para el lanzamiento del portal Red7x7.',
      scheduledAt: new Date(),
      createdById: admin.id,
      participants: {
        create: [{ userId: pro.id }, { userId: member.id }],
      },
    },
  });

  await prisma.contactRequest.create({
    data: {
      requesterId: pro.id,
      targetId: member.id,
      status: 'APPROVED',
      resolvedAt: new Date(),
    },
  });

  console.log('Seed completado:', { admin: admin.email, pro: pro.email, member: member.email, meeting: meeting.id });
};

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
