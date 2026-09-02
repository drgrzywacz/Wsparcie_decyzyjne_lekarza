export type EBMLevel = 'A' | 'B' | 'C' | 'D';
export type RouteType = 'IV' | 'PO';
export type InteractionSeverity = 'major' | 'moderate' | 'minor';
export type SafetyStatus = 'SAFE' | 'WARNING' | 'CONTRAINDICATED';

export interface ActiveIngredient {
  name: string;
  concentration: string;
}

export interface DrugInteraction {
  drug: string;
  severity: InteractionSeverity;
  description: string;
}

export interface OrganSafety {
  renal: string;
  hepatic: string;
}

export interface Preparation {
  id: string;
  name: string;
  route: RouteType;
  activeIngredients: ActiveIngredient[];
  ebmLevel: EBMLevel;
  ebmCategory: 'Guidelines/RCTs' | 'Integrative/Empirical';
  indications: string[];
  contraindications: string[];
  interactions: DrugInteraction[];
  sideEffects: string[];
  evidenceSources: string[];
  benefits: string;
  organSafety: OrganSafety;
  adminNotes?: string;
}

export interface LifestyleData {
  smoking: boolean;
  alcohol: 'none' | 'moderate' | 'heavy';
  coffeePerDay: number;
  sleepHours: number;
}

export interface PatientData {
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number;
  height: number;
  bmi: number;
  diseases: string[];
  symptoms: string[];
  medications: string[];
  supplements: string[];
  lifestyle: LifestyleData;
  familyHistory: string[];
  physicianIdeaId: string;
}

export interface SafetyFlag {
  type: 'interaction' | 'contraindication' | 'organ-risk';
  severity: InteractionSeverity | 'absolute';
  message: string;
  detail: string;
}

export interface CDSSResult {
  physicianIdeaSafety: {
    status: SafetyStatus;
    flags: SafetyFlag[];
    preparation: Preparation | null;
  };
  recommendations: RecommendationItem[];
  diagnosticTests: DiagnosticTest[];
  lifestyleAdvice: LifestyleAdvice[];
}

export interface RecommendationItem {
  preparation: Preparation;
  relevanceScore: number;
  matchedIndications: string[];
  interactionWarnings: DrugInteraction[];
  isContraindicated: boolean;
  contraindicationReasons: string[];
  organWarnings: string[];
}

export interface DiagnosticTest {
  name: string;
  reason: string;
  urgency: 'required' | 'recommended' | 'optional';
  category: 'renal' | 'hepatic' | 'metabolic' | 'nutritional' | 'thyroid' | 'hematology' | 'cardiac';
}

export interface LifestyleAdvice {
  category: 'diet' | 'hydration' | 'sleep' | 'exercise' | 'stress' | 'substance';
  title: string;
  detail: string;
  priority: 'high' | 'medium' | 'low';
}
