import { preparations, preparationsById } from './mock-data';
import {
  PatientData, CDSSResult, RecommendationItem, SafetyFlag,
  SafetyStatus, DiagnosticTest, LifestyleAdvice, DrugInteraction,
} from './types';

function normalise(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function patientDrugList(patient: PatientData): string[] {
  return [...patient.medications, ...patient.supplements];
}

function findInteractionsForPatient(
  prepId: string,
  patient: PatientData,
): DrugInteraction[] {
  const prep = preparationsById.get(prepId);
  if (!prep) return [];
  const patientDrugs = patientDrugList(patient).map(normalise);
  return prep.interactions.filter(i =>
    patientDrugs.some(d => d.includes(normalise(i.drug)) || normalise(i.drug).includes(d)),
  );
}

function findContraindications(prepId: string, patient: PatientData): string[] {
  const prep = preparationsById.get(prepId);
  if (!prep) return [];
  const flags: string[] = [];

  const allConditions = [...patient.diseases, ...patient.symptoms].map(normalise);

  prep.contraindications.forEach(ci => {
    const ciNorm = normalise(ci);

    // Kidney-check: eGFR < 30 phrasing
    if (ciNorm.includes('egfr') && patient.age > 70) {
      flags.push(`Age >70 warrants eGFR assessment before initiating. Contraindicated if eGFR < 30.`);
    }

    // G6PD
    if (ciNorm.includes('g6pd') && allConditions.some(c => c.includes('g6pd'))) {
      flags.push(`G6PD deficiency documented: ${ci}`);
    }

    // Pregnancy
    if (ciNorm.includes('pregnan') && patient.gender === 'female' && patient.age < 50) {
      flags.push(`Pregnancy status should be confirmed: ${ci}`);
    }

    // Hyperthyroidism
    if (ciNorm.includes('hyperthyroid') && allConditions.some(c => c.includes('hyperthyroid'))) {
      flags.push(`Active hyperthyroidism is a contraindication: ${ci}`);
    }

    // Liver disease / cirrhosis
    if ((ciNorm.includes('liver') || ciNorm.includes('hepatic') || ciNorm.includes('cirrhosis'))
      && allConditions.some(c => c.includes('liver') || c.includes('hepat') || c.includes('cirrhosis'))) {
      flags.push(`Hepatic condition on record. Contraindication: ${ci}`);
    }

    // Active malignancy
    if (ciNorm.includes('malignan') && allConditions.some(c => c.includes('cancer'))) {
      flags.push(`Active malignancy concern: ${ci}`);
    }

    // Bipolar
    if (ciNorm.includes('bipolar') && allConditions.some(c => c.includes('bipolar'))) {
      flags.push(`Bipolar disorder is a contraindication: ${ci}`);
    }
  });

  return flags;
}

function safetyStatus(interactions: DrugInteraction[], contraindications: string[]): SafetyStatus {
  if (contraindications.length > 0) return 'CONTRAINDICATED';
  if (interactions.some(i => i.severity === 'major')) return 'CONTRAINDICATED';
  if (interactions.some(i => i.severity === 'moderate')) return 'WARNING';
  return 'SAFE';
}

function scorePreparation(prepId: string, patient: PatientData): number {
  const prep = preparationsById.get(prepId);
  if (!prep) return 0;

  const allPatientTerms = [
    ...patient.diseases, ...patient.symptoms,
  ].map(normalise);

  let score = 0;

  // EBM level boost
  score += { A: 40, B: 30, C: 15, D: 0 }[prep.ebmLevel] ?? 0;

  // Indication match
  const matched = prep.indications.filter(ind =>
    allPatientTerms.some(t => normalise(ind).includes(t) || t.includes(normalise(ind))),
  );
  score += matched.length * 15;

  // Penalise major interactions with patient's drugs
  const interactions = findInteractionsForPatient(prepId, patient);
  score -= interactions.filter(i => i.severity === 'major').length * 50;
  score -= interactions.filter(i => i.severity === 'moderate').length * 20;

  // Penalise contraindications
  const contras = findContraindications(prepId, patient);
  score -= contras.length * 60;

  // Penalise D-level extremely
  if (prep.ebmLevel === 'D') score -= 100;

  return score;
}

function getMatchedIndications(prepId: string, patient: PatientData): string[] {
  const prep = preparationsById.get(prepId);
  if (!prep) return [];
  const allPatientTerms = [...patient.diseases, ...patient.symptoms].map(normalise);
  return prep.indications.filter(ind =>
    allPatientTerms.some(t => normalise(ind).includes(t) || t.includes(normalise(ind))),
  );
}

function buildDiagnosticTests(patient: PatientData): DiagnosticTest[] {
  const tests: DiagnosticTest[] = [];
  const allTerms = [...patient.diseases, ...patient.symptoms].map(normalise);
  const has = (term: string) => allTerms.some(t => t.includes(normalise(term)));

  // Baseline renal for any IV therapy
  tests.push({ name: 'eGFR / Serum Creatinine', reason: 'Required before any IV micronutrient therapy to assess renal safety.', urgency: 'required', category: 'renal' });
  tests.push({ name: 'ALT / AST / GGT', reason: 'Baseline hepatic enzymes required before supplementation affecting liver.', urgency: 'required', category: 'hepatic' });

  if (has('diabetes') || has('metabolic')) {
    tests.push({ name: 'HbA1c', reason: 'Glycaemic control assessment before adding glucose-modifying supplements (ALA, Berberine).', urgency: 'required', category: 'metabolic' });
    tests.push({ name: 'Fasting Glucose & Insulin', reason: 'Establishes insulin resistance baseline for targeted supplementation.', urgency: 'required', category: 'metabolic' });
  }

  if (has('thyroid') || has('hashimoto') || has('hypothyroid') || has('hyperthyroid')) {
    tests.push({ name: 'TSH, Free T3, Free T4', reason: 'Thyroid function optimisation required before selenium, iodine, or ashwagandha.', urgency: 'required', category: 'thyroid' });
    tests.push({ name: 'Anti-TPO Antibodies', reason: 'To assess autoimmune thyroid burden and monitor selenium/iodine response.', urgency: 'recommended', category: 'thyroid' });
  }

  if (has('fatigue') || has('anaemia') || has('iron')) {
    tests.push({ name: 'Ferritin, Serum Iron, TIBC, Transferrin Saturation', reason: 'Iron status panel required to differentiate iron deficiency from functional fatigue.', urgency: 'required', category: 'hematology' });
    tests.push({ name: 'CBC with Differential', reason: 'Full blood count to assess haematological status.', urgency: 'required', category: 'hematology' });
  }

  if (has('fatigue') || has('neuropathy') || has('cogniti')) {
    tests.push({ name: 'Vitamin B12 (serum + MMA preferred)', reason: 'B12 deficiency is common in Metformin users and presents as fatigue and neuropathy.', urgency: 'required', category: 'nutritional' });
    tests.push({ name: 'Red Cell Folate', reason: 'Folate status for methylation cycle and homocysteine assessment.', urgency: 'recommended', category: 'nutritional' });
    tests.push({ name: 'Homocysteine (fasting)', reason: 'Elevated homocysteine indicates methylation deficiency and cardiovascular risk.', urgency: 'recommended', category: 'metabolic' });
  }

  tests.push({ name: '25-OH Vitamin D3', reason: 'Vitamin D deficiency highly prevalent; affects immune function, bone health, and mood.', urgency: 'required', category: 'nutritional' });

  if (has('nafld') || has('liver') || has('hepatic')) {
    tests.push({ name: 'Liver Ultrasound', reason: 'Imaging required to grade hepatic steatosis severity before hepatoprotective supplementation.', urgency: 'recommended', category: 'hepatic' });
    tests.push({ name: 'FIB-4 Score (ALT + AST + platelets + age)', reason: 'Non-invasive hepatic fibrosis scoring to guide management intensity.', urgency: 'recommended', category: 'hepatic' });
  }

  if (has('dyslipid') || has('cholesterol') || has('cardiovascular')) {
    tests.push({ name: 'Full Lipid Panel (LDL, HDL, TG, non-HDL)', reason: 'Baseline lipids required before adding omega-3, berberine, or CoQ10.', urgency: 'required', category: 'cardiac' });
    tests.push({ name: 'hs-CRP (high-sensitivity CRP)', reason: 'Inflammatory marker correlates with cardiovascular risk and guides anti-inflammatory supplementation.', urgency: 'recommended', category: 'cardiac' });
  }

  if (has('neuropath') || has('tingling') || has('numbness')) {
    tests.push({ name: 'Serum Magnesium (RBC preferred)', reason: 'Magnesium deficiency is a common cause of neuropathy; standard serum Mg is insensitive.', urgency: 'recommended', category: 'nutritional' });
    tests.push({ name: 'Nerve Conduction Studies (NCS)', reason: 'Baseline NCS for neuropathy characterisation and monitoring response to ALA/ALCAR.', urgency: 'recommended', category: 'metabolic' });
  }

  if (patient.medications.some(m => normalise(m).includes('metformin'))) {
    tests.push({ name: 'Serum B12 (annual)', reason: 'Metformin reduces ileal B12 absorption; annual monitoring is recommended in all Metformin users.', urgency: 'required', category: 'nutritional' });
  }

  if (patient.medications.some(m => normalise(m).includes('statin'))) {
    tests.push({ name: 'CK (Creatine Kinase)', reason: 'Baseline CK before CoQ10 initiation in statin users; monitors for myopathy.', urgency: 'recommended', category: 'metabolic' });
  }

  if (patient.age >= 50) {
    tests.push({ name: 'Selenium (serum)', reason: 'Selenium deficiency is common after age 50; required before IV selenium or high-dose supplementation.', urgency: 'optional', category: 'nutritional' });
    tests.push({ name: 'Zinc (serum)', reason: 'Zinc deficiency affects immune function and wound healing; assess before supplementation.', urgency: 'optional', category: 'nutritional' });
  }

  // Deduplicate by name
  const seen = new Set<string>();
  return tests.filter(t => {
    if (seen.has(t.name)) return false;
    seen.add(t.name);
    return true;
  });
}

function buildLifestyleAdvice(patient: PatientData): LifestyleAdvice[] {
  const advice: LifestyleAdvice[] = [];
  const allTerms = [...patient.diseases, ...patient.symptoms].map(normalise);
  const has = (term: string) => allTerms.some(t => t.includes(normalise(term)));

  const bmi = patient.bmi;

  // BMI-based dietary
  if (bmi >= 30) {
    advice.push({ category: 'diet', title: 'Anti-Inflammatory Low-Glycaemic Diet', detail: `Your BMI of ${bmi.toFixed(1)} indicates obesity, which amplifies systemic inflammation. Adopt a Mediterranean-style diet: emphasise colourful vegetables, legumes, oily fish (3×/week), olive oil, and whole grains. Eliminate ultra-processed foods, refined sugar, and trans-fats. Target 500–750 kcal/day deficit for gradual fat loss (0.5–0.75 kg/week).`, priority: 'high' });
  } else if (bmi >= 25) {
    advice.push({ category: 'diet', title: 'Balanced Nutrient-Dense Diet', detail: `BMI ${bmi.toFixed(1)} indicates overweight. Optimise protein intake (1.2–1.6 g/kg/day), reduce refined carbohydrates, and increase fibre to ≥30 g/day through vegetables, legumes, and nuts.`, priority: 'medium' });
  }

  if (has('diabetes') || has('metabolic') || has('insulin')) {
    advice.push({ category: 'diet', title: 'Glycaemic Management Nutrition', detail: 'Distribute carbohydrates evenly across meals. Limit carbohydrate portions to 30–45 g per meal. Prioritise low-GI foods (legumes, non-starchy vegetables, berries). Avoid fruit juice, sugary beverages, and refined starch. Include 2 tbsp apple cider vinegar before meals to blunt post-prandial glucose spikes (evidence-based).', priority: 'high' });
  }

  if (has('nafld') || has('liver')) {
    advice.push({ category: 'diet', title: 'Hepatoprotective Diet for NAFLD', detail: 'Eliminate added sugar entirely — fructose is directly lipogenic in the liver. Avoid alcohol completely. Increase coffee consumption to 2–3 cups/day (decaf acceptable) — the only dietary intervention with Level A evidence for hepatic fibrosis regression. Supplement with choline-rich foods (eggs, lean meat).', priority: 'high' });
  }

  if (has('hypertension') || has('cardiovascular')) {
    advice.push({ category: 'diet', title: 'Cardiovascular-Optimised Diet (DASH/Mediterranean)', detail: 'Reduce sodium to < 2 g/day. Increase potassium through vegetables and legumes. DASH trial evidence: dietary modification reduces systolic BP by 8–14 mmHg. Limit saturated fat to < 7% of total calories. Include 30 g nuts daily (walnut preferred for omega-3 content).', priority: 'high' });
  }

  // Hydration
  advice.push({ category: 'hydration', title: 'Optimal Hydration Protocol', detail: `Target minimum ${(patient.weight * 0.035).toFixed(1)} L water/day (35 mL/kg). Begin each morning with 500 mL water before coffee. Adequate hydration reduces kidney stone risk (important for high-dose Vitamin C), improves cognitive performance, and optimises nutrient delivery from IV and oral supplementation.`, priority: 'medium' });

  // Sleep
  if (patient.lifestyle.sleepHours < 7) {
    advice.push({ category: 'sleep', title: 'Sleep Hygiene Optimisation (Priority)', detail: `Recorded ${patient.lifestyle.sleepHours}h sleep is insufficient. Chronic sleep deprivation elevates cortisol, impairs insulin sensitivity, and blunts immune function. Target 7–9 h. Maintain strict sleep/wake timing (±30 min). Avoid screens 1 h before bed. Keep bedroom at 17–19°C. Consider melatonin 0.5–2 mg 30 min before desired sleep onset. Evaluate for obstructive sleep apnoea if restorative sleep remains poor.`, priority: 'high' });
  }

  // Exercise
  if (bmi >= 25 || has('diabetes') || has('fatigue') || has('cardiovascular')) {
    advice.push({ category: 'exercise', title: 'Structured Physical Activity Programme', detail: 'Target 150 min/week of moderate-intensity aerobic activity (brisk walking, cycling, swimming) + 2 resistance training sessions. Exercise is the single most effective intervention for insulin resistance, NAFLD, and fatigue. Begin with 20 min walks daily if deconditioned; progress by 10% per week. Resistance training preserves muscle mass and improves glucose uptake independently of weight loss.', priority: 'high' });
  }

  // Stress
  if (has('anxiety') || has('stress') || has('fatigue') || has('insomnia')) {
    advice.push({ category: 'stress', title: 'Stress Reduction & HPA Axis Support', detail: 'Chronic psychological stress drives cortisol elevation, adrenal dysregulation, and immune suppression. Implement daily mind-body practice: 10–20 min diaphragmatic breathing (4-7-8 technique), progressive muscle relaxation, or mindfulness-based stress reduction (MBSR — Level A evidence for anxiety and fatigue). Consider heart-rate variability (HRV) biofeedback.', priority: 'medium' });
  }

  // Alcohol
  if (patient.lifestyle.alcohol === 'moderate' || patient.lifestyle.alcohol === 'heavy') {
    const intensity = patient.lifestyle.alcohol === 'heavy' ? 'heavy' : 'moderate';
    advice.push({ category: 'substance', title: `Alcohol Reduction (${intensity === 'heavy' ? 'Urgent' : 'Recommended'})`, detail: intensity === 'heavy'
      ? 'Heavy alcohol consumption directly worsens NAFLD, disrupts sleep architecture, depletes B-vitamins and magnesium, and interferes with numerous supplementation protocols. Medical alcohol reduction support should be offered. Target: complete cessation or < 7 units/week maximum.'
      : 'Moderate alcohol use worsens liver steatosis, disrupts sleep, and interacts with several supplements. Reduce to ≤ 1 unit/day for women, ≤ 2 units/day for men, and avoid alcohol on days when IV therapy is administered.', priority: intensity === 'heavy' ? 'high' : 'medium' });
  }

  // Smoking
  if (patient.lifestyle.smoking) {
    advice.push({ category: 'substance', title: 'Smoking Cessation (Medical Priority)', detail: 'Active smoking dramatically increases oxidative stress, counteracting the benefits of antioxidant IV therapy (Vitamin C, Glutathione, ALA). Smoking cessation is the highest-priority lifestyle intervention. Offer NRT, varenicline, or bupropion with behavioural support. Smoking cessation doubles the efficacy of antioxidant supplementation.', priority: 'high' });
  }

  return advice;
}

export function runCDSS(patient: PatientData): CDSSResult {
  // Physician idea safety
  const ideaPrep = preparationsById.get(patient.physicianIdeaId) ?? null;
  const ideaInteractions = patient.physicianIdeaId
    ? findInteractionsForPatient(patient.physicianIdeaId, patient)
    : [];
  const ideaContras = patient.physicianIdeaId
    ? findContraindications(patient.physicianIdeaId, patient)
    : [];

  const ideaFlags: SafetyFlag[] = [
    ...ideaInteractions.map(i => ({
      type: 'interaction' as const,
      severity: i.severity,
      message: `Interaction with ${i.drug} (${i.severity.toUpperCase()})`,
      detail: i.description,
    })),
    ...ideaContras.map(c => ({
      type: 'contraindication' as const,
      severity: 'absolute' as const,
      message: 'Contraindication Identified',
      detail: c,
    })),
  ];

  const ideaStatus = safetyStatus(ideaInteractions, ideaContras);

  // Organ safety warnings for physician idea
  if (ideaPrep) {
    const hasCKD = patient.diseases.some(d => normalise(d).includes('kidney') || normalise(d).includes('renal') || normalise(d).includes('ckd'));
    const hasLiver = patient.diseases.some(d => normalise(d).includes('liver') || normalise(d).includes('hepatic'));

    if (hasCKD && ideaPrep.organSafety.renal.toLowerCase().includes('caution')) {
      ideaFlags.push({ type: 'organ-risk', severity: 'moderate', message: 'Renal Safety Alert', detail: ideaPrep.organSafety.renal });
    }
    if (hasLiver && ideaPrep.organSafety.hepatic.toLowerCase().includes('caution')) {
      ideaFlags.push({ type: 'organ-risk', severity: 'moderate', message: 'Hepatic Safety Alert', detail: ideaPrep.organSafety.hepatic });
    }
  }

  // Score and rank all preparations
  const scored = preparations
    .filter(p => p.id !== patient.physicianIdeaId)
    .map(p => ({ prep: p, score: scorePreparation(p.id, patient) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const recommendations: RecommendationItem[] = scored.map(({ prep }) => {
    const interactions = findInteractionsForPatient(prep.id, patient);
    const contras = findContraindications(prep.id, patient);
    const matched = getMatchedIndications(prep.id, patient);

    const hasCKD = patient.diseases.some(d => normalise(d).includes('kidney') || normalise(d).includes('renal') || normalise(d).includes('ckd'));
    const hasLiver = patient.diseases.some(d => normalise(d).includes('liver') || normalise(d).includes('hepatic'));
    const organWarnings: string[] = [];
    if (hasCKD && prep.organSafety.renal.toLowerCase().includes('caution')) organWarnings.push(prep.organSafety.renal);
    if (hasLiver && prep.organSafety.hepatic.toLowerCase().includes('contraindicated') || (hasLiver && prep.organSafety.hepatic.toLowerCase().includes('caution'))) organWarnings.push(prep.organSafety.hepatic);

    return {
      preparation: prep,
      relevanceScore: scorePreparation(prep.id, patient),
      matchedIndications: matched,
      interactionWarnings: interactions,
      isContraindicated: contras.length > 0 || interactions.some(i => i.severity === 'major'),
      contraindicationReasons: contras,
      organWarnings,
    };
  });

  return {
    physicianIdeaSafety: { status: ideaStatus, flags: ideaFlags, preparation: ideaPrep },
    recommendations,
    diagnosticTests: buildDiagnosticTests(patient),
    lifestyleAdvice: buildLifestyleAdvice(patient),
  };
}
