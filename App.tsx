
import React, { useState, useEffect, useRef } from 'react';
import { BrandKit, Campaign, Assets, ForgeProcess, DesignJSON, QAReport } from './types';
import { LA_MARSA_DEFAULTS, INITIAL_CAMPAIGN, EMPTY_ASSETS } from './constants';
import { 
  validateInputsAndAskQuestions, 
  forgeStrategyAndConcepts, 
  generateInitialDesign, 
  performQAAndIterate 
} from './services/geminiService';

// --- Components ---

const ProJSONEditor: React.FC<{ label: string; value: any; onChange: (v: any) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col h-full bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
    <div className="px-4 py-2 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</span>
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-zinc-800" />
        <div className="w-2 h-2 rounded-full bg-zinc-800" />
      </div>
    </div>
    <textarea
      className="flex-1 w-full p-4 font-mono text-[11px] bg-transparent text-emerald-400 focus:outline-none resize-none"
      spellCheck={false}
      value={JSON.stringify(value, null, 2)}
      onChange={(e) => {
        try {
          const parsed = JSON.parse(e.target.value);
          onChange(parsed);
        } catch (err) {}
      }}
    />
  </div>
);

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex flex-col items-center py-4 transition-all relative group ${active ? 'text-emerald-500' : 'text-zinc-500 hover:text-zinc-300'}`}
  >
    {active && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-l-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />}
    <div className={`p-2 rounded-xl transition-all ${active ? 'bg-emerald-500/10' : 'group-hover:bg-zinc-800'}`}>
      {icon}
    </div>
    <span className="text-[9px] font-bold uppercase mt-1 tracking-tighter">{label}</span>
  </button>
);

const AuditCard: React.FC<{ qa: QAReport }> = ({ qa }) => (
  <div className="relative pl-6 pb-6 border-l border-zinc-200 last:border-0 last:pb-0">
    <div className="absolute left-[-5px] top-1 w-[9px] h-[9px] rounded-full bg-zinc-300 border-2 border-white shadow-sm" />
    <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-black uppercase text-zinc-400">Preflight v{qa.iteration}</span>
        <div className="flex items-center gap-1">
          <span className={`text-sm font-black ${qa.score >= 90 ? 'text-emerald-600' : 'text-amber-500'}`}>{qa.score}</span>
          <span className="text-[10px] text-zinc-300">/100</span>
        </div>
      </div>
      {qa.issues.map((issue, i) => (
        <div key={i} className="flex gap-2 text-[11px] text-zinc-500 mb-1">
          <span className="text-rose-400 font-bold leading-none mt-0.5">!</span>
          <span className="leading-tight">{issue}</span>
        </div>
      ))}
      {qa.fixes_applied.length > 0 && (
        <div className="mt-2 pt-2 border-t border-zinc-100">
           {qa.fixes_applied.map((fix, i) => (
            <div key={i} className="flex gap-2 text-[11px] text-emerald-600 font-medium italic">
              <span className="font-bold">✓</span> {fix}
            </div>
           ))}
        </div>
      )}
    </div>
  </div>
);

export default function App() {
  const [brandKit, setBrandKit] = useState<BrandKit>(LA_MARSA_DEFAULTS);
  const [campaign, setCampaign] = useState<Campaign>(INITIAL_CAMPAIGN);
  const [assets, setAssets] = useState<Assets>(EMPTY_ASSETS);
  const [process, setProcess] = useState<ForgeProcess & { image_prompts?: string[], production_notes?: string }>({ history: [] });
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error' | 'validation'>('idle');
  const [progressMsg, setProgressMsg] = useState('');
  const [activeView, setActiveView] = useState<'briefing' | 'artboard' | 'production'>('briefing');
  const [clarifyingQuestions, setClarifyingQuestions] = useState<string[]>([]);
  
  const stageRef = useRef<HTMLDivElement>(null);

  const runForge = async () => {
    setStatus('working');
    setProcess({ history: [] });
    setClarifyingQuestions([]);
    setActiveView('artboard');
    
    try {
      setProgressMsg('Preflight Audit...');
      const validation = await validateInputsAndAskQuestions(brandKit, campaign);
      if (validation.questions.length > 0) {
        setClarifyingQuestions(validation.questions);
        setStatus('validation');
        return;
      }

      setProgressMsg('Creative Strategy...');
      const strategyData = await forgeStrategyAndConcepts(brandKit, campaign, assets);
      setProcess(prev => ({ ...prev, ...strategyData }));

      const winningConcept = strategyData.concepts.find((c: any) => c.id === strategyData.winner_selection.id);
      setProgressMsg(`Mastering Design: ${winningConcept.title}...`);
      const initialDesign = await generateInitialDesign(brandKit, campaign, assets, winningConcept);
      
      let currentDesign = initialDesign.design_json;
      let currentSvg = initialDesign.svg_code;

      setProcess(prev => ({
        ...prev,
        production_notes: initialDesign.production_notes,
        history: [{ design: currentDesign, artifact: currentSvg, qa: { score: 0, issues: [], fixes_applied: [], iteration: 0, is_perfect: false } }]
      }));

      for (let i = 1; i <= 3; i++) {
        setProgressMsg(`QA Optimization ${i}/3...`);
        const qa = await performQAAndIterate(brandKit, campaign, assets, currentDesign, currentSvg, i);
        currentDesign = qa.revised_design_json;
        currentSvg = qa.revised_svg_code;
        setProcess(prev => ({
          ...prev,
          production_notes: qa.production_notes || prev.production_notes,
          history: [...prev.history, { design: currentDesign, artifact: currentSvg, qa: { score: qa.score, issues: qa.issues, fixes_applied: qa.fixes_applied, iteration: i, is_perfect: qa.is_perfect } }]
        }));
        if (qa.is_perfect || qa.score >= 95) break;
      }
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const currentResult = process.history[process.history.length - 1];

  useEffect(() => {
    if (stageRef.current && currentResult?.artifact) {
      stageRef.current.innerHTML = currentResult.artifact;
      const svg = stageRef.current.querySelector('svg');
      if (svg) {
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', 'auto');
        svg.classList.add('block', 'artboard-shadow');
      }
    }
  }, [currentResult]);

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Top Header */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md flex items-center justify-between px-6 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          </div>
          <div>
            <h1 className="text-zinc-100 font-bold text-sm tracking-tight">FlyerForge <span className="text-emerald-500">Pro</span></h1>
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest leading-none">Art Director Suite v4.5</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status === 'working' ? 'bg-blue-500 animate-pulse' : status === 'done' ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{status === 'working' ? progressMsg : status}</span>
          </div>
          <button 
            onClick={runForge}
            disabled={status === 'working'}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-zinc-950 px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            {status === 'working' ? 'Forging...' : 'Forge Flyer'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-20 border-r border-zinc-800 flex flex-col items-center py-6 z-20 bg-zinc-950">
          <NavItem active={activeView === 'briefing'} onClick={() => setActiveView('briefing')} label="Brief" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
          <NavItem active={activeView === 'artboard'} onClick={() => setActiveView('artboard')} label="Stage" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13l3.5-3.5 3.5 3.5M11 17l4-4 4 4" /></svg>} />
          <NavItem active={activeView === 'production'} onClick={() => setActiveView('production')} label="Spec" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>} />
        </aside>

        {/* Workspace */}
        <main className="flex-1 flex overflow-hidden relative">
          {activeView === 'briefing' && (
            <div className="absolute inset-0 z-10 p-10 grid grid-cols-1 md:grid-cols-3 gap-8 bg-zinc-950 overflow-y-auto">
              <ProJSONEditor label="Brand Framework" value={brandKit} onChange={setBrandKit} />
              <ProJSONEditor label="Campaign Brief" value={campaign} onChange={setCampaign} />
              <ProJSONEditor label="Asset Inventory" value={assets} onChange={setAssets} />
            </div>
          )}

          <section className="flex-1 flex flex-col bg-zinc-100 overflow-hidden">
            {activeView === 'artboard' && (
              <div className="flex-1 flex items-center justify-center p-12 overflow-y-auto">
                <div className="w-full max-w-2xl">
                  {status === 'validation' && clarifyingQuestions.length > 0 ? (
                    <div className="bg-white p-10 rounded-3xl border border-zinc-200 shadow-xl max-w-lg mx-auto">
                      <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      </div>
                      <h2 className="text-xl font-bold text-zinc-900 mb-4">Input Ambiguity Detected</h2>
                      <p className="text-sm text-zinc-500 mb-6 leading-relaxed">The Art Director requires explicit details before the high-fidelity forge can proceed.</p>
                      <ul className="space-y-4">
                        {clarifyingQuestions.map((q, i) => (
                          <li key={i} className="flex gap-4 p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-[11px] font-medium text-zinc-700">
                            <span className="text-amber-500 font-black">#0{i+1}</span> {q}
                          </li>
                        ))}
                      </ul>
                      <button onClick={() => setActiveView('briefing')} className="mt-8 w-full py-3 bg-zinc-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors">Return to Briefing</button>
                    </div>
                  ) : currentResult?.artifact ? (
                    <div ref={stageRef} className="mx-auto" />
                  ) : (
                    <div className="text-center">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-zinc-200">
                        <svg className="w-10 h-10 text-zinc-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <p className="text-zinc-400 font-medium text-sm">Stage Empty</p>
                      <p className="text-[11px] text-zinc-300 uppercase tracking-widest font-black mt-1">Initiate forge to generate artboards</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeView === 'production' && (
              <div className="flex-1 p-12 bg-white overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-12">
                  <header>
                    <h2 className="font-serif text-4xl text-zinc-900 mb-2">Production Manifest</h2>
                    <p className="text-zinc-500 font-medium tracking-tight">Final technical specifications for digital and print export.</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <section className="p-8 bg-zinc-50 rounded-3xl border border-zinc-200">
                        <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-6">Master Design Tokens</h3>
                        <div className="space-y-4">
                           {currentResult?.design.tokens && Object.entries(currentResult.design.tokens.colors).map(([name, val]) => (
                             <div key={name} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-lg shadow-sm border border-white" style={{ background: val }} />
                                   <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-tighter">{name}</span>
                                </div>
                                <span className="text-[10px] font-mono text-zinc-400 group-hover:text-zinc-900 transition-colors">{val}</span>
                             </div>
                           ))}
                        </div>
                     </section>

                     <section className="p-8 bg-zinc-900 rounded-3xl text-zinc-400">
                        <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-6">Technical Prepress Notes</h3>
                        <div className="text-[11px] leading-relaxed font-mono whitespace-pre-wrap">
                          {process.production_notes || "No production metadata found for this iteration."}
                        </div>
                     </section>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Intel & Audit Sidebar */}
          <aside className="w-[380px] border-l border-zinc-200 bg-white/50 backdrop-blur-md overflow-y-auto">
            <div className="p-8 space-y-12">
              {process.strategy && (
                <section>
                  <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-6 flex items-center gap-3">
                    <div className="w-4 h-px bg-zinc-200" /> Intelligence Layer
                  </h3>
                  <div className="space-y-4">
                    {process.strategy.map((s, i) => (
                      <div key={i} className="flex gap-4 group">
                        <span className="text-emerald-500 font-black text-xs">0{i+1}</span>
                        <p className="text-[11px] text-zinc-600 leading-relaxed font-medium group-hover:text-zinc-900 transition-colors">{s}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {process.concepts && (
                <section>
                  <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-6 flex items-center gap-3">
                    <div className="w-4 h-px bg-zinc-200" /> Directional Concepts
                  </h3>
                  <div className="space-y-4">
                    {process.concepts.map((c: any) => (
                      <div key={c.id} className={`p-4 rounded-2xl border-2 transition-all cursor-default ${process.winner === c.id ? 'border-emerald-500 bg-emerald-50/50 shadow-md' : 'border-zinc-100 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 hover:border-zinc-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Variant {c.id}</span>
                           {process.winner === c.id && <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                        </div>
                        <h4 className="text-xs font-bold text-zinc-900 mb-1">{c.title}</h4>
                        <p className="text-[10px] text-zinc-500 leading-snug">{c.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {process.history.length > 0 && (
                <section>
                  <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-6 flex items-center gap-3">
                    <div className="w-4 h-px bg-zinc-200" /> Audit Timeline
                  </h3>
                  <div className="flex flex-col">
                    {[...process.history].reverse().map((h, i) => (
                      h.qa.iteration > 0 && <AuditCard key={i} qa={h.qa} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </aside>
        </main>
      </div>

      {/* Mini Footer */}
      <footer className="h-8 bg-zinc-950 border-t border-zinc-900 flex items-center px-6 justify-between">
         <div className="flex gap-4 items-center">
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">© 2024 Forge Systems</span>
            <div className="w-px h-3 bg-zinc-800" />
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Master Key Status: <span className="text-emerald-500">Active</span></span>
         </div>
         <div className="text-[9px] text-zinc-500 font-mono">
            {currentResult?.design.document.size || "IDLE"} @ {currentResult?.design.document.dpi || 0}DPI
         </div>
      </footer>
    </div>
  );
}
