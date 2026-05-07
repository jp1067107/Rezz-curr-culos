/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ResumeData, TemplateType } from './types';
import { ResumeForm } from './components/ResumeForm';
import { ResumePreview } from './components/ResumePreview';
import { extractResumeDataFromFile, generateResumeDataFromPrompt } from './services/aiService';
import { auth, signInWithGoogle, signOut, saveResume, loadResumes, ResumeDoc } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useReactToPrint } from 'react-to-print';
import { Download, LayoutTemplate, Sparkles, Loader2, Eye, Edit2, Wand2, X, LogIn, LogOut, Save, FolderOpen, CreditCard } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const INITIAL_DATA: ResumeData = {
  personalInfo: {
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    photoUrl: null,
  },
  experience: [
    {
      id: uuidv4(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: ''
    }
  ],
  education: [
    {
      id: uuidv4(),
      institution: '',
      degree: '',
      startDate: '',
      endDate: ''
    }
  ],
  skills: [
    { id: uuidv4(), name: '' }
  ]
};

export default function App() {
  const [appState, setAppState] = useState<'onboarding' | 'ai-info' | 'editor'>('onboarding');
  const [data, setData] = useState<ResumeData>(INITIAL_DATA);
  const [template, setTemplate] = useState<TemplateType>('modern');
  const componentRef = useRef<HTMLDivElement>(null);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  
  const [user, setUser] = useState<User | null>(null);
  const [currentResumeId, setCurrentResumeId] = useState<string>(uuidv4());
  const [resumesList, setResumesList] = useState<ResumeDoc[]>([]);
  const [isResumesModalOpen, setIsResumesModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [paymentEnabled, setPaymentEnabled] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setHasPaid(true);
      // Remove o parâmetro da URL para ficar limpa
      window.history.replaceState({}, document.title, window.location.pathname);
      // Opcional: já vai para a tela de editor
      setAppState('editor');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchResumes(currentUser.uid);
      } else {
        setResumesList([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchResumes = async (userId: string) => {
    const list = await loadResumes(userId);
    setResumesList(list);
  };

  const handleSaveResume = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await saveResume(user.uid, currentResumeId, data);
      await fetchResumes(user.uid);
      alert('Currículo salvo com sucesso!');
    } catch (error) {
      alert('Erro ao salvar o currículo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadResume = (doc: ResumeDoc) => {
    setCurrentResumeId(doc.id);
    setData(doc.data);
    setIsResumesModalOpen(false);
    setAppState('editor');
  };

  const handleDownloadClick = async () => {
    if (paymentEnabled && !hasPaid) {
      setIsPaymentModalOpen(true);
      return;
    }
    await generatePdf();
  };

  const generatePdf = async () => {
    if (!componentRef.current || !containerRef.current) return;
    
    // Dynamically import
    const html2canvas = (await import('html2canvas-pro')).default;
    const { jsPDF } = await import('jspdf');

    await document.fonts.ready;

    setIsProcessing(true); // show some loading state if needed
    
    try {
      // THE FIX FOR HTML2CANVAS OVERLAPPING TEXT BUG:
      // html2canvas completely breaks text layout when the target element or its parents have CSS transform scales applied.
      // We MUST temporarily remove the scaling from the parent wrapper, take the snapshot, and restore it.
      
      const wrapperElement = componentRef.current.parentElement;
      const originalTransform = wrapperElement?.style.transform || '';
      const originalTransition = wrapperElement?.style.transition || '';
      const originalHeight = wrapperElement?.style.height || '';
      
      if (wrapperElement) {
        // Disable transitions and remove scale so it renders at exactly 100% natural 210mm width
        wrapperElement.style.transition = 'none';
        wrapperElement.style.transform = 'scale(1)';
        wrapperElement.style.height = 'auto';
      }
      
      // Force a synchronous reflow so the browser recalcs the layout at 100% scale
      void componentRef.current.offsetHeight;

      // Small delay to ensure the DOM paints at 100% scale
      await new Promise(resolve => setTimeout(resolve, 50));

      const element = componentRef.current;

      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const allElements = clonedDoc.querySelectorAll('*');
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            el.style.fontVariantLigatures = 'none';
            // ensure text rendering is standard
            el.style.textRendering = 'auto';
            // Explicitly force word wrapping to reduce overlap risk
            el.style.wordBreak = 'break-word';
          }
        }
      });

      // Restore the original scale layout immediately after snapshotting
      if (wrapperElement) {
        wrapperElement.style.transform = originalTransform;
        wrapperElement.style.height = originalHeight;
        // Don't restore transition yet to avoid animation glitch
        setTimeout(() => {
          if (wrapperElement) wrapperElement.style.transition = originalTransition;
        }, 50);
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      
      // A4 dimensions in mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = data.personalInfo.fullName 
        ? `${data.personalInfo.fullName.replace(/\s+/g, '_')}_Curriculo.pdf` 
        : 'Curriculo.pdf';
        
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente mais tarde.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate scaling for the preview to fit nicely on the screen
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [isPrompting, setIsPrompting] = useState(false);

  React.useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        // 794 is exactly 210mm at 96 DPI (standard print width for A4)
        const availableWidth = containerRef.current.offsetWidth - 32; // 16px padding on each side
        const newScale = Math.min(1, availableWidth / 794);
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    // Add a slight delay to recalculate after layout changes (e.g. mobile view toggle)
    setTimeout(updateScale, 50);
    return () => window.removeEventListener('resize', updateScale);
  }, [mobileView]);

  const handleAiImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const extractedData = await extractResumeDataFromFile(file);
      setData(extractedData);
      setAppState('editor');
      setMobileView('preview');
    } catch (error: any) {
      alert(error.message || 'Falha ao extrair dados. Por favor, insira suas informações manualmente.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAiPromptSubmit = async () => {
    if (!promptText.trim()) return;
    try {
      setIsPrompting(true);
      const newData = await generateResumeDataFromPrompt(promptText, data);
      setData(newData);
      setIsPromptModalOpen(false);
      setPromptText('');
    } catch (error: any) {
      alert(error.message || 'Falha ao processar pedido com IA.');
    } finally {
      setIsPrompting(false);
    }
  };

  const templateNames = {
    modern: 'Moderno',
    classic: 'Clássico',
    minimal: 'Minimalista'
  };

  if (appState === 'onboarding') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-slate-100 flex flex-col font-sans items-center justify-center p-6">
        <div className="max-w-2xl text-center space-y-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl shadow-indigo-500/20 text-white font-black text-4xl ring-1 ring-white/20 font-serif mb-4">
            R
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
            Bem-vindo ao Rezz
          </h1>
          <p className="text-lg text-slate-300 font-medium max-w-lg mx-auto">
            A forma mais rápida e profissional de criar o seu currículo. Escolha como deseja começar:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button
              onClick={() => setAppState('ai-info')}
              className="flex flex-col items-center justify-center gap-1 px-8 py-3 bg-indigo-500 shadow-xl shadow-indigo-500/30 hover:bg-indigo-400 text-white rounded-2xl transition-all"
            >
              <div className="flex items-center gap-3 text-lg font-bold">
                <Sparkles className="w-5 h-5" />
                Criar com IA
              </div>
              <span className="text-sm font-medium text-indigo-100/90">Pronto em menos de 15 segundos</span>
            </button>
            <button
              onClick={() => setAppState('editor')}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-800/80 border border-white/10 hover:bg-slate-700/80 text-white text-lg font-bold rounded-2xl transition-all"
            >
              <Edit2 className="w-5 h-5" />
              Criar Manualmente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appState === 'ai-info') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-slate-100 flex flex-col font-sans items-center justify-center p-6">
        <div className="max-w-3xl bg-slate-800/50 border border-white/10 p-8 sm:p-12 rounded-3xl shadow-2xl text-center space-y-8">
          <div className="mx-auto w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 text-purple-400 border border-purple-500/30">
            <Wand2 className="w-8 h-8" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Magia Pura no seu Currículo
          </h2>
          <div className="text-lg text-slate-300 leading-relaxed max-w-xl mx-auto text-left space-y-4">
            <p className="text-center mb-6">A nossa IA transforma qualquer foto ou currículo antigo em material de <strong className="text-white">altíssimo nível</strong>.</p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-purple-400 mt-1">✓</span>
                <span><strong>Reescrita Profissional:</strong> Linguagem corporativa persuasiva que destaca seus resultados e liderança.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 mt-1">✓</span>
                <span><strong>Aprimoramento Automático:</strong> Organiza rascunhos rasos, inferindo e enriquecendo os pontos mais fracos.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 mt-1">✓</span>
                <span><strong>Super Simples:</strong> Basta enviar um PDF ou uma simples foto tirada pelo seu celular.</span>
              </li>
            </ul>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAiImport} 
              onClick={(e) => { (e.currentTarget as HTMLInputElement).value = ''; }}
              accept="application/pdf,image/*" 
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-purple-600 shadow-xl shadow-purple-600/30 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold rounded-2xl transition-all"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 rotate-180" />}
              {isProcessing ? "Analisando Arquivo..." : "Enviar Arquivo"}
            </button>
            <button
              onClick={() => setAppState('onboarding')}
              disabled={isProcessing}
              className="text-slate-400 hover:text-white font-medium text-sm transition-colors py-2 px-4"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Header Section */}
      <header className="flex flex-col lg:flex-row justify-between items-center px-4 sm:px-8 py-4 sm:py-5 z-10 shrink-0 gap-4 border-b border-white/5 bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl sm:text-2xl ring-1 ring-white/20 font-serif">
              R
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                Rezz
              </h1>
              <span className="text-sm sm:text-base text-indigo-300/80 font-medium tracking-wide">
                currículos
              </span>
            </div>
            
            <button 
              onClick={() => setPaymentEnabled(!paymentEnabled)}
              className={`hidden sm:flex ml-4 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${paymentEnabled ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}
              title="Apenas Dev: Liga ou desliga o modo de pagamento"
            >
              Pagamento: {paymentEnabled ? 'ON' : 'OFF'} (Dev)
            </button>
          </div>
          <div className="flex lg:hidden bg-slate-800/60 p-1 rounded-lg shrink-0 ring-1 ring-white/10">
            <button
              onClick={() => setMobileView('editor')}
              className={`p-2 rounded-md transition-all ${mobileView === 'editor' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-300'}`}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileView('preview')}
              className={`p-2 rounded-md transition-all ${mobileView === 'preview' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-300'}`}
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full lg:w-auto pt-2 lg:pt-0">
          <div className="flex w-full sm:w-auto items-center justify-between p-1 bg-slate-800/40 border border-white/10 rounded-xl shrink-0">
            {(['modern', 'classic', 'minimal'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTemplate(t as TemplateType)}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold rounded-lg transition-all capitalize flex items-center justify-center gap-1.5
                  ${template === t ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <span className="whitespace-nowrap">{templateNames[t]}</span>
              </button>
            ))}
          </div>
          
          <div className="flex gap-2 items-center justify-between sm:justify-center w-full sm:w-auto">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAiImport} 
              onClick={(e) => { (e.currentTarget as HTMLInputElement).value = ''; }}
              accept="application/pdf,image/*" 
              className="hidden" 
            />
            <button
              onClick={() => setIsPromptModalOpen(true)}
              disabled={isPrompting || isProcessing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-purple-500/20 border border-purple-500/50 hover:bg-purple-500/40 text-purple-200 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> <span className="whitespace-nowrap">Editar</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || isPrompting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-indigo-500/20 border border-indigo-500/50 hover:bg-indigo-500/40 text-indigo-200 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin shrink-0" /> : <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
              <span className="whitespace-nowrap">{isProcessing ? "Lendo..." : "Criar com IA"}</span>
            </button>
          </div>

          <div className="flex gap-2 items-center justify-between sm:justify-center w-full sm:w-auto mt-2 sm:mt-0 flex-wrap">
            {user ? (
              <>
                <button
                  onClick={() => setIsResumesModalOpen(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 bg-slate-800 border border-white/10 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm shrink-0"
                  title="Abrir currículos salvos"
                >
                  <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> <span className="hidden sm:inline">Abrir</span>
                </button>
                <button
                  onClick={handleSaveResume}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 bg-emerald-500/20 border border-emerald-500/50 hover:bg-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm shrink-0 disabled:opacity-50"
                  title="Salvar"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin shrink-0" /> : <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                  <span className="hidden sm:inline">Salvar</span>
                </button>
                <button
                  onClick={signOut}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-300 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm shrink-0"
                  title="Sair"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                </button>
              </>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 bg-white text-slate-900 border border-white/50 hover:bg-slate-100 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> 
                <span className="whitespace-nowrap">Entrar p/ Salvar</span>
              </button>
            )}

            <button
              onClick={handleDownloadClick}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 bg-indigo-500 shadow-lg shadow-indigo-500/40 hover:bg-indigo-400 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shrink-0"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> <span className="whitespace-nowrap">Baixar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 flex gap-4 sm:gap-6 overflow-hidden px-2 sm:px-6 pb-4 sm:pb-6 w-full max-w-[1920px] mx-auto">
        {isResumesModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-indigo-600" />
                  Seus Currículos Salvos
                </h3>
                <button 
                  onClick={() => setIsResumesModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
                {resumesList.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">Nenhum currículo salvo ainda.</p>
                ) : (
                  resumesList.map(resume => (
                    <button
                      key={resume.id}
                      onClick={() => handleLoadResume(resume)}
                      className="p-4 text-left border border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all flex flex-col gap-1"
                    >
                      <strong className="text-slate-800">{resume.data.personalInfo.fullName || 'Sem Nome'}</strong>
                      <span className="text-xs text-slate-500">
                        {resume.data.personalInfo.jobTitle || 'Sem Título'} • Atualizado em: {resume.updatedAt ? new Date(resume.updatedAt.toMillis()).toLocaleDateString() : 'Recente'}
                      </span>
                    </button>
                  ))
                )}
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setIsResumesModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
        {isPromptModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-600" />
                  Modificar Currículo com IA
                </h3>
                <button 
                  onClick={() => setIsPromptModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <p className="text-sm text-slate-600">
                  Descreva o que você gostaria de adicionar ou alterar no seu currículo. A IA atualizará as informações mantendo o formato preenchido.
                </p>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Ex: Adicione 3 habilidades de design gráfico e crie uma experiência como Designer Pleno na empresa TechX."
                  className="w-full h-32 p-3 text-sm text-gray-800 border-slate-300 rounded-md focus:ring-purple-500 focus:border-purple-500 border resize-none"
                  disabled={isPrompting}
                />
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setIsPromptModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  disabled={isPrompting}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAiPromptSubmit}
                  disabled={isPrompting || !promptText.trim()}
                  className="px-4 py-2 text-sm font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPrompting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {isPrompting ? 'Modificando...' : 'Aplicar Mudanças'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Editor sidebar */}
        <div className={`flex-1 h-full min-w-0 ${mobileView !== 'editor' ? 'hidden lg:block' : 'block'}`}>
          <ResumeForm data={data} onChange={setData} />
        </div>
        
        {/* Live Preview Area */}
        <section className={`w-full lg:w-[450px] xl:w-[600px] flex-col shrink-0 overflow-hidden ${mobileView !== 'preview' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex justify-between items-center mb-2 px-2 shrink-0 hidden lg:flex">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visualização Real</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto flex justify-center items-start pt-2 pb-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent rounded-lg" ref={containerRef}>
            <div 
              style={{ 
                transform: `scale(${scale})`, 
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease-out',
                height: 1056 * scale, // Maintain aspect ratio height reserve
                marginBottom: 40
              }}
              className="print:transform-none bg-white shadow-2xl rounded-sm text-slate-900"
            >
              <ResumePreview data={data} template={template} ref={componentRef} />
            </div>
          </div>
        </section>

        {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-8 text-center animate-in fade-in zoom-in duration-300">
               <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                 <CreditCard className="w-8 h-8" />
               </div>
               <h3 className="text-2xl font-bold text-slate-800 mb-2">Libere seu Currículo</h3>
               <p className="text-slate-600 mb-6">
                 Para gerar o PDF em alta qualidade, limpo e sem marcas, é necessário o pagamento da taxa única do serviço.
               </p>
               
               <a 
                 href={import.meta.env.VITE_CAKTO_CHECKOUT_URL || "https://pay.cakto.com.br/"} 
                 target="_blank" 
                 rel="noreferrer"
                 className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-500/30 transition-all mb-4 block"
               >
                 Pagar com Cakto
               </a>

               <button 
                 onClick={() => setIsPaymentModalOpen(false)}
                 className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
               >
                 Voltar e editar mais
               </button>
               
               <div className="mt-8 pt-6 border-t border-slate-100">
                 <button 
                   onClick={() => {
                     setHasPaid(true);
                     setIsPaymentModalOpen(false);
                     setTimeout(() => generatePdf(), 500);
                   }}
                   className="text-xs text-slate-400 hover:text-indigo-500 underline transition-colors"
                 >
                   (Botão Fake de Dev) Simular que já pagou
                 </button>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

