'use client';

import { CDSSResult, PatientData, RecommendationItem } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, FlaskConical,
  Heart, Activity, Droplet, Moon, Dumbbell, Apple, Brain, Leaf,
  ChevronRight, FileText, Stethoscope, Beaker, Syringe, Pill as PillIcon,
  CheckCircle2, XCircle, AlertCircle, Info, BookOpen, Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  result: CDSSResult;
  patient: PatientData;
  onBack: () => void;
}

const STATUS_CONFIG = {
  SAFE: {
    icon: ShieldCheck,
    label: 'SAFE',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    accent: 'bg-emerald-500',
    desc: 'No contraindications or major interactions identified for this patient profile.',
  },
  WARNING: {
    icon: ShieldAlert,
    label: 'WARNING',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    accent: 'bg-amber-500',
    desc: 'Moderate interactions or organ-safety concerns detected. Review flags before proceeding.',
  },
  CONTRAINDICATED: {
    icon: ShieldX,
    label: 'CONTRAINDICATED',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    accent: 'bg-red-500',
    desc: 'Absolute contraindication or major drug interaction identified. Do not administer without specialist review.',
  },
} as const;

function ebmBadge(level: string) {
  const isHigh = level === 'A' || level === 'B';
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] font-semibold px-1.5 py-0',
        isHigh ? 'bg-green-50 text-green-700 border-green-200' : 'bg-sky-50 text-sky-700 border-sky-200',
      )}
    >
      EBM {level}
    </Badge>
  );
}

function routeBadge(route: string) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] font-semibold px-1.5 py-0',
        route === 'IV' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      )}
    >
      {route}
    </Badge>
  );
}

function severityColor(sev: string) {
  if (sev === 'major') return 'text-red-600 bg-red-50 border-red-200';
  if (sev === 'moderate') return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-slate-600 bg-slate-50 border-slate-200';
}

