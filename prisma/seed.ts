import { db } from '../src/lib/db';

async function seed() {
  console.log('🌱 Seeding database...');

  // Departments
  const departments = await Promise.all([
    db.department.create({ data: { name: 'Direction Générale', code: 'DG', headName: 'Directeur Général' } }),
    db.department.create({ data: { name: 'Direction Financière et Comptable', code: 'DFC', headName: 'M. Koné Ibrahim' } }),
    db.department.create({ data: { name: 'Direction des Ressources Humaines', code: 'DRH', headName: 'Mme Traoré Awa' } }),
    db.department.create({ data: { name: 'Direction Technique', code: 'DT', headName: 'M. Diallo Mamadou' } }),
    db.department.create({ data: { name: 'Direction des Marchés Publics', code: 'DMP', headName: 'M. Ouattara Yves' } }),
    db.department.create({ data: { name: 'Bureau du PMO', code: 'PMO', headName: 'Mme Sanogo Mariam' } }),
    db.department.create({ data: { name: 'Service Informatique', code: 'SI', headName: 'M. Coulibaly Adama' } }),
    db.department.create({ data: { name: 'Service Communication', code: 'SC', headName: 'Mme Bamba Fatou' } }),
  ]);

  const deptMap = new Map(departments.map(d => [d.code, d.id]));

  // Users
  await Promise.all([
    db.user.create({ data: { email: 'dg@ansut.ci', name: 'Directeur Général', role: 'DG' } }),
    db.user.create({ data: { email: 'pmo@ansut.ci', name: 'PMO', role: 'PMO' } }),
    db.user.create({ data: { email: 'dfc@ansut.ci', name: 'Directeur Financier', role: 'DFC' } }),
    db.user.create({ data: { email: 'drh@ansut.ci', name: 'Directeur RH', role: 'DJMG' } }),
  ]);

  // Indicators
  const indicators = [
    // FINANCE
    { name: "Taux d'exécution budgétaire", code: 'FIN-001', domain: 'finance', subDomain: 'budget', unit: '%', targetValue: 85, formula: '(Dépenses réelles / Budget prévu) × 100', frequency: 'mensuel', sourceSystem: 'ERP', departmentId: deptMap.get('DFC'), order: 1 },
    { name: "Chiffre d'Affaires (CA)", code: 'FIN-002', domain: 'finance', subDomain: 'budget', unit: 'FCFA', targetValue: 5000000000, formula: 'Somme des revenus opérationnels', frequency: 'mensuel', sourceSystem: 'ERP', departmentId: deptMap.get('DFC'), order: 2 },
    { name: "Excédent Brut d'Exploitation (EBE)", code: 'FIN-003', domain: 'finance', subDomain: 'rentabilite', unit: 'FCFA', targetValue: 1500000000, formula: "CA - Charges d'exploitation", frequency: 'trimestriel', sourceSystem: 'ERP', departmentId: deptMap.get('DFC'), order: 3 },
    { name: "Marge brute", code: 'FIN-004', domain: 'finance', subDomain: 'rentabilite', unit: '%', targetValue: 45, formula: '(EBE / CA) × 100', frequency: 'trimestriel', sourceSystem: 'ERP', departmentId: deptMap.get('DFC'), order: 4 },
    { name: "Résultat net", code: 'FIN-005', domain: 'finance', subDomain: 'rentabilite', unit: 'FCFA', targetValue: 800000000, formula: "EBE - Charges financières - Impôts", frequency: 'trimestriel', sourceSystem: 'ERP', departmentId: deptMap.get('DFC'), order: 5 },
    { name: "Taux d'endettement", code: 'FIN-006', domain: 'finance', subDomain: 'dette', unit: '%', targetValue: 30, formula: '(Dettes totales / Capitaux propres) × 100', frequency: 'trimestriel', sourceSystem: 'ERP', departmentId: deptMap.get('DFC'), order: 6 },
    { name: "Capacité de remboursement", code: 'FIN-007', domain: 'finance', subDomain: 'dette', unit: 'mois', targetValue: 24, formula: 'Dettes totales / EBE mensuel', frequency: 'trimestriel', sourceSystem: 'ERP', departmentId: deptMap.get('DFC'), order: 7 },
    { name: "Ressources Backbone", code: 'FIN-008', domain: 'finance', subDomain: 'ressources_specifiques', unit: 'FCFA', targetValue: 2000000000, formula: "Revenus d'exploitation backbone", frequency: 'mensuel', sourceSystem: 'ERP', departmentId: deptMap.get('DFC'), order: 8 },
    { name: "Total des charges", code: 'FIN-009', domain: 'finance', subDomain: 'budget', unit: 'FCFA', targetValue: 3500000000, formula: 'Somme des charges opérationnelles', frequency: 'mensuel', sourceSystem: 'ERP', departmentId: deptMap.get('DFC'), order: 9 },
    { name: "Rentabilité financière (ROE)", code: 'FIN-010', domain: 'finance', subDomain: 'rentabilite', unit: '%', targetValue: 15, formula: '(Résultat net / Capitaux propres) × 100', frequency: 'annuel', sourceSystem: 'ERP', departmentId: deptMap.get('DFC'), order: 10 },

    // GOUVERNANCE
    { name: "Taux de conformité marchés publics", code: 'GOV-001', domain: 'governance', subDomain: 'conformite', unit: '%', targetValue: 95, formula: '(Marchés conformes / Total marchés) × 100', frequency: 'trimestriel', sourceSystem: 'manuel', departmentId: deptMap.get('DMP'), order: 1 },
    { name: "Délai moyen de transmission rapports", code: 'GOV-002', domain: 'governance', subDomain: 'reporting', unit: 'jours', targetValue: 5, formula: 'Délai entre échéance et soumission', frequency: 'mensuel', sourceSystem: 'manuel', departmentId: deptMap.get('PMO'), order: 2 },
    { name: "Nombre de réunions CA", code: 'GOV-003', domain: 'governance', subDomain: 'conformite', unit: 'nombre', targetValue: 4, formula: 'Nombre de sessions CA tenues', frequency: 'trimestriel', sourceSystem: 'manuel', departmentId: deptMap.get('DG'), order: 3 },
    { name: "Taux de conformité réglementaire", code: 'GOV-004', domain: 'governance', subDomain: 'conformite', unit: '%', targetValue: 90, formula: '(Conformes / Total) × 100', frequency: 'trimestriel', sourceSystem: 'manuel', departmentId: deptMap.get('DG'), order: 4 },
    { name: "Audits réalisés", code: 'GOV-005', domain: 'governance', subDomain: 'audit', unit: 'nombre', targetValue: 6, formula: 'Nombre audits internes achevés', frequency: 'annuel', sourceSystem: 'manuel', departmentId: deptMap.get('DG'), order: 5 },
    { name: "Actions correctives mises en œuvre", code: 'GOV-006', domain: 'governance', subDomain: 'audit', unit: '%', targetValue: 80, formula: '(Actions clôturées / Actions ouvertes) × 100', frequency: 'trimestriel', sourceSystem: 'manuel', departmentId: deptMap.get('DG'), order: 6 },

    // OPERATIONNEL
    { name: "Taux d'avancement PTA global", code: 'OPS-001', domain: 'operational', subDomain: 'pta', unit: '%', targetValue: 80, formula: '(Activités réalisées / Activités planifiées) × 100', frequency: 'mensuel', sourceSystem: 'manuel', departmentId: deptMap.get('PMO'), order: 1 },
    { name: "Projets en cours", code: 'OPS-002', domain: 'operational', subDomain: 'projets', unit: 'nombre', targetValue: 12, formula: 'Nombre projets actifs', frequency: 'mensuel', sourceSystem: 'manuel', departmentId: deptMap.get('PMO'), order: 2 },
    { name: "Taux d'achèvement projets", code: 'OPS-003', domain: 'operational', subDomain: 'projets', unit: '%', targetValue: 75, formula: '(Projets terminés / Projets planifiés) × 100', frequency: 'trimestriel', sourceSystem: 'manuel', departmentId: deptMap.get('PMO'), order: 3 },
    { name: "Sites déployés", code: 'OPS-004', domain: 'operational', subDomain: 'infrastructure', unit: 'nombre', targetValue: 50, formula: 'Nombre de sites opérationnels', frequency: 'trimestriel', sourceSystem: 'manuel', departmentId: deptMap.get('DT'), order: 4 },
    { name: "Taux de disponibilité réseau", code: 'OPS-005', domain: 'operational', subDomain: 'infrastructure', unit: '%', targetValue: 99.5, formula: '(Uptime / Total time) × 100', frequency: 'mensuel', sourceSystem: 'API', departmentId: deptMap.get('SI'), order: 5 },
    { name: "SLA respecté", code: 'OPS-006', domain: 'operational', subDomain: 'performance', unit: '%', targetValue: 95, formula: '(Incidents résolus dans SLA / Total incidents) × 100', frequency: 'mensuel', sourceSystem: 'API', departmentId: deptMap.get('SI'), order: 6 },

    // RH
    { name: "Effectif total", code: 'RH-001', domain: 'rh', subDomain: 'effectifs', unit: 'nombre', targetValue: 250, formula: 'Nombre total employés actifs', frequency: 'mensuel', sourceSystem: 'ERP', departmentId: deptMap.get('DRH'), order: 1 },
    { name: "Masse salariale totale", code: 'RH-002', domain: 'rh', subDomain: 'masse_salariale', unit: 'FCFA', targetValue: 300000000, formula: 'Somme des rémunérations brutes', frequency: 'mensuel', sourceSystem: 'ERP', departmentId: deptMap.get('DRH'), order: 2 },
    { name: "Taux de rotation du personnel", code: 'RH-003', domain: 'rh', subDomain: 'effectifs', unit: '%', targetValue: 8, formula: '(Départs / Effectif moyen) × 100', frequency: 'annuel', sourceSystem: 'ERP', departmentId: deptMap.get('DRH'), order: 3 },
    { name: "Ratio masse salariale / CA", code: 'RH-004', domain: 'rh', subDomain: 'productivite', unit: '%', targetValue: 35, formula: '(Masse salariale / CA) × 100', frequency: 'trimestriel', sourceSystem: 'ERP', departmentId: deptMap.get('DRH'), order: 4 },
    { name: "Taux de formation", code: 'RH-005', domain: 'rh', subDomain: 'competences', unit: '%', targetValue: 60, formula: '(Employés formés / Effectif total) × 100', frequency: 'annuel', sourceSystem: 'manuel', departmentId: deptMap.get('DRH'), order: 5 },
    { name: "Productivité par employé", code: 'RH-006', domain: 'rh', subDomain: 'productivite', unit: 'FCFA', targetValue: 20000000, formula: 'CA / Effectif total', frequency: 'trimestriel', sourceSystem: 'ERP', departmentId: deptMap.get('DRH'), order: 6 },
    { name: "Nombre de recrutements", code: 'RH-007', domain: 'rh', subDomain: 'effectifs', unit: 'nombre', targetValue: 15, formula: 'Recrutements sur la période', frequency: 'trimestriel', sourceSystem: 'manuel', departmentId: deptMap.get('DRH'), order: 7 },

    // RISQUE
    { name: "Indice de risque global", code: 'RSK-001', domain: 'risque', subDomain: 'indicateurs', unit: 'score', targetValue: 2, formula: 'Moyenne pondérée des risques', frequency: 'trimestriel', sourceSystem: 'manuel', departmentId: deptMap.get('DG'), order: 1 },
    { name: "Incidents de sécurité", code: 'RSK-002', domain: 'risque', subDomain: 'securite', unit: 'nombre', targetValue: 0, formula: 'Nombre incidents signalés', frequency: 'mensuel', sourceSystem: 'manuel', departmentId: deptMap.get('SI'), order: 2 },
    { name: "Taux de conformité contrôle interne", code: 'RSK-003', domain: 'risque', subDomain: 'controle', unit: '%', targetValue: 85, formula: '(Contrôles conformes / Total contrôles) × 100', frequency: 'trimestriel', sourceSystem: 'manuel', departmentId: deptMap.get('DG'), order: 3 },
    { name: "Risques identifiés non traités", code: 'RSK-004', domain: 'risque', subDomain: 'indicateurs', unit: 'nombre', targetValue: 0, formula: 'Risques ouverts sans action', frequency: 'mensuel', sourceSystem: 'manuel', departmentId: deptMap.get('DG'), order: 4 },
    { name: "Taux de traitement des risques", code: 'RSK-005', domain: 'risque', subDomain: 'controle', unit: '%', targetValue: 90, formula: '(Risques traités / Risques identifiés) × 100', frequency: 'trimestriel', sourceSystem: 'manuel', departmentId: deptMap.get('DG'), order: 5 },

    // PTA
    { name: "Taux de réalisation PTA", code: 'PTA-001', domain: 'pta', subDomain: 'global', unit: '%', targetValue: 85, formula: '(Activités réalisées / Activités planifiées) × 100', frequency: 'mensuel', sourceSystem: 'manuel', departmentId: deptMap.get('PMO'), order: 1 },
    { name: "Projets structurants en cours", code: 'PTA-002', domain: 'pta', subDomain: 'projets_structurants', unit: 'nombre', targetValue: 5, formula: 'Projets stratégiques actifs', frequency: 'trimestriel', sourceSystem: 'manuel', departmentId: deptMap.get('PMO'), order: 2 },
    { name: "Indicateur performance globale", code: 'PTA-003', domain: 'pta', subDomain: 'performance', unit: 'score', targetValue: 4, formula: 'Score composite KPI', frequency: 'trimestriel', sourceSystem: 'manuel', departmentId: deptMap.get('PMO'), order: 3 },
    { name: "Budget PTA consommé", code: 'PTA-004', domain: 'pta', subDomain: 'budget', unit: '%', targetValue: 80, formula: '(Dépenses PTA / Budget PTA) × 100', frequency: 'mensuel', sourceSystem: 'ERP', departmentId: deptMap.get('DFC'), order: 4 },
  ];

  const createdIndicators: Record<string, string> = {};
  for (const ind of indicators) {
    const created = await db.indicator.create({ data: ind as any });
    createdIndicators[ind.code] = created.id;
  }

  // Generate indicator values for 2024 and 2025
  const valueData: Array<{ indicatorId: string; value: number; period: string; year: number; month: number; quarter: number; departmentId?: string; comment?: string }> = [];

  const financeValues = {
    'FIN-001': [78, 82, 85, 80, 83, 87, 79, 84, 88, 81, 86, 83], // % budget execution
    'FIN-002': [380, 420, 450, 390, 460, 510, 430, 470, 520, 440, 490, 500], // M FCFA CA
    'FIN-003': [95, 110, 125, 100, 115, 135, 105, 120, 140, 108, 130, 145], // M FCFA EBE
    'FIN-004': [25, 26.2, 27.8, 25.6, 25, 26.5, 24.4, 25.5, 26.9, 24.5, 26.5, 29], // % marge
    'FIN-005': [45, 55, 68, 48, 58, 72, 50, 62, 78, 52, 70, 82], // M FCFA resultat
    'FIN-006': [42, 40, 38, 39, 37, 35, 38, 36, 34, 37, 35, 32], // % endettement
    'FIN-007': [36, 34, 32, 33, 31, 28, 32, 30, 27, 31, 28, 25], // mois
    'FIN-008': [120, 135, 150, 128, 142, 165, 135, 148, 170, 140, 158, 175], // M FCFA backbone
    'FIN-009': [280, 310, 325, 290, 345, 375, 325, 350, 380, 332, 360, 355], // M FCFA charges
    'FIN-010': [10, 11, 12, 11.5, 12.5, 13, 12, 12.8, 14, 12.5, 13.5, 15], // % ROE
  };

  const govValues = {
    'GOV-001': [88, 90, 92, 91, 93, 95, 92, 94, 96, 93, 95, 97],
    'GOV-002': [8, 7, 6, 7, 6, 5, 6, 5, 4, 5, 4, 3],
    'GOV-003': [3, 4, 3, 4, 4, 4, 3, 4, 4, 4, 4, 4],
    'GOV-004': [82, 84, 86, 85, 87, 89, 86, 88, 90, 88, 90, 92],
    'GOV-005': [1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5],
    'GOV-006': [60, 62, 65, 68, 70, 72, 74, 76, 78, 80, 82, 85],
  };

  const opsValues = {
    'OPS-001': [55, 58, 62, 65, 68, 72, 70, 73, 76, 74, 77, 80],
    'OPS-002': [8, 9, 9, 10, 10, 11, 10, 11, 11, 12, 12, 12],
    'OPS-003': [45, 48, 52, 55, 58, 62, 60, 63, 67, 65, 68, 72],
    'OPS-004': [32, 34, 35, 37, 38, 40, 41, 42, 44, 45, 47, 48],
    'OPS-005': [98.2, 98.5, 98.8, 99.0, 99.1, 99.2, 98.9, 99.3, 99.4, 99.2, 99.5, 99.6],
    'OPS-006': [88, 89, 90, 91, 92, 93, 91, 93, 94, 92, 95, 96],
  };

  const rhValues = {
    'RH-001': [230, 232, 234, 235, 238, 240, 241, 243, 245, 246, 248, 250],
    'RH-002': [245, 248, 250, 252, 255, 258, 260, 262, 265, 268, 270, 275],
    'RH-003': [12, 11, 10, 10, 9, 9, 8, 8, 8, 7, 8, 7],
    'RH-004': [40, 39, 38, 37, 36.5, 36, 35.5, 35, 34.5, 35, 34, 33],
    'RH-005': [35, 38, 40, 42, 45, 48, 50, 52, 55, 57, 59, 62],
    'RH-006': [16.5, 17, 17.8, 18, 18.5, 19, 19.2, 19.5, 20, 19.8, 20.5, 21],
    'RH-007': [2, 3, 4, 3, 5, 4, 3, 4, 5, 3, 4, 4],
  };

  const riskValues = {
    'RSK-001': [3.5, 3.2, 3, 2.8, 2.5, 2.3, 2.5, 2.2, 2, 2.1, 1.8, 1.5],
    'RSK-002': [2, 1, 3, 1, 0, 2, 1, 0, 1, 0, 1, 0],
    'RSK-003': [72, 74, 76, 78, 80, 82, 79, 83, 85, 82, 86, 88],
    'RSK-004': [5, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1, 0],
    'RSK-005': [70, 73, 76, 79, 82, 84, 81, 85, 88, 85, 90, 93],
  };

  const ptaValues = {
    'PTA-001': [50, 55, 60, 63, 67, 72, 70, 74, 78, 76, 80, 83],
    'PTA-002': [2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 5],
    'PTA-003': [2.5, 2.8, 3.0, 3.2, 3.3, 3.5, 3.4, 3.6, 3.8, 3.7, 3.9, 4.0],
    'PTA-004': [55, 58, 62, 65, 68, 72, 70, 73, 76, 74, 77, 80],
  };

  const allValueSets = [financeValues, govValues, opsValues, rhValues, riskValues, ptaValues];

  for (let year = 2024; year <= 2025; year++) {
    for (const valueSet of allValueSets) {
      for (const [code, values] of Object.entries(valueSet)) {
        const indicatorId = createdIndicators[code];
        if (!indicatorId) continue;

        for (let month = 0; month < 12; month++) {
          if (year === 2025 && month > 5) continue; // Only through June 2025

          const value = values[month];
          const period = `${year}-${String(month + 1).padStart(2, '0')}`;
          valueData.push({
            indicatorId,
            value: typeof value === 'number' ? value : 0,
            period,
            year,
            month: month + 1,
            quarter: Math.ceil((month + 1) / 3),
          });
        }
      }
    }
  }

  // Insert in batches
  const batchSize = 500;
  for (let i = 0; i < valueData.length; i += batchSize) {
    const batch = valueData.slice(i, i + batchSize);
    await db.indicatorValue.createMany({ data: batch as any });
  }

  // Projects
  const projects = [
    { name: "Déploiement Backbone Fibre Optique", code: 'PRJ-001', description: "Extension du réseau backbone fibre sur 500km", status: 'en_cours', priority: 'critique', budgetPlan: 3000000000, budgetReal: 1850000000, progress: 62, departmentId: deptMap.get('DT'), manager: 'M. Diallo Mamadou' },
    { name: "Migration Plateforme Cloud", code: 'PRJ-002', description: "Migration des systèmes vers le cloud hybride", status: 'en_cours', priority: 'haute', budgetPlan: 500000000, budgetReal: 280000000, progress: 56, departmentId: deptMap.get('SI'), manager: 'M. Coulibaly Adama' },
    { name: "Modernisation ERP SAGE", code: 'PRJ-003', description: "Mise à jour et intégration du système ERP", status: 'en_cours', priority: 'haute', budgetPlan: 200000000, budgetReal: 145000000, progress: 73, departmentId: deptMap.get('DFC'), manager: 'M. Koné Ibrahim' },
    { name: "Programme de Formation Continue", code: 'PRJ-004', description: "Formation certifiante pour les cadres techniques", status: 'en_cours', priority: 'moyenne', budgetPlan: 50000000, budgetReal: 22000000, progress: 44, departmentId: deptMap.get('DRH'), manager: 'Mme Traoré Awa' },
    { name: "Renforcement Sécurité SI", code: 'PRJ-005', description: "Audit et renforcement de la cybersécurité", status: 'en_cours', priority: 'critique', budgetPlan: 150000000, budgetReal: 95000000, progress: 63, departmentId: deptMap.get('SI'), manager: 'M. Coulibaly Adama' },
    { name: "Expansion Réseau 4G/LTE", code: 'PRJ-006', description: "Déploiement de 100 nouveaux sites 4G", status: 'en_cours', priority: 'critique', budgetPlan: 5000000000, budgetReal: 3200000000, progress: 64, departmentId: deptMap.get('DT'), manager: 'M. Diallo Mamadou' },
    { name: "Portail Client Digital", code: 'PRJ-007', description: "Création d'un portail self-service client", status: 'en_cours', priority: 'haute', budgetPlan: 80000000, budgetReal: 52000000, progress: 65, departmentId: deptMap.get('SI'), manager: 'Mme Bamba Fatou' },
    { name: "Optimisation Processus Métier", code: 'PRJ-008', description: "Réingénierie des processus internes", status: 'planifie', priority: 'moyenne', budgetPlan: 30000000, budgetReal: 5000000, progress: 17, departmentId: deptMap.get('PMO'), manager: 'Mme Sanogo Mariam' },
    { name: "Centre de Données Secondaire", code: 'PRJ-009', description: "Construction d'un datacenter de secours", status: 'en_cours', priority: 'critique', budgetPlan: 2000000000, budgetReal: 1100000000, progress: 55, departmentId: deptMap.get('DT'), manager: 'M. Diallo Mamadou' },
    { name: "Programme Digitalisation RH", code: 'PRJ-010', description: "SIRH et gestion électronique des documents", status: 'en_cours', priority: 'moyenne', budgetPlan: 40000000, budgetReal: 25000000, progress: 63, departmentId: deptMap.get('DRH'), manager: 'Mme Traoré Awa' },
    { name: "Mise en conformité RGPD", code: 'PRJ-011', description: "Adaptation aux normes de protection des données", status: 'en_cours', priority: 'haute', budgetPlan: 25000000, budgetReal: 18000000, progress: 72, departmentId: deptMap.get('DG'), manager: 'Mme Sanogo Mariam' },
    { name: "Interconnexion Régionale", code: 'PRJ-012', description: "Connexion aux réseaux sous-régionaux", status: 'planifie', priority: 'haute', budgetPlan: 800000000, budgetReal: 0, progress: 5, departmentId: deptMap.get('DT'), manager: 'M. Diallo Mamadou' },
  ];

  await db.project.createMany({ data: projects as any });

  console.log(`✅ Seed complete! ${indicators.length} indicators, ${valueData.length} values, ${projects.length} projects, ${departments.length} departments`);
}

seed()
  .catch(console.error)
  .finally(() => process.exit(0));
