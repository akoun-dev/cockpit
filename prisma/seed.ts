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

  const djmgDept = await prisma.department.upsert({
    where: { name: 'Direction Juridique et des Moyens Généraux' },
    update: {},
    create: { name: 'Direction Juridique et des Moyens Généraux', code: 'DJMG', headName: 'Directeur Juridique et des Moyens Généraux' },
  });

  const dfcDept = await prisma.department.upsert({
    where: { name: 'Direction des Finances et Comptabilité' },
    update: {},
    create: { name: 'Direction des Finances et Comptabilité', code: 'DFC', headName: 'Directeur des Finances et Comptabilité' },
  });

  const ddirDept = await prisma.department.upsert({
    where: { name: 'Direction du Développement des Infrastructures et du RNHD' },
    update: {},
    create: { name: 'Direction du Développement des Infrastructures et du RNHD', code: 'DDIR', headName: 'Directeur du Développement des Infrastructures et du RNHD' },
  });

  const rdrhfDept = await prisma.department.upsert({
    where: { name: 'Département Ressources Humaines et Formation' },
    update: {},
    create: { name: 'Département Ressources Humaines et Formation', code: 'RDRHF', headName: 'Responsable du Département RH et Formation' },
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
      description: 'Accès à tous les modules métier : Accueil, Gouvernance, Finance, Opérationnel, RH, Risque, PTA',
      level: 90,
      color: '#f18120',
      isSystem: true,
    },
  });

  const pmoRole = await prisma.role.upsert({
    where: { name: 'pmo' },
    update: {},
    create: {
      name: 'pmo',
      label: 'Bureau de Projets (PMO)',
      description: 'Accès à tous les modules métier : Accueil, Gouvernance, Finance, Opérationnel, RH, Risque, PTA',
      level: 80,
      color: '#0891b2',
      isSystem: true,
    },
  });

  const ctRole = await prisma.role.upsert({
    where: { name: 'ct' },
    update: {},
    create: {
      name: 'ct',
      label: 'Conseiller Technique (CT)',
      description: 'Accès à tous les modules métier : Accueil, Gouvernance, Finance, Opérationnel, RH, Risque, PTA',
      level: 70,
      color: '#7c3aed',
      isSystem: true,
    },
  });

  const djmgRole = await prisma.role.upsert({
    where: { name: 'djmg' },
    update: {},
    create: {
      name: 'djmg',
      label: 'Directeur Juridique et Moyens Généraux (DJMG)',
      description: 'Accès au module Gouvernance uniquement',
      level: 60,
      color: '#059669',
      isSystem: true,
    },
  });

  const dfcRole = await prisma.role.upsert({
    where: { name: 'dfc' },
    update: {},
    create: {
      name: 'dfc',
      label: 'Directeur des Finances et Comptabilité (DFC)',
      description: 'Accès au module Finance uniquement',
      level: 60,
      color: '#2563eb',
      isSystem: true,
    },
  });

  const ddirRole = await prisma.role.upsert({
    where: { name: 'ddir' },
    update: {},
    create: {
      name: 'ddir',
      label: 'Directeur du Développement des Infrastructures (DDIR)',
      description: 'Accès au module Opérationnel uniquement',
      level: 60,
      color: '#d97706',
      isSystem: true,
    },
  });

  const rdrhfRole = await prisma.role.upsert({
    where: { name: 'rdrhf' },
    update: {},
    create: {
      name: 'rdrhf',
      label: 'Responsable Département RH et Formation (RDRHF)',
      description: 'Accès au module Ressources Humaines uniquement',
      level: 60,
      color: '#e11d48',
      isSystem: true,
    },
  });

  // ─── Permissions ────────────────────────────────────────────────
  // Mapping exact per user spec:
  //   Accueil      : DG, PMO, CT
  //   Gouvernance  : DG, PMO, CT, DJMG
  //   Finance      : DG, PMO, CT, DFC
  //   Opérationnel : DG, PMO, CT, DDIR
  //   RH           : DG, PMO, CT, RDRHF
  //   Risque       : DG, PMO, CT
  //   PTA          : DG, PMO, CT
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
      accueil: 'write',
      governance: 'write',
      finance: 'write',
      operational: 'write',
      rh: 'write',
      risque: 'write',
      pta: 'write',
      admin: 'none',
    },
    pmo: {
      accueil: 'write',
      governance: 'write',
      finance: 'write',
      operational: 'write',
      rh: 'write',
      risque: 'write',
      pta: 'write',
      admin: 'none',
    },
    ct: {
      accueil: 'read',
      governance: 'read',
      finance: 'read',
      operational: 'read',
      rh: 'read',
      risque: 'read',
      pta: 'read',
      admin: 'none',
    },
    djmg: {
      accueil: 'none',
      governance: 'read',
      finance: 'none',
      operational: 'none',
      rh: 'none',
      risque: 'none',
      pta: 'none',
      admin: 'none',
    },
    dfc: {
      accueil: 'none',
      governance: 'none',
      finance: 'read',
      operational: 'none',
      rh: 'none',
      risque: 'none',
      pta: 'none',
      admin: 'none',
    },
    ddir: {
      accueil: 'none',
      governance: 'none',
      finance: 'none',
      operational: 'read',
      rh: 'none',
      risque: 'none',
      pta: 'none',
      admin: 'none',
    },
    rdrhf: {
      accueil: 'none',
      governance: 'none',
      finance: 'none',
      operational: 'none',
      rh: 'read',
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
      email: 'pmo@ansut.ci',
      name: 'Chef de Projet PMO',
      matricule: 'ANS-020',
      fonction: 'Chef de Bureau de Projets',
      roleId: pmoRole.id,
      departmentId: pmoDept.id,
    },
    {
      email: 'ct@ansut.ci',
      name: 'Conseiller Technique',
      matricule: 'ANS-030',
      fonction: 'Conseiller Technique',
      roleId: ctRole.id,
      departmentId: dga.id,
    },
    {
      email: 'djmg@ansut.ci',
      name: 'Directeur Juridique et Moyens Généraux',
      matricule: 'ANS-040',
      fonction: 'Directeur Juridique et des Moyens Généraux',
      roleId: djmgRole.id,
      departmentId: djmgDept.id,
    },
    {
      email: 'dfc@ansut.ci',
      name: 'Directeur des Finances et Comptabilité',
      matricule: 'ANS-050',
      fonction: 'Directeur des Finances et Comptabilité',
      roleId: dfcRole.id,
      departmentId: dfcDept.id,
    },
    {
      email: 'ddir@ansut.ci',
      name: 'Directeur du Développement des Infrastructures',
      matricule: 'ANS-060',
      fonction: 'Directeur du Développement des Infrastructures et du RNHD',
      roleId: ddirRole.id,
      departmentId: ddirDept.id,
    },
    {
      email: 'rdrhf@ansut.ci',
      name: 'Responsable Département RH et Formation',
      matricule: 'ANS-070',
      fonction: 'Responsable du Département Ressources Humaines et Formation',
      roleId: rdrhfRole.id,
      departmentId: rdrhfDept.id,
    },
  ];

  // Deactivate old users that are no longer needed
  // Clear their matricule to avoid unique constraint conflicts with new users
  const removedEmails = ['agent@ansut.ci', 'daf@ansut.ci', 'drh@ansut.ci', 'dco@ansut.ci'];
  for (const email of removedEmails) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({
        where: { email },
        data: { isActive: false, roleId: null, matricule: null },
      });
      console.log(`  ✗ Deactivated: ${email}`);
    }
  }

  for (const userData of usersData) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
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
  console.log('📋 Comptes utilisateurs:');
  console.log('  ┌──────────────────────┬──────────────────────────────────────────────────┬──────────────────┐');
  console.log('  │ Email                │ Rôle                                             │ Mot de passe     │');
  console.log('  ├──────────────────────┼──────────────────────────────────────────────────┼──────────────────┤');
  console.log('  │ admin@ansut.ci       │ Administrateur Système                           │ ansut2025        │');
  console.log('  │ dg@ansut.ci          │ Directeur Général                                │ ansut2025        │');
  console.log('  │ pmo@ansut.ci         │ Bureau de Projets (PMO)                          │ ansut2025        │');
  console.log('  │ ct@ansut.ci          │ Conseiller Technique (CT)                        │ ansut2025        │');
  console.log('  │ djmg@ansut.ci        │ Dir. Juridique et Moyens Généraux (DJMG)        │ ansut2025        │');
  console.log('  │ dfc@ansut.ci         │ Dir. des Finances et Comptabilité (DFC)          │ ansut2025        │');
  console.log('  │ ddir@ansut.ci        │ Dir. du Dév. des Infrastructures et du RNHD     │ ansut2025        │');
  console.log('  │ rdrhf@ansut.ci       │ Resp. Dépt. RH et Formation (RDRHF)             │ ansut2025        │');
  console.log('  └──────────────────────┴──────────────────────────────────────────────────┴──────────────────┘');
  console.log('');
  console.log('🔐 Accès par module:');
  console.log('  ┌────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐');
  console.log('  │ Module         │  DG  │ PMO  │  CT  │ DJMG │ DFC  │ DDIR │ RDRHF│');
  console.log('  ├────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤');
  console.log('  │ Accueil        │  ✅  │  ✅  │  ✅  │  ❌  │  ❌  │  ❌  │  ❌  │');
  console.log('  │ Gouvernance    │  ✅  │  ✅  │  ✅  │  ✅  │  ❌  │  ❌  │  ❌  │');
  console.log('  │ Finance        │  ✅  │  ✅  │  ✅  │  ❌  │  ✅  │  ❌  │  ❌  │');
  console.log('  │ Opérationnel   │  ✅  │  ✅  │  ✅  │  ❌  │  ❌  │  ✅  │  ❌  │');
  console.log('  │ RH             │  ✅  │  ✅  │  ✅  │  ❌  │  ❌  │  ❌  │  ✅  │');
  console.log('  │ Risque         │  ✅  │  ✅  │  ✅  │  ❌  │  ❌  │  ❌  │  ❌  │');
  console.log('  │ PTA            │  ✅  │  ✅  │  ✅  │  ❌  │  ❌  │  ❌  │  ❌  │');
  console.log('  └────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });