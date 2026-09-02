'use client';

import { useState, useEffect } from 'react';
import { PatientData } from '@/lib/types';
import {
  COMMON_DISEASES, COMMON_SYMPTOMS, COMMON_MEDICATIONS,
  COMMON_SUPPLEMENTS, SAMPLE_PATIENT, preparations,
} from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  User, Activity, Pill, Leaf, FlaskConical, ChevronRight,
  X, Plus, Info, Syringe, ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onSubmit: (data: PatientData) => void;
}

function computeBMI(weight: number, height: number): number {
  if (!weight || !height) return 0;
  return parseFloat((weight / ((height / 100) ** 2)).toFixed(1));
}

function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-600' };
  if (bmi < 25) return { label: 'Normal weight', color: 'text-emerald-600' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-amber-600' };
  return { label: 'Obese', color: 'text-red-600' };
}

function TagInput({
  label, value, onChange, suggestions, placeholder,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  suggestions: string[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = suggestions.filter(
    s => s.toLowerCase().includes(query.toLowerCase()) && !value.includes(s),
  ).slice(0, 8);

  const addItem = (item: string) => {
    const trimmed = item.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setQuery('');
    setShowSuggestions(false);
  };

  const removeItem = (item: string) => onChange(value.filter(v => v !== item));

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map(item => (
          <Badge key={item} variant="secondary" className="gap-1 bg-slate-100 text-slate-700 border border-slate-200 pr-1">
            {item}
            <button onClick={() => removeItem(item)} className="ml-0.5 hover:text-red-500 transition-colors">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="relative">
        <Input
          value={query}
          onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (filtered[0]) addItem(filtered[0]); else if (query.trim()) addItem(query); } }}
          placeholder={placeholder ?? `Search or type to add...`}
          className="h-9 text-sm"
        />
        {showSuggestions && (query || filtered.length > 0) && (
          <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto scrollbar-thin">
            {filtered.length > 0 ? filtered.map(s => (
              <button
                key={s}
                onMouseDown={() => addItem(s)}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50 transition-colors text-slate-700"
              >
                {s}
              </button>
            )) : query.trim() ? (
              <button
                onMouseDown={() => addItem(query)}
                className="w-full px-3 py-1.5 text-left text-sm text-teal-600 hover:bg-teal-50 transition-colors flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add "{query.trim()}"
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function ArrayInput({ label, value, onChange, suggestions, placeholder }: {
  label: string; value: string[]; onChange: (v: string[]) => void;
  suggestions: string[]; placeholder?: string;
}) {
  return (
    <TagInput label={label} value={value} onChange={onChange} suggestions={suggestions} placeholder={placeholder} />
  );
}

const SECTION_CLASSES = 'bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible';
const SECTION_HEADER = 'flex items-center gap-3 px-5 py-4 border-b border-slate-100';
const SECTION_BODY = 'px-5 py-5 space-y-5';

export default function PatientForm({ onSubmit }: Props) {
  const [form, setForm] = useState<PatientData>(SAMPLE_PATIENT);

  useEffect(() => {
    const bmi = computeBMI(form.weight, form.height);
    if (bmi !== form.bmi) setForm(f => ({ ...f, bmi }));
  }, [form.weight, form.height]);

  const set = <K extends keyof PatientData>(key: K, value: PatientData[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const bmi = form.bmi;
  const bmiCat = bmi > 0 ? bmiCategory(bmi) : null;

  const ivPreps = preparations.filter(p => p.route === 'IV');
  const poPreps = preparations.filter(p => p.route === 'PO');

  return (
    <div className="space-y-6">
      {/* Section 1 - Demographics */}
      <div className={SECTION_CLASSES}>
        <div className={SECTION_HEADER}>
          <div className="p-2 rounded-lg bg-blue-50">
            <User className="h-4.5 w-4.5 text-blue-600 h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Demographics & Anthropometrics</h3>
            <p className="text-xs text-slate-500">Basic patient identifiers and body composition</p>
          </div>
        </div>
        <div className={SECTION_BODY}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Age (years)</Label>
              <Input type="number" min={1} max={120} value={form.age || ''} onChange={e => set('age', +e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Gender</Label>
              <Select value={form.gender} onValueChange={v => set('gender', v as PatientData['gender'])}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="other">Other / Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Weight (kg)</Label>
              <Input type="number" min={20} max={400} step={0.1} value={form.weight || ''} onChange={e => set('weight', +e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Height (cm)</Label>
              <Input type="number" min={100} max={250} value={form.height || ''} onChange={e => set('height', +e.target.value)} className="h-9" />
            </div>
          </div>

          {bmi > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <Activity className="h-4 w-4 text-slate-500 flex-shrink-0" />
              <span className="text-sm text-slate-600">
                BMI: <span className="font-semibold text-slate-800">{bmi}</span>
                {bmiCat && (
                  <span className={cn('ml-2 text-xs font-medium', bmiCat.color)}>
                    — {bmiCat.label}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Section 2 - Clinical Status */}
      <div className={SECTION_CLASSES}>
        <div className={SECTION_HEADER}>
          <div className="p-2 rounded-lg bg-teal-50">
            <Activity className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Clinical Status</h3>
            <p className="text-xs text-slate-500">Diagnosed conditions and current symptom burden</p>
          </div>
        </div>
        <div className={SECTION_BODY}>
          <TagInput
            label="Diagnosed Diseases"
            value={form.diseases}
            onChange={v => set('diseases', v)}
            suggestions={COMMON_DISEASES}
            placeholder="Search diagnoses or type custom..."
          />
          <TagInput
            label="Current Symptoms"
            value={form.symptoms}
            onChange={v => set('symptoms', v)}
            suggestions={COMMON_SYMPTOMS}
            placeholder="Search symptoms or type custom..."
          />
        </div>
      </div>

      {/* Section 3 - Medications & Supplements */}
      <div className={SECTION_CLASSES}>
        <div className={SECTION_HEADER}>
          <div className="p-2 rounded-lg bg-amber-50">
            <Pill className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Current Medications & Supplements</h3>
            <p className="text-xs text-slate-500">All active prescriptions and OTC supplements for interaction checking</p>
          </div>
        </div>
        <div className={SECTION_BODY}>
          <ArrayInput
            label="Standard Prescription Medications"
            value={form.medications}
            onChange={v => set('medications', v)}
            suggestions={COMMON_MEDICATIONS}
            placeholder="Search medications (e.g. Warfarin, Metformin)..."
          />
          <ArrayInput
            label="Dietary Supplements & OTC Products"
            value={form.supplements}
            onChange={v => set('supplements', v)}
            suggestions={COMMON_SUPPLEMENTS}
            placeholder="Search supplements (e.g. Vitamin D, Fish Oil)..."
          />
          <Separator />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Smoking</Label>
              <Select value={form.lifestyle.smoking ? 'yes' : 'no'} onValueChange={v => set('lifestyle', { ...form.lifestyle, smoking: v === 'yes' })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">Non-smoker</SelectItem>
                  <SelectItem value="yes">Active smoker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Alcohol Use</Label>
              <Select value={form.lifestyle.alcohol} onValueChange={v => set('lifestyle', { ...form.lifestyle, alcohol: v as PatientData['lifestyle']['alcohol'] })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="heavy">Heavy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Coffee (cups/day)</Label>
              <Input type="number" min={0} max={20} step={0.5} value={form.lifestyle.coffeePerDay || ''} onChange={e => set('lifestyle', { ...form.lifestyle, coffeePerDay: +e.target.value })} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Sleep (hours/night)</Label>
              <Input type="number" min={0} max={24} step={0.5} value={form.lifestyle.sleepHours || ''} onChange={e => set('lifestyle', { ...form.lifestyle, sleepHours: +e.target.value })} className="h-9" />
            </div>
          </div>
        </div>
      </div>

      {/* Section 4 - Family History */}
      <div className={SECTION_CLASSES}>
        <div className={SECTION_HEADER}>
          <div className="p-2 rounded-lg bg-rose-50">
            <ClipboardList className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Family Medical History</h3>
            <p className="text-xs text-slate-500">First-degree relatives — helps contextualise risk profiling</p>
          </div>
        </div>
        <div className={SECTION_BODY}>
          <TagInput
            label="Family Conditions"
            value={form.familyHistory}
            onChange={v => set('familyHistory', v)}
            suggestions={COMMON_DISEASES}
            placeholder="Type family condition (e.g. Coronary Artery Disease)..."
          />
        </div>
      </div>

      {/* Section 5 - Physician's Initial Idea */}
      <div className={SECTION_CLASSES}>
        <div className={SECTION_HEADER}>
          <div className="p-2 rounded-lg bg-violet-50">
            <Syringe className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Physician's Initial Treatment Idea</h3>
            <p className="text-xs text-slate-500">Select the primary preparation you wish to evaluate first — will receive full safety analysis</p>
          </div>
        </div>
        <div className={SECTION_BODY}>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Select Preparation for Safety Verification</Label>
            <Select value={form.physicianIdeaId} onValueChange={v => set('physicianIdeaId', v)}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select a preparation..." />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <div className="px-2 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  IV Preparations (20)
                </div>
                {ivPreps.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] py-0 px-1 border-blue-300 text-blue-600 font-medium">IV</Badge>
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
                <Separator className="my-1" />
                <div className="px-2 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Oral Preparations (30)
                </div>
                {poPreps.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] py-0 px-1 border-emerald-300 text-emerald-600 font-medium">PO</Badge>
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.physicianIdeaId && (() => {
            const prep = preparations.find(p => p.id === form.physicianIdeaId);
            if (!prep) return null;
            return (
              <div className="p-3.5 rounded-lg bg-violet-50 border border-violet-100 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-violet-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-violet-800">{prep.name}</span>
                  <Badge className={cn('text-[10px] font-semibold ml-auto', prep.route === 'IV' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200')} variant="outline">
                    {prep.route}
                  </Badge>
                  <Badge className={cn('text-[10px] font-semibold', prep.ebmLevel <= 'B' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-sky-100 text-sky-700 border-sky-200')} variant="outline">
                    EBM {prep.ebmLevel}
                  </Badge>
                </div>
                <p className="text-xs text-violet-700">{prep.benefits.slice(0, 180)}...</p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Leaf className="h-4 w-4 text-teal-500" />
          <span>Pre-filled with a sample clinical case — review and modify as needed</span>
        </div>
        <Button
          size="lg"
          onClick={() => onSubmit(form)}
          disabled={!form.physicianIdeaId || !form.age || !form.weight || !form.height}
          className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-sm"
        >
          Generate Clinical Report <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