function SafetyBanner({ result }: { result: CDSSResult }) {
  const cfg = STATUS_CONFIG[result.physicianIdeaSafety.status];
  const Icon = cfg.icon;
  const prep = result.physicianIdeaSafety.preparation;

  return (
    <Card className={cn('overflow-hidden border-2', cfg.border)}>
      <div className={cn('flex items-start gap-4 p-5', cfg.bg)}>
        <div className={cn('p-3 rounded-xl text-white flex-shrink-0', cfg.accent)}>
          <Icon className="h-7 w-7" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className={cn('text-xl font-bold tracking-tight', cfg.text)}>{cfg.label}</h3>
            {prep && (
              <>
                {routeBadge(prep.route)}
                {ebmBadge(prep.ebmLevel)}
              </>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1">{cfg.desc}</p>
          {prep && (
            <p className="text-sm font-medium text-slate-700 mt-2">
              Physician's selection: <span className="font-semibold">{prep.name}</span>
            </p>
          )}
        </div>
      </div>

      {result.physicianIdeaSafety.flags.length > 0 && (
        <div className="border-t border-slate-100 p-5 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> Safety Flags ({result.physicianIdeaSafety.flags.length})
          </h4>
          {result.physicianIdeaSafety.flags.map((flag, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border',
                flag.severity === 'absolute' || flag.severity === 'major'
                  ? 'bg-red-50 border-red-200'
                  : flag.severity === 'moderate'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-slate-50 border-slate-200',
              )}
            >
              {flag.severity === 'absolute' || flag.severity === 'major' ? (
                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              ) : flag.severity === 'moderate' ? (
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Info className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{flag.message}</p>
                <p className="text-xs text-slate-600 mt-0.5">{flag.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {result.physicianIdeaSafety.flags.length === 0 && result.physicianIdeaSafety.status === 'SAFE' && (
        <div className="border-t border-slate-100 p-5">
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            <span>No interactions detected with patient's current medications, supplements, or documented conditions.</span>
          </div>
        </div>
      )}
    </Card>
  );
}

function RecommendationCard({ item }: { item: RecommendationItem }) {
  const prep = item.preparation;
  const hasIssues = item.isContraindicated || item.interactionWarnings.length > 0;

  return (
    <Card className={cn(
      'overflow-hidden border transition-shadow hover:shadow-md',
      item.isContraindicated ? 'border-red-200' : 'border-slate-200',
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-100">
        <div className="flex items-start gap-3 min-w-0">
          <div className={cn(
            'p-2 rounded-lg flex-shrink-0',
            prep.route === 'IV' ? 'bg-blue-50' : 'bg-emerald-50',
          )}>
            {prep.route === 'IV' ? (
              <Syringe className={cn('h-4 w-4', 'text-blue-600')} />
            ) : (
              <PillIcon className={cn('h-4 w-4', 'text-emerald-600')} />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-slate-800 text-sm leading-tight">{prep.name}</h4>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {routeBadge(prep.route)}
              {ebmBadge(prep.ebmLevel)}
              {item.matchedIndications.length > 0 && (
                <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0 bg-teal-50 text-teal-700 border-teal-200">
                  {item.matchedIndications.length} match{item.matchedIndications.length > 1 ? 'es' : ''}
                </Badge>
              )}
              {item.isContraindicated && (
                <Badge variant="outline" className="text-[10px] font-semibold px-1.5 py-0 bg-red-50 text-red-700 border-red-200">
                  CONTRAINDICATED
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Matched indications */}
      {item.matchedIndications.length > 0 && (
        <div className="px-4 pt-3">
          <div className="flex flex-wrap gap-1">
            {item.matchedIndications.map(ind => (
              <span key={ind} className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                {ind}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 4 Pillars */}
      <Accordion type="single" collapsible defaultValue="benefits" className="px-4 py-3">
        <AccordionItem value="benefits" className="border-0">
          <AccordionTrigger className="text-xs font-semibold uppercase tracking-wide text-emerald-700 hover:no-underline py-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" /> Benefits
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-slate-600 leading-relaxed pb-3">
            {prep.benefits}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="risks" className="border-0">
          <AccordionTrigger className="text-xs font-semibold uppercase tracking-wide text-amber-700 hover:no-underline py-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5" /> Risks & Side Effects
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-slate-600 leading-relaxed pb-3 space-y-2">
            <ul className="space-y-1">
              {prep.sideEffects.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
              <p className="text-xs font-medium text-slate-500">Organ Safety:</p>
              <p className="text-xs"><span className="font-medium text-slate-600">Renal:</span> {prep.organSafety.renal}</p>
              <p className="text-xs"><span className="font-medium text-slate-600">Hepatic:</span> {prep.organSafety.hepatic}</p>
            </div>
            {item.organWarnings.length > 0 && (
              <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs font-medium text-amber-700 mb-1">Patient-Specific Organ Warnings:</p>
                {item.organWarnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-600">{w}</p>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="interactions" className="border-0">
          <AccordionTrigger className="text-xs font-semibold uppercase tracking-wide text-red-700 hover:no-underline py-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5" /> Interactions
              {item.interactionWarnings.length > 0 && (
                <span className="ml-1 text-[10px] px-1.5 py-0 rounded-full bg-red-100 text-red-700 font-bold">
                  {item.interactionWarnings.length}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-slate-600 leading-relaxed pb-3">
            {item.interactionWarnings.length > 0 ? (
              <div className="space-y-2">
                {item.interactionWarnings.map((int, i) => (
                  <div key={i} className={cn('p-2.5 rounded-lg border', severityColor(int.severity))}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={cn('text-[10px] font-bold uppercase px-1.5 py-0', severityColor(int.severity))}>
                        {int.severity}
                      </Badge>
                      <span className="text-sm font-medium">{int.drug}</span>
                    </div>
                    <p className="text-xs text-slate-600">{int.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-600 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>No interactions detected with patient's current medications or supplements.</span>
              </div>
            )}
            {item.contraindicationReasons.length > 0 && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs font-bold text-red-700 mb-1">CONTRAINDICATIONS:</p>
                {item.contraindicationReasons.map((c, i) => (
                  <p key={i} className="text-xs text-red-600">• {c}</p>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="evidence" className="border-0">
          <AccordionTrigger className="text-xs font-semibold uppercase tracking-wide text-slate-600 hover:no-underline py-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" /> Evidence & Sources
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-slate-600 leading-relaxed pb-3">
            <div className="space-y-1.5">
              {prep.evidenceSources.map((src, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <FileText className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600">{src}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                <span className="font-medium">EBM Category:</span> {prep.ebmCategory}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

const CATEGORY_ICONS: Record<string, any> = {
  renal: Droplet,
  hepatic: FlaskConical,
  metabolic: Activity,
  nutritional: Apple,
  thyroid: Heart,
  hematology: Beaker,
  cardiac: Heart,
};

const URGENCY_STYLES = {
  required: 'border-red-200 bg-red-50 text-red-700',
  recommended: 'border-amber-200 bg-amber-50 text-amber-700',
  optional: 'border-slate-200 bg-slate-50 text-slate-600',
};

function DiagnosticSection({ result }: { result: CDSSResult }) {
  const tests = result.diagnosticTests;
  const grouped = tests.reduce((acc, t) => {
    (acc[t.category] = acc[t.category] || []).push(t);
    return acc;
  }, {} as Record<string, typeof tests>);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Stethoscope className="h-4 w-4 text-teal-600" />
        <span>Recommended tests to run before initiating therapy. Ordered by clinical urgency.</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {tests.map((test, i) => {
          const Icon = CATEGORY_ICONS[test.category] || Beaker;
          return (
            <div key={i} className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 bg-white hover:shadow-sm transition-shadow">
              <div className="p-2 rounded-lg bg-slate-50 flex-shrink-0">
                <Icon className="h-4 w-4 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-slate-800">{test.name}</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">{test.reason}</p>
                <span className={cn('text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border', URGENCY_STYLES[test.urgency])}>
                  {test.urgency}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const LIFESTYLE_ICONS: Record<string, any> = {
  diet: Apple,
  hydration: Droplet,
  sleep: Moon,
  exercise: Dumbbell,
  stress: Brain,
  substance: Leaf,
};

const PRIORITY_STYLES = {
  high: 'border-red-200 bg-red-50',
  medium: 'border-amber-200 bg-amber-50',
  low: 'border-slate-200 bg-slate-50',
};

const PRIORITY_BADGE = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
};

function LifestyleSection({ result, patient }: { result: CDSSResult; patient: PatientData }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Lightbulb className="h-4 w-4 text-teal-600" />
        <span>Tailored lifestyle interventions based on BMI ({patient.bmi}), symptoms, and medication profile.</span>
      </div>
      <div className="grid gap-3">
        {result.lifestyleAdvice.map((adv, i) => {
          const Icon = LIFESTYLE_ICONS[adv.category] || Leaf;
          return (
            <div key={i} className={cn('flex items-start gap-3 p-4 rounded-lg border', PRIORITY_STYLES[adv.priority])}>
              <div className="p-2 rounded-lg bg-white border border-slate-100 flex-shrink-0">
                <Icon className="h-4 w-4 text-teal-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-slate-800">{adv.title}</h4>
                  <span className={cn('text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full border', PRIORITY_BADGE[adv.priority])}>
                    {adv.priority} priority
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{adv.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ResultsDashboard({ result, patient, onBack }: Props) {
  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Clinical Decision Report</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Patient: {patient.age}y {patient.gender} · BMI {patient.bmi} · {patient.diseases.length} conditions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-4 w-4 rotate-180" /> Edit Patient Data
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm"
          >
            <FileText className="h-4 w-4" /> Export / Print Summary
          </button>
        </div>
      </div>

      {/* Safety Banner - always visible */}
      <SafetyBanner result={result} />

      {/* Tabbed sections */}
      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto bg-slate-100/60 p-1 print:hidden">
          <TabsTrigger value="recommendations" className="text-xs sm:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <span className="flex items-center gap-1.5"><PillIcon className="h-3.5 w-3.5" /> Recommendations</span>
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="text-xs sm:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <span className="flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5" /> Diagnostics</span>
          </TabsTrigger>
          <TabsTrigger value="lifestyle" className="text-xs sm:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <span className="flex items-center gap-1.5"><Heart className="h-3.5 w-3.5" /> Lifestyle</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              Top {result.recommendations.length} Recommended Preparations
            </h3>
            <p className="text-xs text-slate-500">Sorted by EBM evidence level and patient relevance</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {result.recommendations.map((item, i) => (
              <RecommendationCard key={i} item={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="diagnostics" className="mt-4">
          <DiagnosticSection result={result} />
        </TabsContent>

        <TabsContent value="lifestyle" className="mt-4">
          <LifestyleSection result={result} patient={patient} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
