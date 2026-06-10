/**
 * Seed script — ANSUT Cockpit DG : comptes acteurs
 *
 * Crée les rôles, départements et comptes utilisateurs standards
 * pour l'Agence Nationale des Services Universels des Télécommunications/TIC.
 *
 * Usage:  bun run prisma/seed-actors.ts
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ─── Types ──────────────────────────────────────────────────────────

interface ActorDef {
  email: string
  name: string
  matricule: string
  fonction: string
  password: string
  roleName: string
  roleLabel: string
  roleLevel: number
  roleColor: string
  roleDescription: string
  deptName: string
  deptCode: string
}

// ─── Actor definitions ──────────────────────────────────────────────

const ACTORS: ActorDef[] = [
  // 1. Directeur Général — Chef suprême de l'ANANsUT
  {
    email: 'dg@ansut.ci',
    name: 'M. Konaté Seydou',
    matricule: 'ANSUT-DG-001',
    fonction: 'Directeur Général',
    password: 'ansut2025',
    roleName: 'DG',
    roleLabel: 'Directeur Général',
    roleLevel: 90,
    roleColor: '#f18120',
    roleDescription: 'Accès complet au cockpit — vue consolidée de tous les indicateurs et modules',
    deptName: 'Direction Générale',
    deptCode: 'DG',
  },

  // 2. Bureau PMO — Planification, Monitoring, Évaluation
  {
    email: 'pmo@ansut.ci',
    name: 'Mme Sanogo Mariam',
    matricule: 'ANSUT-PMO-001',
    fonction: 'Chef de Bureau PMO',
    password: 'ansut2025',
    roleName: 'PMO',
    roleLabel: 'Bureau PMO',
    roleLevel: 60,
    roleColor: '#7c3aed',
    roleDescription: 'Gestion des projets PTA, suivi des indicateurs de performance',
    deptName: 'Bureau du PMO',
    deptCode: 'PMO',
  },

  // 3. Chef de Département Technique
  {
    email: 'dt@ansut.ci',
    name: 'M. Diallo Mamadou',
    matricule: 'ANSUT-DT-001',
    fonction: 'Directeur Technique',
    password: 'ansut2025',
    roleName: 'CT',
    roleLabel: 'Chef de Département Technique',
    roleLevel: 60,
    roleColor: '#059669',
    roleDescription: 'Supervision des projets techniques, déploiement réseau, indicateurs opérationnels',
    deptName: 'Direction Technique',
    deptCode: 'DT',
  },

  // 4. Directeur des Systèmes d'Information et de la Sécurité
  {
    email: 'dsis@ansut.ci',
    name: 'M. Bamba Koffi',
    matricule: 'ANSUT-DSIS-001',
    fonction: 'Directeur des Systèmes d\'Information et de la Sécurité',
    password: 'ansut2025',
    roleName: 'DSIS',
    roleLabel: 'Directeur SI & Sécurité',
    roleLevel: 70,
    roleColor: '#2563eb',
    roleDescription: 'Administration système, sécurité informatique, gestion des données',
    deptName: 'Direction des Systèmes d\'Information et de la Sécurité',
    deptCode: 'DSIS',
  },

  // 5. Directeur de la Direction Interne
  {
    email: 'ddir@ansut.ci',
    name: 'Mme Ouattara Adjoua',
    matricule: 'ANSUT-DDIR-001',
    fonction: 'Directrice de la Direction Interne',
    password: 'ansut2025',
    roleName: 'DDIR',
    roleLabel: 'Directeur Direction Interne',
    roleLevel: 55,
    roleColor: '#d97706',
    roleDescription: 'Gestion administrative, logistique, affaires générales',
    deptName: 'Direction Interne',
    deptCode: 'DDIR',
  },

  // 6. Directeur Juridique et de la Gestion des Marchés
  {
    email: 'djmg@ansut.ci',
    name: 'M. Touré Moussa',
    matricule: 'ANSUT-DJMG-001',
    fonction: 'Directeur Juridique et des Marchés',
    password: 'ansut2025',
    roleName: 'DJMG',
    roleLabel: 'Directeur Juridique & Marchés',
    roleLevel: 55,
    roleColor: '#dc2626',
    roleDescription: 'Conseil juridique, gestion des marchés publics, conformité réglementaire',
    deptName: 'Direction Juridique et des Marchés',
    deptCode: 'DJMG',
  },

  // 7. Responsable du Développement des RH et de la Formation
  {
    email: 'rdrhf@ansut.ci',
    name: 'Mme Koné Fatoumata',
    matricule: 'ANSUT-RDRHF-001',
    fonction: 'Responsable Développement RH & Formation',
    password: 'ansut2025',
    roleName: 'RDRHF',
    roleLabel: 'Resp. Dév. RH & Formation',
    roleLevel: 45,
    roleColor: '#0891b2',
    roleDescription: 'Formation du personnel, développement des compétences, gestion des carrières',
    deptName: 'Direction des Ressources Humaines',
    deptCode: 'DRH',
  },

  // 8. Directeur Financier et Comptable
  {
    email: 'dfc@ansut.ci',
    name: 'M. Koné Ibrahim',
    matricule: 'ANSUT-DFC-001',
    fonction: 'Directeur Financier et Comptable',
    password: 'ansut2025',
    roleName: 'DFC',
    roleLabel: 'Directeur Financier',
    roleLevel: 55,
    roleColor: '#16a34a',
    roleDescription: 'Gestion financière, comptabilité, budget, indicateurs financiers',
    deptName: 'Direction Financière et Comptable',
    deptCode: 'DFC',
  },

  // 9. Directrice des Ressources Humaines
  {
    email: 'drh@ansut.ci',
    name: 'Mme Traoré Awa',
    matricule: 'ANSUT-DRH-001',
    fonction: 'Directrice des Ressources Humaines',
    password: 'ansut2025',
    roleName: 'DRH',
    roleLabel: 'Directeur RH',
    roleLevel: 55,
    roleColor: '#e11d48',
    roleDescription: 'Gestion du personnel, recrutement, paie, administration RH',
    deptName: 'Direction des Ressources Humaines',
    deptCode: 'DRH',
  },

  // 10. Administrateur Système
  {
    email: 'admin@ansut.ci',
    name: 'M. N\'Guessan Aymar',
    matricule: 'ANSUT-ADM-001',
    fonction: 'Administrateur Système',
    password: 'ansut2025',
    roleName: 'ADMIN',
    roleLabel: 'Administrateur Système',
    roleLevel: 100,
    roleColor: '#1c55a3',
    roleDescription: 'Administration complète du système, gestion des utilisateurs et paramètres',
    deptName: 'Service Informatique',
    deptCode: 'SI',
  },

  // 11. Agent de Saisie
  {
    email: 'agent@ansut.ci',
    name: 'M. Coulibaly Moussa',
    matricule: 'ANSUT-SI-002',
    fonction: 'Agent de Saisie',
    password: 'ansut2025',
    roleName: 'AGENT',
    roleLabel: 'Agent',
    roleLevel: 10,
    roleColor: '#6b7280',
    roleDescription: 'Saisie de données, accès limité aux modules autorisés',
    deptName: 'Service Informatique',
    deptCode: 'SI',
  },
]

// ─── Main seed logic ────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding ANSUT actor accounts...\n')

  let createdRoles = 0
  let updatedRoles = 0
  let createdDepts = 0
  let createdUsers = 0
  let updatedUsers = 0

  for (const actor of ACTORS) {
    // 1. Upsert Department
    const dept = await db.department.upsert({
      where: { name: actor.deptName },
      update: { code: actor.deptCode },
      create: {
        name: actor.deptName,
        code: actor.deptCode,
        headName: actor.name,
      },
    })
    if (dept.createdAt.getTime() > Date.now() - 5000) {
      createdDepts++
    }
    console.log(`  📁 Dept: ${actor.deptName} (${actor.deptCode})`)

    // 2. Upsert Role
    const role = await db.role.upsert({
      where: { name: actor.roleName },
      update: {
        label: actor.roleLabel,
        description: actor.roleDescription,
        level: actor.roleLevel,
        color: actor.roleColor,
        isSystem: actor.roleLevel >= 50,
      },
      create: {
        name: actor.roleName,
        label: actor.roleLabel,
        description: actor.roleDescription,
        level: actor.roleLevel,
        color: actor.roleColor,
        isSystem: actor.roleLevel >= 50,
      },
    })
    if (role.createdAt.getTime() > Date.now() - 5000) {
      createdRoles++
    } else {
      updatedRoles++
    }
    console.log(`  🔑 Role: ${actor.roleLabel} (level ${actor.roleLevel})`)

    // 3. Upsert User
    const user = await db.user.upsert({
      where: { email: actor.email },
      update: {
        name: actor.name,
        matricule: actor.matricule,
        fonction: actor.fonction,
        roleId: role.id,
        departmentId: dept.id,
        isActive: true,
      },
      create: {
        email: actor.email,
        name: actor.name,
        matricule: actor.matricule,
        fonction: actor.fonction,
        password: actor.password,
        roleId: role.id,
        departmentId: dept.id,
        isActive: true,
      },
    })
    if (user.createdAt.getTime() > Date.now() - 5000) {
      createdUsers++
    } else {
      updatedUsers++
    }
    console.log(`  👤 User: ${actor.email} → ${actor.name} (${actor.fonction})\n`)
  }

  // ─── Summary ──────────────────────────────────────────────────────

  console.log('═'.repeat(55))
  console.log('  ✅ Seed completed successfully!')
  console.log('═'.repeat(55))
  console.log(`  📁 Departments created : ${createdDepts}`)
  console.log(`  🔑 Roles created       : ${createdRoles}`)
  console.log(`  🔑 Roles updated       : ${updatedRoles}`)
  console.log(`  👤 Users created       : ${createdUsers}`)
  console.log(`  👤 Users updated       : ${updatedUsers}`)
  console.log('═'.repeat(55))

  // Verify
  const totalUsers = await db.user.count()
  const totalRoles = await db.role.count()
  const totalDepts = await db.department.count()
  console.log(`\n📊 Database totals: ${totalUsers} users, ${totalRoles} roles, ${totalDepts} departments`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })