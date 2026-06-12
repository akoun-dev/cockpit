import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding ANSUT Cockpit DG...\n');

  // ─── Departments ────────────────────────────────────────────────
  console.log('Creating departments...');
  const dga = await prisma.department.upsert({
    where: { name: 'Direction Générale' },
    update: {},
    create: { name: 'Direction Générale', code: 'DG', headName: 'Directeur Général' },
  });

  const dafDept = await prisma.department.upsert({
    where: { name: 'Direction Financière et Comptable' },
    update: {},
    create: { name: 'Direction Financière et Comptable', code: 'DAF', headName: 'Directeur Financier' },
  });

  const drhDept = await prisma.department.upsert({
    where: { name: 'Direction des Ressources Humaines' },
    update: {},
    create: { name: 'Direction des Ressources Humaines', code: 'DRH', headName: 'Directeur des RH' },
  });

  const dcoDept = await prisma.department.upsert({
    where: { name: 'Direction des Opérations' },
    update: {},
    create: { name: 'Direction des Opérations', code: 'DCO', headName: 'Directeur des Opérations' },
  });

  const pmoDept = await prisma.department.upsert({
    where: { name: 'Bureau de Projets (PMO)' },
    update: {},
    create: { name: 'Bureau de Projets (PMO)', code: 'PMO', headName: 'Chef de Projet' },
  });

  // ─── Roles ──────────────────────────────────────────────────────
  console.log('Creating roles...');

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      label: 'Administrateur Système',
      description: 'Accès complet à toutes les fonctionnalités y compris l\'administration',
      level: 100,
      color: '#dc2626',
      isSystem: true,
    },
  });

  const dgRole = await prisma.role.upsert({
    where: { name: 'dg' },
    update: {},
    create: {
      name: 'dg',
      label: 'Directeur Général',
      description: 'Accès complet à tous les modules métier (sauf admin)',
      level: 90,
      color: '#f18120',
      isSystem: true,
    },
  });

  const dafRole = await prisma.role.upsert({
    where: { name: 'daf' },
    update: {},
    create: {
      name: 'daf',
      label: 'Directeur Financier (DAF)',
      description: 'Accès principal aux modules Finance et Gouvernance',
      level: 70,
      color: '#059669',
      isSystem: true,
    },
  });

  const drhRole = await prisma.role.upsert({
    where: { name: 'drh' },
    update: {},
    create: {
      name: 'drh',
      label: 'Directeur des RH (DRH)',
      description: 'Accès principal aux modules RH et Gouvernance',
      level: 70,
      color: '#d97706',
      isSystem: true,
    },
  });

  const dcoRole = await prisma.role.upsert({
    where: { name: 'dco' },
    update: {},
    create: {
      name: 'dco',
      label: 'Directeur des Opérations (DCO)',
      description: 'Accès principal aux modules Opérationnel et Risque',
      level: 70,
      color: '#7c3aed',
      isSystem: true,
    },
  });

  const pmoRole = await prisma.role.upsert({
    where: { name: 'pmo' },
    update: {},
    create: {
      name: 'pmo',
      label: 'Chef de Projet (PMO)',
      description: 'Accès aux modules PTA, Gouvernance et Opérationnel',
      level: 60,
      color: '#0891b2',
      isSystem: true,
    },
  });

  const agentRole = await prisma.role.upsert({
    where: { name: 'agent' },
    update: {},
    create: {
      name: 'agent',
      label: 'Agent',
      description: 'Accès limité en lecture seule aux modules essentiels',
      level: 10,
      color: '#6b7280',
      isSystem: true,
    },
  });

  // ─── Permissions ────────────────────────────────────────────────
  console.log('Setting up permissions...');

  const modules = ['accueil', 'governance', 'finance', 'operational', 'rh', 'risque', 'pta', 'admin'];

  const rolePermissions: Record<string, Record<string, string>> = {
    admin: {
      accueil: 'admin',
      governance: 'admin',
      finance: 'admin',
      operational: 'admin',
      rh: 'admin',
      risque: 'admin',
      pta: 'admin',
      admin: 'admin',
    },
    dg: {
      accueil: 'admin',
      governance: 'admin',
      finance: 'write',
      operational: 'write',
      rh: 'write',
      risque: 'write',
      pta: 'write',
      admin: 'none',
    },
    daf: {
      accueil: 'read',
      governance: 'read',
      finance: 'admin',
      operational: 'read',
      rh: 'read',
      risque: 'read',
      pta: 'read',
      admin: 'none',
    },
    drh: {
      accueil: 'read',
      governance: 'read',
      finance: 'read',
      operational: 'read',
      rh: 'admin',
      risque: 'read',
      pta: 'read',
      admin: 'none',
    },
    dco: {
      accueil: 'read',
      governance: 'read',
      finance: 'read',
      operational: 'admin',
      rh: 'read',
      risque: 'admin',
      pta: 'write',
      admin: 'none',
    },
    pmo: {
      accueil: 'read',
      governance: 'write',
      finance: 'read',
      operational: 'write',
      rh: 'none',
      risque: 'read',
      pta: 'admin',
      admin: 'none',
    },
    agent: {
      accueil: 'read',
      governance: 'read',
      finance: 'read',
      operational: 'none',
      rh: 'none',
      risque: 'none',
      pta: 'none',
      admin: 'none',
    },
  };

  for (const [roleName, perms] of Object.entries(rolePermissions)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;

    for (const mod of modules) {
      const access = perms[mod];
      await prisma.permission.upsert({
        where: {
          roleId_module: { roleId: role.id, module: mod },
        },
        update: { access },
        create: { roleId: role.id, module: mod, access },
      });
    }
  }

  // ─── Users ──────────────────────────────────────────────────────
  console.log('Creating users...');

  const defaultPassword = await hash('ansut2025', 12);

  const usersData = [
    {
      email: 'admin@ansut.ci',
      name: 'Administrateur Système',
      matricule: 'ANS-001',
      fonction: 'Administrateur Système',
      roleId: adminRole.id,
      departmentId: dga.id,
    },
    {
      email: 'dg@ansut.ci',
      name: 'Directeur Général',
      matricule: 'ANS-010',
      fonction: 'Directeur Général',
      roleId: dgRole.id,
      departmentId: dga.id,
    },
    {
      email: 'daf@ansut.ci',
      name: 'Directeur Financier',
      matricule: 'ANS-020',
      fonction: 'Directeur Financier et Comptable',
      roleId: dafRole.id,
      departmentId: dafDept.id,
    },
    {
      email: 'drh@ansut.ci',
      name: 'Directeur des Ressources Humaines',
      matricule: 'ANS-030',
      fonction: 'Directeur des Ressources Humaines',
      roleId: drhRole.id,
      departmentId: drhDept.id,
    },
    {
      email: 'dco@ansut.ci',
      name: 'Directeur des Opérations',
      matricule: 'ANS-040',
      fonction: 'Directeur des Opérations',
      roleId: dcoRole.id,
      departmentId: dcoDept.id,
    },
    {
      email: 'pmo@ansut.ci',
      name: 'Chef de Projet PMO',
      matricule: 'ANS-050',
      fonction: 'Chef de Bureau de Projets',
      roleId: pmoRole.id,
      departmentId: pmoDept.id,
    },
    {
      email: 'agent@ansut.ci',
      name: 'Agent de Saisie',
      matricule: 'ANS-100',
      fonction: 'Agent',
      roleId: agentRole.id,
      departmentId: dafDept.id,
    },
  ];

  for (const userData of usersData) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      // Update existing user's password to hashed version and role
      await prisma.user.update({
        where: { email: userData.email },
        data: {
          password: defaultPassword,
          roleId: userData.roleId,
          departmentId: userData.departmentId,
          matricule: userData.matricule,
          fonction: userData.fonction,
          name: userData.name,
          isActive: true,
          isLocked: false,
          failedAttempts: 0,
        },
      });
      console.log(`  ✓ Updated: ${userData.email}`);
    } else {
      await prisma.user.create({
        data: {
          ...userData,
          password: defaultPassword,
          isActive: true,
        },
      });
      console.log(`  ✓ Created: ${userData.email}`);
    }
  }

  console.log('\n✅ Seed completed successfully!\n');
  console.log('📋 Default accounts:');
  console.log('  ┌─────────────────────┬──────────────────────┬──────────────────┐');
  console.log('  │ Email               │ Rôle                 │ Mot de passe     │');
  console.log('  ├─────────────────────┼──────────────────────┼──────────────────┤');
  console.log('  │ admin@ansut.ci      │ Administrateur       │ ansut2025        │');
  console.log('  │ dg@ansut.ci         │ Directeur Général    │ ansut2025        │');
  console.log('  │ daf@ansut.ci        │ Directeur Financier  │ ansut2025        │');
  console.log('  │ drh@ansut.ci        │ Directeur des RH     │ ansut2025        │');
  console.log('  │ dco@ansut.ci        │ Directeur Opérations │ ansut2025        │');
  console.log('  │ pmo@ansut.ci        │ Chef de Projet PMO   │ ansut2025        │');
  console.log('  │ agent@ansut.ci      │ Agent (lecture)      │ ansut2025        │');
  console.log('  └─────────────────────┴──────────────────────┴──────────────────┘');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });