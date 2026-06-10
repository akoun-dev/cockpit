/**
 * Script — Marquer les 43 KPIs du Lot 1 comme prioritaires (isPriority = true)
 *
 * Source: KPMG — Présentation des indicateurs proposés pour le Lot 1 (7 pages)
 * Lot 1 = indicateurs les plus pertinents pour le DG, avec fréquence de mise à jour
 * permettant de visualiser l'évolution.
 *
 * Usage:  bun run prisma/seed-priority.ts
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// 43 KPIs du Lot 1, classés par domaine — codes exacts de la base
const LOT1_CODES: string[] = [
  // ── Gouvernance (13) ──
  'GOV-001', // Délai de transmission états financiers annuels au CA
  'GOV-002', // Délai de transmission états financiers annuels à la DGPE
  'GOV-003', // Délai de transmission projet de budget au CA
  'GOV-004', // Délai de transmission projet de budget à la DGPE
  'GOV-005', // Délai de transmission états d'exécution budgétaire trimestriels au CA
  'GOV-006', // Délai de transmission états d'exécution budgétaire trimestriels à la DGPE
  'GOV-007', // Délai de transmission rapport d'activités semestriel aux CAC
  'GOV-010', // Nombre de réunions de Conseil d'administration
  'GOV-009', // Taux de transmission des informations trimestrielles
  'GOV-016', // Taux des marchés passés conformément au CMP
  'GOV-017', // Proportion des dons / CA
  'GOV-018', // Part des honoraires / CA
  'GOV-019', // Part des relations publiques / CA

  // ── Finance (11) ──
  'FIN-001', // Taux d'exécution budgétaire du CA
  'FIN-002', // Taux d'exécution budgétaire des charges
  'FIN-005', // Marge brute d'exploitation (EBE)
  'FIN-004', // Part des charges d'exploitation / revenu d'exploitation
  'FIN-007', // Charges financières / EBE
  'FIN-011', // Ratio d'indépendance financière
  'FIN-006', // Rentabilité financière (ROE)
  'FIN-012', // Capacité d'endettement
  'FIN-009', // Capacité de remboursement
  'FIN-010', // Taux de couverture de la dette
  'FIN-008', // Revenus du Backbone National

  // ── Opérationnel (6) ──
  'OP-001',  // Nombre de localités couvertes
  'OP-003',  // Linéaires prioritaires Backbone construits
  'OP-004',  // Longueur de fibre allumée
  'OP-005',  // Nombre de sites allumés
  'OP-006',  // Linéaire de FO posé
  'OP-008',  // Linéaire de FO allumé

  // ── Ressources Humaines (5) ──
  'RH-011',  // Taux de maîtrise ratio Charges Personnel / CA
  'RH-012',  // Taux de maîtrise de la masse salariale
  'RH-008',  // Taux d'absentéisme
  'RH-006',  // Taux de croissance des effectifs
  'RH-007',  // Taux de réalisation des objectifs stratégiques par direction

  // ── Cadre d'Appétence aux Risques (8) ──
  'RIS-003', // Taux de remboursement des dettes fiscales
  'RIS-004', // Taux de dépassement budgétaire
  'RIS-007', // Nombre de postes clés vacants
  'RIS-008', // Temps de vacances des postes clés
  'RIS-010', // Taux d'intrusion dans le système
  'RIS-011', // Nombre de tentatives d'intrusion
  'RIS-012', // Temps d'indisponibilité des applications critiques
  'RIS-002', // Taux de projets en retard

  // ── PTA : aucun KPI Lot 1 ──
]

async function main() {
  console.log(`🪜 Mise à jour des KPIs Lot 1 — ${LOT1_CODES.length} indicateurs prioritaires\n`)

  // 1. Reset all to false
  const reset = await db.indicator.updateMany({
    data: { isPriority: false },
  })
  console.log(`  ✓ Reset: ${reset.count} indicateurs mis à isPriority=false`)

  // 2. Set Lot 1 KPIs
  let updated = 0
  let notFound: string[] = []

  for (const code of LOT1_CODES) {
    const result = await db.indicator.updateMany({
      where: { code },
      data: { isPriority: true },
    })
    if (result.count > 0) {
      updated++
    } else {
      notFound.push(code)
    }
  }

  console.log(`  ✓ Mis à jour: ${updated} indicateurs marqués isPriority=true`)

  if (notFound.length > 0) {
    console.log(`  ⚠ Non trouvés: ${notFound.join(', ')}`)
  }

  // 3. Summary by domain
  const byDomain = await db.indicator.groupBy({
    by: ['domain'],
    where: { isPriority: true },
    _count: { isPriority: true },
    orderBy: { domain: 'asc' },
  })

  console.log('\n📊 Résumé par domaine :')
  for (const row of byDomain) {
    const total = await db.indicator.count({ where: { domain: row.domain } })
    console.log(`  ${row.domain.padEnd(12)} ${String(row._count.isPriority).padStart(2)} / ${total} prioritaires`)
  }
  console.log('\n✅ Terminé')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())