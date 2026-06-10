/**
 * Seed script — ANSUT Cockpit DG : 103 KPI du cahier des charges
 *
 * Structure : 6 modules, 24 sous-modules, ~103 KPI
 * Chaque KPI inclut des valeurs simulées pour 2025 (Q1, Q2, mois par mois)
 *
 * Usage:  bun run prisma/seed-kpi.ts
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ─── Types ──────────────────────────────────────────────────────────

interface KpiDef {
  code: string
  name: string
  domain: string
  subDomain: string
  unit: string
  targetValue: number | null
  alertValue: number | null
  criticalValue: number | null
  description: string
  frequency: string
  order: number
  // Sample values for 2025 — will generate monthly values
  sampleValues?: { q1: number; q2: number; q3?: number; q4?: number }
}

// ─── Helper: generate monthly values for a year ────────────────────

function generateMonthlyValues(code: string, year: number, q1: number, q2: number, q3?: number, q4?: number) {
  const months = [
    { m: 1, period: `${year}-01` },
    { m: 2, period: `${year}-02` },
    { m: 3, period: `${year}-03` },
    { m: 4, period: `${year}-04` },
    { m: 5, period: `${year}-05` },
    { m: 6, period: `${year}-06` },
    { m: 7, period: `${year}-07` },
    { m: 8, period: `${year}-08` },
    { m: 9, period: `${year}-09` },
    { m: 10, period: `${year}-10` },
    { m: 11, period: `${year}-11` },
    { m: 12, period: `${year}-12` },
  ]

  const q3v = q3 ?? q2 + (q2 - q1) * 0.1
  const q4v = q4 ?? q3v + (q3v - q2) * 0.1

  return months.map(({ m, period }) => {
    let value: number
    if (m <= 3) value = q1 + (m - 1) * (Math.random() * 2 - 1)
    else if (m <= 6) value = q2 + (m - 4) * (Math.random() * 2 - 1)
    else if (m <= 9) value = q3v + (m - 7) * (Math.random() * 2 - 1)
    else value = q4v + (m - 10) * (Math.random() * 2 - 1)

    // Add slight randomness ±3%
    value = value * (0.97 + Math.random() * 0.06)
    value = Math.round(value * 100) / 100

    return {
      period,
      year,
      month: m,
      quarter: m <= 3 ? 1 : m <= 6 ? 2 : m <= 9 ? 3 : 4,
      value,
    }
  })
}

// ─── KPI DEFINITIONS ────────────────────────────────────────────────

const KPI: KpiDef[] = [
  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  1. GOUVERNANCE (19 KPI)                                        ║
  // ╚══════════════════════════════════════════════════════════════════╝

  // --- Sous-module: Reporting réglementaire (9 KPI) ---
  { code: 'GOV-001', name: "Délai de transmission des états financiers au CA", domain: 'governance', subDomain: 'reporting_reglementaire', unit: 'jours', targetValue: 15, alertValue: 20, criticalValue: 30, description: "Délai entre la clôture et la transmission au Conseil d'Administration", frequency: 'trimestriel', order: 1, sampleValues: { q1: 12, q2: 14 } },
  { code: 'GOV-002', name: "Délai de transmission des états financiers à la DGPE", domain: 'governance', subDomain: 'reporting_reglementaire', unit: 'jours', targetValue: 30, alertValue: 45, criticalValue: 60, description: "Délai de transmission des états financiers à la Direction Générale du Plan et de l'Économie", frequency: 'trimestriel', order: 2, sampleValues: { q1: 25, q2: 28 } },
  { code: 'GOV-003', name: "Délai de transmission du projet de budget au CA", domain: 'governance', subDomain: 'reporting_reglementaire', unit: 'jours', targetValue: 30, alertValue: 45, criticalValue: 60, description: "Délai de transmission du projet de budget au Conseil d'Administration", frequency: 'annuel', order: 3, sampleValues: { q1: 22, q2: 22 } },
  { code: 'GOV-004', name: "Délai de transmission du projet de budget à la DGPE", domain: 'governance', subDomain: 'reporting_reglementaire', unit: 'jours', targetValue: 45, alertValue: 60, criticalValue: 90, description: "Délai de transmission du projet de budget à la DGPE", frequency: 'annuel', order: 4, sampleValues: { q1: 38, q2: 38 } },
  { code: 'GOV-005', name: "Délai de transmission des états d'exécution budgétaire trimestriels au CA", domain: 'governance', subDomain: 'reporting_reglementaire', unit: 'jours', targetValue: 30, alertValue: 45, criticalValue: 60, description: "Délai de transmission trimestrielle des états d'exécution au CA", frequency: 'trimestriel', order: 5, sampleValues: { q1: 26, q2: 32 } },
  { code: 'GOV-006', name: "Délai de transmission des états d'exécution budgétaire trimestriels à la DGPE", domain: 'governance', subDomain: 'reporting_reglementaire', unit: 'jours', targetValue: 45, alertValue: 60, criticalValue: 90, description: "Délai de transmission trimestrielle des états d'exécution à la DGPE", frequency: 'trimestriel', order: 6, sampleValues: { q1: 40, q2: 42 } },
  { code: 'GOV-007', name: "Délai de transmission du rapport d'activités semestriel aux CAC", domain: 'governance', subDomain: 'reporting_reglementaire', unit: 'jours', targetValue: 30, alertValue: 45, criticalValue: 60, description: "Délai de transmission du rapport semestriel aux Commissaires aux Comptes", frequency: 'semestriel', order: 7, sampleValues: { q1: 28, q2: 35 } },
  { code: 'GOV-008', name: "Délai de publication des états financiers dans un journal légal", domain: 'governance', subDomain: 'reporting_reglementaire', unit: 'jours', targetValue: 60, alertValue: 75, criticalValue: 90, description: "Délai entre l'AGO et la publication dans un journal d'annonces légales", frequency: 'annuel', order: 8, sampleValues: { q1: 50, q2: 50 } },
  { code: 'GOV-009', name: "Taux de transmission des informations trimestrielles", domain: 'governance', subDomain: 'reporting_reglementaire', unit: '%', targetValue: 100, alertValue: 80, criticalValue: 60, description: "Pourcentage des informations trimestrielles transmises dans les délais", frequency: 'trimestriel', order: 9, sampleValues: { q1: 92, q2: 96 } },

  // --- Sous-module: Gouvernance & Éthique (5 KPI) ---
  { code: 'GOV-010', name: "Nombre de réunions du Conseil d'Administration", domain: 'governance', subDomain: 'gouvernance_ethique', unit: 'nb', targetValue: 4, alertValue: 3, criticalValue: 2, description: "Nombre de réunions du CA tenues sur la période", frequency: 'trimestriel', order: 10, sampleValues: { q1: 2, q2: 3 } },
  { code: 'GOV-011', name: "Tenue des Assemblées Générales avant le 30 juin", domain: 'governance', subDomain: 'gouvernance_ethique', unit: 'nb', targetValue: 1, alertValue: null, criticalValue: 0, description: "AGO tenue avant la date réglementaire du 30 juin", frequency: 'annuel', order: 11, sampleValues: { q1: 0, q2: 1 } },
  { code: 'GOV-012', name: "Taux de sensibilisation à la corruption", domain: 'governance', subDomain: 'gouvernance_ethique', unit: '%', targetValue: 90, alertValue: 70, criticalValue: 50, description: "Part du personnel ayant suivi une sensibilisation anti-corruption", frequency: 'annuel', order: 12, sampleValues: { q1: 78, q2: 82 } },
  { code: 'GOV-013', name: "Taux de formation du personnel", domain: 'governance', subDomain: 'gouvernance_ethique', unit: '%', targetValue: 80, alertValue: 60, criticalValue: 40, description: "Part du personnel ayant bénéficié d'au moins une formation", frequency: 'annuel', order: 13, sampleValues: { q1: 65, q2: 72 } },
  { code: 'GOV-014', name: "Taux de sanction des fautes disciplinaires", domain: 'governance', subDomain: 'gouvernance_ethique', unit: '%', targetValue: 100, alertValue: 80, criticalValue: 50, description: "Part des fautes disciplinaires ayant fait l'objet d'une sanction", frequency: 'trimestriel', order: 14, sampleValues: { q1: 85, q2: 90 } },

  // --- Sous-module: Passation des Marchés Publics (2 KPI) ---
  { code: 'GOV-015', name: "Taux d'exécution des marchés publics", domain: 'governance', subDomain: 'marches_publics', unit: '%', targetValue: 85, alertValue: 70, criticalValue: 50, description: "Taux de réalisation des marchés passés par rapport aux prévisions", frequency: 'trimestriel', order: 15, sampleValues: { q1: 72, q2: 78 } },
  { code: 'GOV-016', name: "Taux des marchés passés conformément au Code des Marchés Publics", domain: 'governance', subDomain: 'marches_publics', unit: '%', targetValue: 100, alertValue: 90, criticalValue: 75, description: "Part des marchés respectant les procédures du CMP", frequency: 'trimestriel', order: 16, sampleValues: { q1: 95, q2: 97 } },

  // --- Sous-module: Dons, Honoraires et Relations Publiques (3 KPI) ---
  { code: 'GOV-017', name: "Proportion des dons / CA", domain: 'governance', subDomain: 'relations_publiques', unit: '%', targetValue: 2, alertValue: 3, criticalValue: 5, description: "Ratio des dons reçus par rapport au chiffre d'affaires", frequency: 'annuel', order: 17, sampleValues: { q1: 1.5, q2: 1.8 } },
  { code: 'GOV-018', name: "Part des honoraires / CA", domain: 'governance', subDomain: 'relations_publiques', unit: '%', targetValue: 3, alertValue: 5, criticalValue: 8, description: "Ratio des honoraires versés par rapport au CA", frequency: 'annuel', order: 18, sampleValues: { q1: 2.2, q2: 2.8 } },
  { code: 'GOV-019', name: "Part des relations publiques / CA", domain: 'governance', subDomain: 'relations_publiques', unit: '%', targetValue: 1.5, alertValue: 2.5, criticalValue: 4, description: "Ratio des dépenses de relations publiques par rapport au CA", frequency: 'annuel', order: 19, sampleValues: { q1: 1.2, q2: 1.4 } },

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  2. FINANCE (12 KPI)                                            ║
  // ╚══════════════════════════════════════════════════════════════════╝

  // --- Sous-module: Exécution budgétaire & Gestion des Charges (4 KPI) ---
  { code: 'FIN-001', name: "Taux d'exécution budgétaire du chiffre d'affaires", domain: 'finance', subDomain: 'execution_budgetaire', unit: '%', targetValue: 90, alertValue: 75, criticalValue: 60, description: "Réalisation du CA par rapport au budget prévisionnel", frequency: 'mensuel', order: 1, sampleValues: { q1: 82, q2: 87 } },
  { code: 'FIN-002', name: "Taux d'exécution budgétaire des charges", domain: 'finance', subDomain: 'execution_budgetaire', unit: '%', targetValue: 85, alertValue: 70, criticalValue: 50, description: "Réalisation des charges par rapport au budget prévisionnel", frequency: 'mensuel', order: 2, sampleValues: { q1: 78, q2: 83 } },
  { code: 'FIN-003', name: "Taux d'exécution budgétaire par programme/projet", domain: 'finance', subDomain: 'execution_budgetaire', unit: '%', targetValue: 80, alertValue: 65, criticalValue: 50, description: "Taux moyen d'exécution par programme ou projet", frequency: 'trimestriel', order: 3, sampleValues: { q1: 68, q2: 74 } },
  { code: 'FIN-004', name: "Part des charges d'exploitation dans le revenu d'exploitation", domain: 'finance', subDomain: 'execution_budgetaire', unit: '%', targetValue: 70, alertValue: 80, criticalValue: 90, description: "Ratio charges d'exploitation / revenu d'exploitation (plus bas = mieux)", frequency: 'trimestriel', order: 4, sampleValues: { q1: 65, q2: 68 } },

  // --- Sous-module: Rentabilité & Performance Financière (3 KPI) ---
  { code: 'FIN-005', name: "Marge Brute d'Exploitation (EBE)", domain: 'finance', subDomain: 'rentabilite', unit: '%', targetValue: 30, alertValue: 20, criticalValue: 10, description: "EBE rapporté au chiffre d'affaires", frequency: 'trimestriel', order: 5, sampleValues: { q1: 25, q2: 28 } },
  { code: 'FIN-006', name: "Rentabilité financière", domain: 'finance', subDomain: 'rentabilite', unit: '%', targetValue: 15, alertValue: 10, criticalValue: 5, description: "ROE — Résultat net / Capitaux propres", frequency: 'trimestriel', order: 6, sampleValues: { q1: 12, q2: 14 } },
  { code: 'FIN-007', name: "Charges financières rapportées à l'EBE", domain: 'finance', subDomain: 'rentabilite', unit: '%', targetValue: 20, alertValue: 30, criticalValue: 40, description: "Ratio charges financières / EBE (plus bas = mieux)", frequency: 'trimestriel', order: 7, sampleValues: { q1: 18, q2: 16 } },

  // --- Sous-module: Ressources Spécifiques (1 KPI) ---
  { code: 'FIN-008', name: "Revenus du Backbone National", domain: 'finance', subDomain: 'ressources_specifiques', unit: 'Mds FCFA', targetValue: 5, alertValue: 3.5, criticalValue: 2, description: "Revenus générés par le Backbone National", frequency: 'trimestriel', order: 8, sampleValues: { q1: 3.8, q2: 4.2 } },

  // --- Sous-module: Endettement (4 KPI) ---
  { code: 'FIN-009', name: "Capacité de remboursement", domain: 'finance', subDomain: 'dette', unit: 'ratio', targetValue: 2, alertValue: 1.5, criticalValue: 1, description: "EBE / Charges d'intérêts (plus élevé = mieux)", frequency: 'trimestriel', order: 9, sampleValues: { q1: 2.1, q2: 2.3 } },
  { code: 'FIN-010', name: "Taux de couverture de la dette", domain: 'finance', subDomain: 'dette', unit: '%', targetValue: 150, alertValue: 120, criticalValue: 100, description: "EBE / Annuité de remboursement de la dette", frequency: 'trimestriel', order: 10, sampleValues: { q1: 140, q2: 155 } },
  { code: 'FIN-011', name: "Ratio d'indépendance financière", domain: 'finance', subDomain: 'dette', unit: '%', targetValue: 40, alertValue: 55, criticalValue: 70, description: "Dettes financières / Total Passif (plus bas = mieux)", frequency: 'trimestriel', order: 11, sampleValues: { q1: 42, q2: 38 } },
  { code: 'FIN-012', name: "Capacité d'endettement", domain: 'finance', subDomain: 'dette', unit: 'Mds FCFA', targetValue: 10, alertValue: 5, criticalValue: 2, description: "Marge d'endettement disponible selon les ratios", frequency: 'annuel', order: 12, sampleValues: { q1: 7.5, q2: 8.2 } },

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  3. OPÉRATIONNEL (46 KPI)                                        ║
  // ╚══════════════════════════════════════════════════════════════════╝

  // --- Sous-module: Déploiement des Infrastructures (21 KPI) ---
  { code: 'OP-001', name: "Nombre de localités couvertes", domain: 'operational', subDomain: 'deploiement_infra', unit: 'nb', targetValue: 150, alertValue: 120, criticalValue: 80, description: "Nombre total de localités couvertes en connectivité", frequency: 'trimestriel', order: 1, sampleValues: { q1: 95, q2: 118 } },
  { code: 'OP-002', name: "Nombre de personnes bénéficiant de la connectivité", domain: 'operational', subDomain: 'deploiement_infra', unit: 'nb', targetValue: 500000, alertValue: 400000, criticalValue: 250000, description: "Population totale desservie par les infrastructures ANSUT", frequency: 'trimestriel', order: 2, sampleValues: { q1: 320000, q2: 410000 } },
  { code: 'OP-003', name: "Linéaires prioritaires du Backbone construits", domain: 'operational', subDomain: 'deploiement_infra', unit: 'km', targetValue: 500, alertValue: 400, criticalValue: 250, description: "Kilomètres de Backbone construits sur les axes prioritaires", frequency: 'mensuel', order: 3, sampleValues: { q1: 280, q2: 380 } },
  { code: 'OP-004', name: "Longueur de fibre allumée", domain: 'operational', subDomain: 'deploiement_infra', unit: 'km', targetValue: 800, alertValue: 600, criticalValue: 400, description: "Kilomètres de fibre optique effectivement allumés", frequency: 'mensuel', order: 4, sampleValues: { q1: 450, q2: 580 } },
  { code: 'OP-005', name: "Nombre de sites allumés", domain: 'operational', subDomain: 'deploiement_infra', unit: 'nb', targetValue: 200, alertValue: 150, criticalValue: 100, description: "Nombre de sites de réseau opérationnels", frequency: 'mensuel', order: 5, sampleValues: { q1: 120, q2: 155 } },
  { code: 'OP-006', name: "Linéaire de FO posé", domain: 'operational', subDomain: 'deploiement_infra', unit: 'km', targetValue: 1200, alertValue: 900, criticalValue: 600, description: "Kilomètres de fibre optique posés (total cumulé)", frequency: 'mensuel', order: 6, sampleValues: { q1: 680, q2: 850 } },
  { code: 'OP-007', name: "Taux de réalisation de la pose FO", domain: 'operational', subDomain: 'deploiement_infra', unit: '%', targetValue: 90, alertValue: 75, criticalValue: 60, description: "Taux de réalisation du programme de pose de fibre optique", frequency: 'mensuel', order: 7, sampleValues: { q1: 72, q2: 80 } },
  { code: 'OP-008', name: "Linéaire de FO allumé", domain: 'operational', subDomain: 'deploiement_infra', unit: 'km', targetValue: 900, alertValue: 700, criticalValue: 450, description: "Kilomètres de fibre optique effectivement allumés", frequency: 'mensuel', order: 8, sampleValues: { q1: 480, q2: 620 } },
  { code: 'OP-009', name: "Taux de réalisation de l'allumage FO", domain: 'operational', subDomain: 'deploiement_infra', unit: '%', targetValue: 85, alertValue: 70, criticalValue: 55, description: "Taux de réalisation du programme d'allumage de fibre", frequency: 'mensuel', order: 9, sampleValues: { q1: 65, q2: 74 } },
  { code: 'OP-010', name: "Linéaire FO exploitable mis à disposition", domain: 'operational', subDomain: 'deploiement_infra', unit: 'km', targetValue: 700, alertValue: 550, criticalValue: 350, description: "Kilomètres de FO effectivement exploitables par les opérateurs", frequency: 'trimestriel', order: 10, sampleValues: { q1: 380, q2: 480 } },
  { code: 'OP-011', name: "Taux de FO exploitable mis à disposition", domain: 'operational', subDomain: 'deploiement_infra', unit: '%', targetValue: 80, alertValue: 65, criticalValue: 50, description: "Taux de mise à disposition effective de la FO", frequency: 'trimestriel', order: 11, sampleValues: { q1: 62, q2: 70 } },
  { code: 'OP-012', name: "Nombre de points de coupure installés", domain: 'operational', subDomain: 'deploiement_infra', unit: 'nb', targetValue: 300, alertValue: 240, criticalValue: 150, description: "Points de coupure installés sur le réseau", frequency: 'mensuel', order: 12, sampleValues: { q1: 165, q2: 210 } },
  { code: 'OP-013', name: "Taux de réalisation des points de coupure", domain: 'operational', subDomain: 'deploiement_infra', unit: '%', targetValue: 85, alertValue: 70, criticalValue: 55, description: "Taux de réalisation du programme de points de coupure", frequency: 'mensuel', order: 13, sampleValues: { q1: 68, q2: 76 } },
  { code: 'OP-014', name: "Nombre de points de coupure mis en service", domain: 'operational', subDomain: 'deploiement_infra', unit: 'nb', targetValue: 250, alertValue: 200, criticalValue: 120, description: "Points de coupure effectivement opérationnels", frequency: 'mensuel', order: 14, sampleValues: { q1: 130, q2: 175 } },
  { code: 'OP-015', name: "Taux de mise en service des points de coupure", domain: 'operational', subDomain: 'deploiement_infra', unit: '%', targetValue: 80, alertValue: 65, criticalValue: 50, description: "Part des points de coupure installés effectivement en service", frequency: 'mensuel', order: 15, sampleValues: { q1: 62, q2: 72 } },
  { code: 'OP-016', name: "Last Mile : Nombre d'entités raccordées", domain: 'operational', subDomain: 'deploiement_infra', unit: 'nb', targetValue: 500, alertValue: 380, criticalValue: 250, description: "Nombre d'entités (écoles, mairies, centres de santé) raccordées en last mile", frequency: 'trimestriel', order: 16, sampleValues: { q1: 280, q2: 360 } },
  { code: 'OP-017', name: "Taux de réalisation des fonctionnalités", domain: 'operational', subDomain: 'deploiement_infra', unit: '%', targetValue: 85, alertValue: 70, criticalValue: 55, description: "Taux de réalisation des fonctionnalités techniques prévues", frequency: 'trimestriel', order: 17, sampleValues: { q1: 70, q2: 78 } },
  { code: 'OP-018', name: "Taux de mise en service des fonctionnalités", domain: 'operational', subDomain: 'deploiement_infra', unit: '%', targetValue: 80, alertValue: 65, criticalValue: 50, description: "Part des fonctionnalités réalisées effectivement en service", frequency: 'trimestriel', order: 18, sampleValues: { q1: 62, q2: 70 } },
  { code: 'OP-019', name: "Taux de respect des DMR", domain: 'operational', subDomain: 'deploiement_infra', unit: '%', targetValue: 95, alertValue: 85, criticalValue: 70, description: "Taux de respect des Délais de Mise en Réseau", frequency: 'mensuel', order: 19, sampleValues: { q1: 88, q2: 91 } },
  { code: 'OP-020', name: "Taux de défauts techniques", domain: 'operational', subDomain: 'deploiement_infra', unit: '%', targetValue: 5, alertValue: 10, criticalValue: 20, description: "Taux de défauts techniques sur les infrastructures (plus bas = mieux)", frequency: 'mensuel', order: 20, sampleValues: { q1: 8, q2: 6 } },
  { code: 'OP-021', name: "Taux de disponibilité des services", domain: 'operational', subDomain: 'deploiement_infra', unit: '%', targetValue: 99.5, alertValue: 98, criticalValue: 95, description: "Disponibilité des services réseau (SLA)", frequency: 'mensuel', order: 21, sampleValues: { q1: 98.2, q2: 98.8 } },

  // --- Sous-module: Relations avec les Opérateurs (3 KPI) ---
  { code: 'OP-022', name: "Nombre de linéaires mis à disposition par opérateur", domain: 'operational', subDomain: 'relations_operateurs', unit: 'km', targetValue: 600, alertValue: 450, criticalValue: 300, description: "Linéaires de FO mis à disposition par chaque opérateur", frequency: 'trimestriel', order: 22, sampleValues: { q1: 350, q2: 440 } },
  { code: 'OP-023', name: "Nombre de linéaires cumulés mis à disposition", domain: 'operational', subDomain: 'relations_operateurs', unit: 'km', targetValue: 1500, alertValue: 1200, criticalValue: 800, description: "Total cumulé de linéaires mis à disposition des opérateurs", frequency: 'trimestriel', order: 23, sampleValues: { q1: 880, q2: 1050 } },
  { code: 'OP-024', name: "Respect des SLA opérateurs", domain: 'operational', subDomain: 'relations_operateurs', unit: '%', targetValue: 98, alertValue: 90, criticalValue: 80, description: "Taux de respect des SLA par les opérateurs", frequency: 'mensuel', order: 24, sampleValues: { q1: 92, q2: 95 } },

  // --- Sous-module: Service Universel (8 KPI) ---
  { code: 'OP-025', name: "Nombre d'établissements dotés de salles multimédia", domain: 'operational', subDomain: 'service_universel', unit: 'nb', targetValue: 200, alertValue: 150, criticalValue: 100, description: "Établissements équipés de salles multimédia", frequency: 'trimestriel', order: 25, sampleValues: { q1: 115, q2: 148 } },
  { code: 'OP-026', name: "Nombre d'établissements secondaires dotés", domain: 'operational', subDomain: 'service_universel', unit: 'nb', targetValue: 100, alertValue: 75, criticalValue: 50, description: "Établissements secondaires équipés", frequency: 'trimestriel', order: 26, sampleValues: { q1: 55, q2: 72 } },
  { code: 'OP-027', name: "Nombre d'universités dotées", domain: 'operational', subDomain: 'service_universel', unit: 'nb', targetValue: 20, alertValue: 15, criticalValue: 10, description: "Universités équipées en connectivité", frequency: 'annuel', order: 27, sampleValues: { q1: 12, q2: 15 } },
  { code: 'OP-028', name: "Nombre d'administrations publiques dotées", domain: 'operational', subDomain: 'service_universel', unit: 'nb', targetValue: 50, alertValue: 35, criticalValue: 20, description: "Administrations publiques connectées", frequency: 'trimestriel', order: 28, sampleValues: { q1: 28, q2: 38 } },
  { code: 'OP-029', name: "Nombre d'associations / ONG dotées", domain: 'operational', subDomain: 'service_universel', unit: 'nb', targetValue: 30, alertValue: 20, criticalValue: 10, description: "Associations et ONG équipées", frequency: 'trimestriel', order: 29, sampleValues: { q1: 16, q2: 22 } },
  { code: 'OP-030', name: "Nombre d'équipements distribués (PEUB)", domain: 'operational', subDomain: 'service_universel', unit: 'nb', targetValue: 5000, alertValue: 3500, criticalValue: 2000, description: "Équipements distribués dans le cadre du PEUB", frequency: 'trimestriel', order: 30, sampleValues: { q1: 2800, q2: 3600 } },
  { code: 'OP-031', name: "Nombre de personnes formées à l'innovation", domain: 'operational', subDomain: 'service_universel', unit: 'nb', targetValue: 3000, alertValue: 2000, criticalValue: 1000, description: "Personnes formées dans les programmes d'innovation", frequency: 'trimestriel', order: 31, sampleValues: { q1: 1600, q2: 2200 } },
  { code: 'OP-032', name: "Nombre d'actions CICN réalisées", domain: 'operational', subDomain: 'service_universel', unit: 'nb', targetValue: 50, alertValue: 35, criticalValue: 20, description: "Actions du Centre d'Innovation et de Culture Numérique", frequency: 'trimestriel', order: 32, sampleValues: { q1: 22, q2: 32 } },

  // --- Sous-module: Projets & Programmes (14 KPI) ---
  { code: 'OP-033', name: "Écart budgétaire (Variance Coût)", domain: 'operational', subDomain: 'projets_programmes', unit: '%', targetValue: 5, alertValue: 10, criticalValue: 20, description: "Variance entre le budget prévu et le réel (plus bas = mieux)", frequency: 'trimestriel', order: 33, sampleValues: { q1: 8, q2: 6 } },
  { code: 'OP-034', name: "Taux d'exécution budgétaire (paiements)", domain: 'operational', subDomain: 'projets_programmes', unit: '%', targetValue: 85, alertValue: 70, criticalValue: 55, description: "Taux de paiement par rapport aux engagements budgétaires", frequency: 'trimestriel', order: 34, sampleValues: { q1: 72, q2: 79 } },
  { code: 'OP-035', name: "Taux de consommation budgétaire pluriannuel", domain: 'operational', subDomain: 'projets_programmes', unit: '%', targetValue: 80, alertValue: 65, criticalValue: 50, description: "Taux de consommation sur les budgets pluriannuels", frequency: 'trimestriel', order: 35, sampleValues: { q1: 62, q2: 70 } },
  { code: 'OP-036', name: "Variance des délais", domain: 'operational', subDomain: 'projets_programmes', unit: '%', targetValue: 5, alertValue: 15, criticalValue: 30, description: "Écart moyen entre délai prévu et délai réel des projets", frequency: 'trimestriel', order: 36, sampleValues: { q1: 12, q2: 10 } },
  { code: 'OP-037', name: "Taux d'avancement des jalons", domain: 'operational', subDomain: 'projets_programmes', unit: '%', targetValue: 90, alertValue: 75, criticalValue: 60, description: "Taux de jalons atteints par rapport aux jalons planifiés", frequency: 'trimestriel', order: 37, sampleValues: { q1: 76, q2: 82 } },
  { code: 'OP-038', name: "Taux de conformité des livrables", domain: 'operational', subDomain: 'projets_programmes', unit: '%', targetValue: 95, alertValue: 85, criticalValue: 70, description: "Taux de livrables conformes aux spécifications", frequency: 'trimestriel', order: 38, sampleValues: { q1: 88, q2: 91 } },
  { code: 'OP-039', name: "Taux d'achèvement des livrables", domain: 'operational', subDomain: 'projets_programmes', unit: '%', targetValue: 85, alertValue: 70, criticalValue: 55, description: "Taux de livrables effectivement achevés", frequency: 'trimestriel', order: 39, sampleValues: { q1: 70, q2: 78 } },
  { code: 'OP-040', name: "Taux de changements de scope approuvés", domain: 'operational', subDomain: 'projets_programmes', unit: '%', targetValue: 10, alertValue: 20, criticalValue: 35, description: "Part des changements de périmètre officiellement approuvés", frequency: 'trimestriel', order: 40, sampleValues: { q1: 15, q2: 12 } },
  { code: 'OP-041', name: "Nombre de procédures dématérialisées", domain: 'operational', subDomain: 'projets_programmes', unit: 'nb', targetValue: 25, alertValue: 18, criticalValue: 10, description: "Procédures administratives dématérialisées", frequency: 'trimestriel', order: 41, sampleValues: { q1: 14, q2: 19 } },
  { code: 'OP-042', name: "Nombre de startups accompagnées", domain: 'operational', subDomain: 'projets_programmes', unit: 'nb', targetValue: 50, alertValue: 35, criticalValue: 20, description: "Startups soutenues par les programmes ANSUT", frequency: 'trimestriel', order: 42, sampleValues: { q1: 28, q2: 36 } },
  { code: 'OP-043', name: "Nombre de nouveaux e-services déployés", domain: 'operational', subDomain: 'projets_programmes', unit: 'nb', targetValue: 15, alertValue: 10, criticalValue: 5, description: "E-services nouveaux déployés sur la période", frequency: 'trimestriel', order: 43, sampleValues: { q1: 8, q2: 11 } },
  { code: 'OP-044', name: "Nombre de projets Smart City réalisés", domain: 'operational', subDomain: 'projets_programmes', unit: 'nb', targetValue: 10, alertValue: 7, criticalValue: 4, description: "Projets Smart City effectivement réalisés", frequency: 'trimestriel', order: 44, sampleValues: { q1: 5, q2: 7 } },
  { code: 'OP-045', name: "Taux de réalisation des projets Smart City", domain: 'operational', subDomain: 'projets_programmes', unit: '%', targetValue: 80, alertValue: 65, criticalValue: 50, description: "Taux de réalisation global des projets Smart City", frequency: 'trimestriel', order: 45, sampleValues: { q1: 62, q2: 72 } },
  { code: 'OP-046', name: "Nombre d'entités connectées au CCTD", domain: 'operational', subDomain: 'projets_programmes', unit: 'nb', targetValue: 100, alertValue: 70, criticalValue: 40, description: "Entités connectées au Centre de Traitement des Données", frequency: 'trimestriel', order: 46, sampleValues: { q1: 52, q2: 68 } },

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  4. RESSOURCES HUMAINES (12 KPI)                                 ║
  // ╚══════════════════════════════════════════════════════════════════╝

  // --- Sous-module: Effectifs & Organisation (6 KPI) ---
  { code: 'RH-001', name: "Ratio de turnover", domain: 'rh', subDomain: 'effectifs', unit: '%', targetValue: 8, alertValue: 12, criticalValue: 18, description: "Taux de rotation du personnel (plus bas = mieux)", frequency: 'trimestriel', order: 1, sampleValues: { q1: 10, q2: 9 } },
  { code: 'RH-002', name: "Répartition par type de contrat", domain: 'rh', subDomain: 'effectifs', unit: '%', targetValue: 80, alertValue: 65, criticalValue: 50, description: "Part des CDI dans l'effectif total", frequency: 'trimestriel', order: 2, sampleValues: { q1: 72, q2: 74 } },
  { code: 'RH-003', name: "Ratio hommes/femmes", domain: 'rh', subDomain: 'effectifs', unit: 'ratio', targetValue: 1.2, alertValue: 1.5, criticalValue: 2, description: "Ratio effectif masculin / effectif féminin", frequency: 'trimestriel', order: 3, sampleValues: { q1: 1.4, q2: 1.3 } },
  { code: 'RH-004', name: "Ratio effectif administratif / technique", domain: 'rh', subDomain: 'effectifs', unit: 'ratio', targetValue: 0.4, alertValue: 0.6, criticalValue: 0.8, description: "Ratio personnel administratif / personnel technique", frequency: 'trimestriel', order: 4, sampleValues: { q1: 0.52, q2: 0.48 } },
  { code: 'RH-005', name: "Taux d'encadrement", domain: 'rh', subDomain: 'effectifs', unit: '%', targetValue: 25, alertValue: 20, criticalValue: 15, description: "Part des cadres dans l'effectif total", frequency: 'trimestriel', order: 5, sampleValues: { q1: 22, q2: 23 } },
  { code: 'RH-006', name: "Taux de croissance des effectifs", domain: 'rh', subDomain: 'effectifs', unit: '%', targetValue: 5, alertValue: 2, criticalValue: 0, description: "Taux de croissance annuel des effectifs", frequency: 'trimestriel', order: 6, sampleValues: { q1: 3.5, q2: 4.2 } },

  // --- Sous-module: Performance & Productivité (2 KPI) ---
  { code: 'RH-007', name: "Taux de réalisation des objectifs stratégiques par direction", domain: 'rh', subDomain: 'performance', unit: '%', targetValue: 85, alertValue: 70, criticalValue: 55, description: "Taux moyen de réalisation des objectifs par direction", frequency: 'trimestriel', order: 7, sampleValues: { q1: 72, q2: 78 } },
  { code: 'RH-008', name: "Taux d'absentéisme", domain: 'rh', subDomain: 'performance', unit: '%', targetValue: 3, alertValue: 5, criticalValue: 8, description: "Taux d'absentéisme (plus bas = mieux)", frequency: 'mensuel', order: 8, sampleValues: { q1: 4.2, q2: 3.8 } },

  // --- Sous-module: Développement des Compétences (2 KPI) ---
  { code: 'RH-009', name: "Taux d'exécution du plan de formation", domain: 'rh', subDomain: 'competences', unit: '%', targetValue: 90, alertValue: 75, criticalValue: 60, description: "Part des actions de formation réalisées par rapport au plan", frequency: 'trimestriel', order: 9, sampleValues: { q1: 75, q2: 82 } },
  { code: 'RH-010', name: "Taux de satisfaction des apprenants", domain: 'rh', subDomain: 'competences', unit: '%', targetValue: 85, alertValue: 70, criticalValue: 55, description: "Taux de satisfaction des participants aux formations", frequency: 'trimestriel', order: 10, sampleValues: { q1: 80, q2: 83 } },

  // --- Sous-module: Maîtrise des Coûts RH (2 KPI) ---
  { code: 'RH-011', name: "Taux de maîtrise du ratio Charges Personnel / CA", domain: 'rh', subDomain: 'couts_rh', unit: '%', targetValue: 35, alertValue: 45, criticalValue: 55, description: "Ratio charges de personnel / chiffre d'affaires (plus bas = mieux)", frequency: 'trimestriel', order: 11, sampleValues: { q1: 38, q2: 36 } },
  { code: 'RH-012', name: "Taux de maîtrise de la masse salariale", domain: 'rh', subDomain: 'couts_rh', unit: '%', targetValue: 95, alertValue: 85, criticalValue: 75, description: "Taux de respect du budget masse salariale", frequency: 'trimestriel', order: 12, sampleValues: { q1: 92, q2: 94 } },

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  5. CADRE D'APPÉTENCE AU RISQUE (14 KPI)                        ║
  // ╚══════════════════════════════════════════════════════════════════╝

  // --- Sous-module: Risque Stratégique (2 KPI) ---
  { code: 'RIS-001', name: "Nombre de projets interrompus", domain: 'risque', subDomain: 'risque_strategique', unit: 'nb', targetValue: 0, alertValue: 1, criticalValue: 3, description: "Projets définitivement interrompus (plus bas = mieux)", frequency: 'trimestriel', order: 1, sampleValues: { q1: 1, q2: 0 } },
  { code: 'RIS-002', name: "Taux de projets en retard", domain: 'risque', subDomain: 'risque_strategique', unit: '%', targetValue: 15, alertValue: 25, criticalValue: 40, description: "Part des projets en retard par rapport au planning (plus bas = mieux)", frequency: 'trimestriel', order: 2, sampleValues: { q1: 28, q2: 22 } },

  // --- Sous-module: Risque Financier (2 KPI) ---
  { code: 'RIS-003', name: "Taux de remboursement des dettes fiscales", domain: 'risque', subDomain: 'risque_financier', unit: '%', targetValue: 100, alertValue: 90, criticalValue: 75, description: "Taux de remboursement des dettes fiscales dans les délais", frequency: 'trimestriel', order: 3, sampleValues: { q1: 88, q2: 92 } },
  { code: 'RIS-004', name: "Taux de dépassement budgétaire", domain: 'risque', subDomain: 'risque_financier', unit: '%', targetValue: 5, alertValue: 10, criticalValue: 20, description: "Taux de dépassement du budget (plus bas = mieux)", frequency: 'trimestriel', order: 4, sampleValues: { q1: 12, q2: 8 } },

  // --- Sous-module: Risque Opérationnel (5 KPI) ---
  { code: 'RIS-005', name: "Taux de résolution des incidents RNHD", domain: 'risque', subDomain: 'risque_operationnel', unit: '%', targetValue: 95, alertValue: 85, criticalValue: 70, description: "Taux de résolution des incidents du Réseau National Haut Débit", frequency: 'mensuel', order: 5, sampleValues: { q1: 88, q2: 91 } },
  { code: 'RIS-006', name: "Nombre d'incidents non résolus dans les délais", domain: 'risque', subDomain: 'risque_operationnel', unit: 'nb', targetValue: 0, alertValue: 3, criticalValue: 8, description: "Incidents restés ouverts au-delà du SLA (plus bas = mieux)", frequency: 'mensuel', order: 6, sampleValues: { q1: 4, q2: 2 } },
  { code: 'RIS-007', name: "Nombre de postes clés vacants", domain: 'risque', subDomain: 'risque_operationnel', unit: 'nb', targetValue: 0, alertValue: 2, criticalValue: 5, description: "Postes stratégiques sans titulaire (plus bas = mieux)", frequency: 'trimestriel', order: 7, sampleValues: { q1: 2, q2: 1 } },
  { code: 'RIS-008', name: "Temps de vacance des postes clés", domain: 'risque', subDomain: 'risque_operationnel', unit: 'jours', targetValue: 30, alertValue: 60, criticalValue: 90, description: "Durée moyenne de vacance des postes clés (plus bas = mieux)", frequency: 'trimestriel', order: 8, sampleValues: { q1: 45, q2: 35 } },
  { code: 'RIS-009', name: "Taux d'actifs non couverts par assurance", domain: 'risque', subDomain: 'risque_operationnel', unit: '%', targetValue: 0, alertValue: 5, criticalValue: 15, description: "Part des actifs non assurés (plus bas = mieux)", frequency: 'annuel', order: 9, sampleValues: { q1: 8, q2: 5 } },

  // --- Sous-module: Risque Technologique (4 KPI) ---
  { code: 'RIS-010', name: "Taux d'intrusion dans le système", domain: 'risque', subDomain: 'risque_technologique', unit: '%', targetValue: 0, alertValue: 1, criticalValue: 5, description: "Taux de tentatives d'intrusion réussies (plus bas = mieux)", frequency: 'mensuel', order: 10, sampleValues: { q1: 0.5, q2: 0.2 } },
  { code: 'RIS-011', name: "Nombre de tentatives d'intrusion", domain: 'risque', subDomain: 'risque_technologique', unit: 'nb', targetValue: 0, alertValue: 10, criticalValue: 50, description: "Tentatives d'intrusion détectées (plus bas = mieux)", frequency: 'mensuel', order: 11, sampleValues: { q1: 15, q2: 12 } },
  { code: 'RIS-012', name: "Temps d'indisponibilité des applications critiques", domain: 'risque', subDomain: 'risque_technologique', unit: 'h', targetValue: 2, alertValue: 8, criticalValue: 24, description: "Heures d'indisponibilité des systèmes critiques (plus bas = mieux)", frequency: 'mensuel', order: 12, sampleValues: { q1: 6, q2: 4 } },
  { code: 'RIS-013', name: "Taux de résolution des incidents critiques", domain: 'risque', subDomain: 'risque_technologique', unit: '%', targetValue: 100, alertValue: 90, criticalValue: 75, description: "Taux de résolution dans les délais des incidents critiques SI", frequency: 'mensuel', order: 13, sampleValues: { q1: 92, q2: 95 } },

  // --- Sous-module: Risque Gouvernance (1 KPI) ---
  { code: 'RIS-014', name: "Taux de plans d'actions non mis en œuvre dans les délais", domain: 'risque', subDomain: 'risque_gouvernance', unit: '%', targetValue: 10, alertValue: 20, criticalValue: 35, description: "Part des plans d'action en retard (plus bas = mieux)", frequency: 'trimestriel', order: 14, sampleValues: { q1: 18, q2: 15 } },

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  6. PLAN DE TRAVAIL ANNUEL — PTA (13 KPI)                       ║
  // ╚══════════════════════════════════════════════════════════════════╝

  // --- Sous-module PTA: Gouvernance (2 KPI) ---
  { code: 'PTA-001', name: "PTA — Nombre de réunions du CA", domain: 'pta', subDomain: 'pta_gouvernance', unit: 'nb', targetValue: 4, alertValue: 3, criticalValue: 2, description: "Réunions du CA planifiées vs réalisées", frequency: 'trimestriel', order: 1, sampleValues: { q1: 2, q2: 3 } },
  { code: 'PTA-002', name: "PTA — Taux des marchés conformes au Code des Marchés Publics", domain: 'pta', subDomain: 'pta_gouvernance', unit: '%', targetValue: 100, alertValue: 90, criticalValue: 75, description: "Conformité des marchés PTA au CMP", frequency: 'trimestriel', order: 2, sampleValues: { q1: 95, q2: 98 } },

  // --- Sous-module PTA: Opérationnel (8 KPI) ---
  { code: 'PTA-003', name: "PTA — Linéaires prioritaires Backbone construits", domain: 'pta', subDomain: 'pta_operationnel', unit: 'km', targetValue: 500, alertValue: 400, criticalValue: 250, description: "Avancement Backbone dans le PTA", frequency: 'trimestriel', order: 3, sampleValues: { q1: 280, q2: 380 } },
  { code: 'PTA-004', name: "PTA — Respect des SLA", domain: 'pta', subDomain: 'pta_operationnel', unit: '%', targetValue: 98, alertValue: 90, criticalValue: 80, description: "Taux de respect des SLA opérationnels du PTA", frequency: 'trimestriel', order: 4, sampleValues: { q1: 92, q2: 95 } },
  { code: 'PTA-005', name: "PTA — Nombre de linéaires FO déployés et exploitables", domain: 'pta', subDomain: 'pta_operationnel', unit: 'km', targetValue: 700, alertValue: 550, criticalValue: 350, description: "FO déployée et exploitable dans le cadre du PTA", frequency: 'trimestriel', order: 5, sampleValues: { q1: 380, q2: 480 } },
  { code: 'PTA-006', name: "PTA — Linéaire FO allumé", domain: 'pta', subDomain: 'pta_operationnel', unit: 'km', targetValue: 900, alertValue: 700, criticalValue: 450, description: "FO allumée dans le cadre du PTA", frequency: 'trimestriel', order: 6, sampleValues: { q1: 480, q2: 620 } },
  { code: 'PTA-007', name: "PTA — Nombre de nouveaux e-services déployés", domain: 'pta', subDomain: 'pta_operationnel', unit: 'nb', targetValue: 15, alertValue: 10, criticalValue: 5, description: "E-services déployés selon le PTA", frequency: 'trimestriel', order: 7, sampleValues: { q1: 8, q2: 11 } },
  { code: 'PTA-008', name: "PTA — Nombre de procédures dématérialisées", domain: 'pta', subDomain: 'pta_operationnel', unit: 'nb', targetValue: 25, alertValue: 18, criticalValue: 10, description: "Procédures dématérialisées selon le PTA", frequency: 'trimestriel', order: 8, sampleValues: { q1: 14, q2: 19 } },
  { code: 'PTA-009', name: "PTA — Taux de réalisation Smart City", domain: 'pta', subDomain: 'pta_operationnel', unit: '%', targetValue: 80, alertValue: 65, criticalValue: 50, description: "Avancement des projets Smart City du PTA", frequency: 'trimestriel', order: 9, sampleValues: { q1: 62, q2: 72 } },
  { code: 'PTA-010', name: "PTA — Nombre de personnes formées à l'innovation", domain: 'pta', subDomain: 'pta_operationnel', unit: 'nb', targetValue: 3000, alertValue: 2000, criticalValue: 1000, description: "Personnes formées à l'innovation dans le cadre du PTA", frequency: 'trimestriel', order: 10, sampleValues: { q1: 1600, q2: 2200 } },

  // --- Sous-module PTA: Finance (3 KPI) ---
  { code: 'PTA-011', name: "PTA — Taux d'exécution budgétaire par projet", domain: 'pta', subDomain: 'pta_finance', unit: '%', targetValue: 85, alertValue: 70, criticalValue: 55, description: "Exécution budgétaire des projets PTA", frequency: 'trimestriel', order: 11, sampleValues: { q1: 72, q2: 79 } },
  { code: 'PTA-012', name: "PTA — Marge brute d'exploitation (EBE)", domain: 'pta', subDomain: 'pta_finance', unit: '%', targetValue: 30, alertValue: 20, criticalValue: 10, description: "EBE du PTA", frequency: 'trimestriel', order: 12, sampleValues: { q1: 25, q2: 28 } },
  { code: 'PTA-013', name: "PTA — Ratio d'indépendance financière", domain: 'pta', subDomain: 'pta_finance', unit: '%', targetValue: 40, alertValue: 55, criticalValue: 70, description: "Indépendance financière dans le cadre du PTA (plus bas = mieux)", frequency: 'trimestriel', order: 13, sampleValues: { q1: 42, q2: 38 } },
]

// ─── SUB-MODULE LABELS (French) ─────────────────────────────────────

const SUB_DOMAIN_LABELS: Record<string, string> = {
  // Gouvernance
  reporting_reglementaire: 'Reporting réglementaire',
  gouvernance_ethique: 'Gouvernance & Éthique',
  marches_publics: 'Passation des Marchés Publics',
  relations_publiques: 'Dons, Honoraires et Relations Publiques',
  // Finance
  execution_budgetaire: 'Exécution budgétaire & Gestion des Charges',
  rentabilite: 'Rentabilité & Performance Financière',
  ressources_specifiques: 'Ressources Spécifiques',
  dette: 'Endettement',
  // Opérationnel
  deploiement_infra: 'Déploiement des Infrastructures',
  relations_operateurs: 'Relations avec les Opérateurs',
  service_universel: 'Service Universel',
  projets_programmes: 'Projets & Programmes',
  // RH
  effectifs: 'Effectifs & Organisation',
  performance: 'Performance & Productivité',
  competences: 'Développement des Compétences',
  couts_rh: 'Maîtrise des Coûts RH',
  // Risques
  risque_strategique: 'Risque Stratégique',
  risque_financier: 'Risque Financier',
  risque_operationnel: 'Risque Opérationnel',
  risque_technologique: 'Risque Technologique',
  risque_gouvernance: 'Risque Gouvernance',
  // PTA
  pta_gouvernance: 'Gouvernance',
  pta_operationnel: 'Opérationnel',
  pta_finance: 'Finance',
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding ANSUT KPI — Cahier des charges (103 indicateurs)...\n')

  const YEAR = 2025

  // 1. Delete existing indicator values then indicators
  console.log('🗑️  Suppression des anciens indicateurs...')
  const deletedValues = await db.indicatorValue.deleteMany()
  const deletedIndicators = await db.indicator.deleteMany()
  console.log(`   ${deletedValues.count} valeurs supprimées`)
  console.log(`   ${deletedIndicators.count} indicateurs supprimés\n`)

  // 2. Create indicators and values
  let created = 0
  let valuesCreated = 0

  for (const kpi of KPI) {
    // Create indicator
    const indicator = await db.indicator.create({
      data: {
        code: kpi.code,
        name: kpi.name,
        domain: kpi.domain,
        subDomain: kpi.subDomain,
        unit: kpi.unit,
        targetValue: kpi.targetValue,
        alertValue: kpi.alertValue,
        criticalValue: kpi.criticalValue,
        description: kpi.description,
        frequency: kpi.frequency,
        sourceSystem: 'manuel',
        order: kpi.order,
        isActive: true,
      },
    })
    created++

    // Generate monthly values
    if (kpi.sampleValues) {
      const monthlyValues = generateMonthlyValues(
        kpi.code,
        YEAR,
        kpi.sampleValues.q1,
        kpi.sampleValues.q2,
        kpi.sampleValues.q3,
        kpi.sampleValues.q4,
      )

      for (const mv of monthlyValues) {
        await db.indicatorValue.create({
          data: {
            indicatorId: indicator.id,
            value: mv.value,
            period: mv.period,
            year: mv.year,
            month: mv.month,
            quarter: mv.quarter,
          },
        })
        valuesCreated++
      }
    }
  }

  // 3. Summary
  const domains = ['governance', 'finance', 'operational', 'rh', 'risque', 'pta'] as const
  const domainLabels: Record<string, string> = {
    governance: 'Gouvernance',
    finance: 'Finance',
    operational: 'Opérationnel',
    rh: 'Ressources Humaines',
    risque: 'Cadre de Risque',
    pta: 'Plan de Travail Annuel',
  }

  console.log('═'.repeat(65))
  console.log('  ✅ Seed KPI terminé avec succès!')
  console.log('═'.repeat(65))

  for (const d of domains) {
    const count = await db.indicator.count({ where: { domain: d } })
    const subs = await db.indicator.groupBy({
      where: { domain: d },
      by: ['subDomain'],
      _count: true,
    })
    const subInfo = subs
      .map((s) => `    ${SUB_DOMAIN_LABELS[s.subDomain] || s.subDomain}: ${s._count}`)
      .join('\n')
    console.log(`\n  📊 ${domainLabels[d]} (${count} KPI):`)
    if (subInfo) console.log(subInfo)
  }

  console.log('\n' + '═'.repeat(65))
  console.log(`  📈 ${created} indicateurs créés`)
  console.log(`  📊 ${valuesCreated} valeurs mensuelles générées (${YEAR})`)
  console.log('═'.repeat(65))
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })