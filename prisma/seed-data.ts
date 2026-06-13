import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding projects, documents, alerts, settings...\n');

  // ─── Projects ──────────────────────────────────────────────────
  const projects = [
    { name: 'Extension réseau fibre optique', code: 'PROJ-001', status: 'en_cours', priority: 'haute', progress: 65, budgetPlan: 500000000, budgetReal: 325000000, manager: 'M. Diallo Mamadou' },
    { name: 'Plateforme de téléservices', code: 'PROJ-002', status: 'en_cours', priority: 'haute', progress: 40, budgetPlan: 300000000, budgetReal: 120000000, manager: 'M. Bamba Koffi' },
    { name: 'Couverture 4G zones rurales', code: 'PROJ-003', status: 'planifie', priority: 'haute', progress: 10, budgetPlan: 800000000, budgetReal: 0, manager: 'M. Diallo Mamadou' },
    { name: 'Modernisation du datacenter', code: 'PROJ-004', status: 'en_cours', priority: 'moyenne', progress: 75, budgetPlan: 200000000, budgetReal: 150000000, manager: 'M. Bamba Koffi' },
    { name: 'Audit de sécurité SI', code: 'PROJ-005', status: 'termine', priority: 'haute', progress: 100, budgetPlan: 50000000, budgetReal: 48000000, manager: 'M. Bamba Koffi' },
    { name: 'Déploiement VSAT 200 sites', code: 'PROJ-006', status: 'en_cours', priority: 'haute', progress: 55, budgetPlan: 600000000, budgetReal: 330000000, manager: 'M. Diallo Mamadou' },
    { name: 'Formation personnel SI', code: 'PROJ-007', status: 'termine', priority: 'basse', progress: 100, budgetPlan: 20000000, budgetReal: 19500000, manager: 'Mme Traoré Awa' },
    { name: 'Refonte site web institutionnel', code: 'PROJ-008', status: 'planifie', priority: 'basse', progress: 5, budgetPlan: 25000000, budgetReal: 0, manager: 'M. Bamba Koffi' },
    { name: 'Migration cloud ERP', code: 'PROJ-009', status: 'suspendu', priority: 'moyenne', progress: 30, budgetPlan: 150000000, budgetReal: 45000000, manager: 'M. Konaté Seydou' },
    { name: 'Cybersécurité infrastructure critique', code: 'PROJ-010', status: 'en_cours', priority: 'haute', progress: 20, budgetPlan: 350000000, budgetReal: 70000000, manager: 'M. Bamba Koffi' },
  ];

  for (const p of projects) {
    await db.project.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    });
  }
  console.log(`  ✓ ${projects.length} projets`);

  // ─── Documents ─────────────────────────────────────────────────
  const docs = [
    { name: 'Procès-verbal CA Q1 2025', url: 'https://ansut.ci/share/pv-ca-q1-2025', type: 'sharepoint', module: 'governance', visibility: 'all' },
    { name: 'Rapport financier annuel 2024', url: 'https://ansut.ci/share/rapport-financier-2024', type: 'sharepoint', module: 'finance', visibility: 'all' },
    { name: 'Budget prévisionnel 2025', url: 'https://ansut.ci/share/budget-2025', type: 'sharepoint', module: 'finance', visibility: 'all' },
    { name: 'Plan de déploiement fibre', url: 'https://ansut.ci/share/plan-fibre-2025', type: 'sharepoint', module: 'operational', visibility: 'all' },
    { name: 'Rapport d\'activités DG 2024', url: 'https://ansut.ci/share/rapport-dg-2024', type: 'sharepoint', module: 'governance', visibility: 'all' },
    { name: 'Politique RH 2025', url: 'https://ansut.ci/share/politique-rh-2025', type: 'sharepoint', module: 'rh', visibility: 'all' },
    { name: 'Matrice des Risques', url: 'https://ansut.ci/share/matrice-risques-2025', type: 'sharepoint', module: 'risque', visibility: 'all' },
    { name: 'PTA 2025 - Version approuvée', url: 'https://ansut.ci/share/pta-2025', type: 'sharepoint', module: 'pta', visibility: 'all' },
    { name: 'Convention Etat-ANSUT 2025', url: 'https://ansut.ci/share/convention-2025', type: 'lien', module: 'governance', visibility: 'DG,PMO' },
    { name: 'Indicateurs Mensuels - Dashboard Power BI', url: 'https://app.powerbi.com/report/ansut', type: 'lien', module: 'accueil', visibility: 'all' },
  ];

  for (const d of docs) {
    await db.document.create({ data: d });
  }
  console.log(`  ✓ ${docs.length} documents`);

  // ─── Alerts ─────────────────────────────────────────────────────
  const alerts = [
    { type: 'kpi', severity: 'warning', title: 'Seuil d\'alerte approché', message: 'Délai de transmission des états financiers proche du seuil d\'alerte (18/20 jours)', source: 'GOV-001', isRead: false, isResolved: false },
    { type: 'kpi', severity: 'critical', title: 'Seuil critique dépassé', message: 'Taux d\'exécution des marchés publics sous le seuil critique (48%)', source: 'GOV-015', isRead: false, isResolved: false },
    { type: 'technique', severity: 'warning', title: 'Synchronisation DataSource', message: 'La source "Infrastructure DB" n\'a pas été synchronisée depuis 48h', source: 'infra-db', isRead: false, isResolved: false },
    { type: 'kpi', severity: 'info', title: 'Nouveau KPI disponible', message: '5 nouveaux indicateurs opérationnels ont été ajoutés au module', source: null, isRead: false, isResolved: false },
    { type: 'securite', severity: 'critical', title: 'Tentative d\'accès suspecte', message: 'Multiples tentatives de connexion échouées détectées', source: 'security-log', isRead: false, isResolved: false },
  ];

  for (const a of alerts) {
    await db.alert.create({ data: a });
  }
  console.log(`  ✓ ${alerts.length} alertes`);

  // ─── System Settings ────────────────────────────────────────────
  const settings = [
    { key: 'app_name', value: JSON.stringify('Cockpit DG ANSUT') },
    { key: 'app_version', value: JSON.stringify('1.0.0') },
    { key: 'refresh_interval', value: JSON.stringify(300) },
    { key: 'timezone', value: JSON.stringify('Africa/Abidjan') },
  ];

  for (const s of settings) {
    await db.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log(`  ✓ ${settings.length} paramètres`);

  console.log('\n✅ Seed complémentaire terminé !');
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(() => db.$disconnect());
