'use client';

import { useState, useMemo } from 'react';
import PatientForm from '@/components/patient-form';
import ResultsDashboard from '@/components/results-dashboard';
import { runCDSS } from '@/lib/cdss-engine';
import { PatientData } from '@/lib/types';
import { Stethoscope, Activity, ShieldCheck } from 'lucide-react';

export default function Home() {
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [view, setView] = useState<'input' | 'results'>('input');

  const result = useMemo(() => (patient ? runCDSS(patient) : null), [patient]);

  const handleSubmit = (data: PatientData) => {
    setPatient(data);
    setView('results');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setView('input');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-800 leading-tight">CDSS</h1>
                <p className="text-[11px] text-slate-500 leading-tight">Integrative Medicine Decision Support</p>
              </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-1.5 text-xs">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors ${
                  view === 'input' ? 'bg-teal-100 text-teal-700' : 'text-slate-400'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Patient Data</span>
              </div>
              <div className="w-4 h-px bg-slate-300" />
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors ${
                  view === 'results' ? 'bg-teal-100 text-teal-700' : 'text-slate-400'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clinical Report</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {view === 'input' && (
          <div className="space-y-4">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-slate-800">Patient Data Entry</h2>
              <p className="text-sm text-slate-500 mt-1">
                Enter clinical information to generate evidence-based recommendations and safety verification.
              </p>
            </div>
            <PatientForm onSubmit={handleSubmit} />
          </div>
        )}

        {view === 'results' && patient && result && (
          <ResultsDashboard result={result} patient={patient} onBack={handleBack} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-slate-400 text-center">
            Proof-of-concept CDSS · For educational use only · Not a substitute for professional clinical judgement
          </p>
        </div>
      </footer>
    </div>
  );
}
