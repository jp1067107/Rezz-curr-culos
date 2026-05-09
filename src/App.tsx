/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ResumeData, TemplateType } from './types';
import { ResumeForm } from './components/ResumeForm';
import { ResumePreview } from './components/ResumePreview';
import { CoverLetterGenerator } from './components/CoverLetterGenerator';
import { extractResumeDataFromFiles } from './services/aiService';
import { auth, signInWithGoogle, signOut, saveResume, loadResumes, deleteResume, ResumeDoc } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Download, Sparkles, Loader2, Eye, Edit2, Wand2, X, LogIn, LogOut, Save, FolderOpen, CreditCard, CheckCircle, UserCircle, DollarSign, Share2, Link as LinkIcon, ArrowLeft, MonitorDown, Trash2 } from 'lucide-react';

import { v4 as uuidv4 } from 'uuid';

const getInitialData = (): ResumeData => ({
  id: uuidv4(),
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
});

interface ErrorBoundaryProps { children: React.ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // @ts-ignore
  public props: ErrorBoundaryProps;

  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
          <h1 className="text-3xl text-red-400 font-bold mb-4">Algo deu errado!</h1>
          <p className="text-slate-300 mb-6">Infelizmente ocorreu um erro interno.</p>
          <pre className="bg-black/50 p-4 rounded-xl border border-red-500/30 text-red-200 text-xs overflow-auto max-w-full">
            {this.state.error?.message}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-8 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-lg font-bold"
          >
            Recarregar Aplicativo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const [appState, setAppState] = useState<'onboarding' | 'ai-info' | 'editor' | 'payment-success' | 'affiliate' | 'cover-letter' | 'my-resumes' | 'purchased-view'>('onboarding');
  const [isPurchasedEditing, setIsPurchasedEditing] = useState(false);
  const [data, setData] = useState<ResumeData>(() => {
    const saved = localStorage.getItem('rezz_draft_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.id) parsed.id = uuidv4();
        return parsed;
      } catch (e) {
        return getInitialData();
      }
    }
    return getInitialData();
  });

  const [template, setTemplate] = useState<TemplateType>(() => {
    return (localStorage.getItem('rezz_template') as TemplateType) || 'modern';
  });
  useEffect(() => {
    localStorage.setItem('rezz_template', template);
  }, [template]);
  const componentRef = useRef<HTMLDivElement>(null);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  
  const [user, setUser] = useState<User | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const [currentResumeId, setCurrentResumeId] = useState<string>(() => {
    return localStorage.getItem('rezz_current_id') || uuidv4();
  });

  useEffect(() => {
    localStorage.setItem('rezz_current_id', currentResumeId);
  }, [currentResumeId]);
  const [resumesList, setResumesList] = useState<ResumeDoc[]>([]);
  const [localPurchasedResumes, setLocalPurchasedResumes] = useState<ResumeDoc[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('rezz_local_purchased') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('rezz_local_purchased', JSON.stringify(localPurchasedResumes));
  }, [localPurchasedResumes]);
  const [isSaving, setIsSaving] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [simulateOrderBump, setSimulateOrderBump] = useState(false);
  const [isInsufficientDataModalOpen, setIsInsufficientDataModalOpen] = useState(false);
  const [unlockedConfigs, setUnlockedConfigs] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('rezz_unlocked') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('rezz_draft_data', JSON.stringify(data));
    
    // Auto-update local purchased list if currently editing a purchased resume
    const signaturePrefix = `${currentResumeId}_`;
    if (unlockedConfigs.some(cfg => cfg.startsWith(signaturePrefix))) {
      setLocalPurchasedResumes(prev => {
        const index = prev.findIndex(r => r.id === currentResumeId);
        if (index >= 0) {
           const newResumes = [...prev];
           // Only update if data actually changed to avoid unnecessary re-renders
           if (JSON.stringify(newResumes[index].data) !== JSON.stringify(data)) {
             newResumes[index] = { ...newResumes[index], data, updatedAt: new Date().toISOString() };
             return newResumes;
           }
           return prev;
        } else {
           return [...prev, { id: currentResumeId, data, updatedAt: new Date().toISOString() }];
        }
      });
    }
  }, [data, currentResumeId, template, unlockedConfigs]);
  
  const signature = `${currentResumeId}_${template}`;
  const hasPaid = unlockedConfigs.includes(signature);
  const hasCoverLetter = unlockedConfigs.includes(`${currentResumeId}_cover_letter`);

  useEffect(() => {
    localStorage.setItem('rezz_unlocked', JSON.stringify(unlockedConfigs));
  }, [unlockedConfigs]);

  useEffect(() => {
    // Migration: If old rezz_has_paid exists, let's unlock the current signature.
    if (localStorage.getItem('rezz_has_paid') === 'true') {
      setUnlockedConfigs(prev => [...new Set([...prev, signature])]);
      localStorage.removeItem('rezz_has_paid'); // migrate fully to new system
    }
    if (localStorage.getItem('rezz_has_cover_letter') === 'true') {
      setUnlockedConfigs(prev => [...new Set([...prev, `${currentResumeId}_cover_letter`])]);
      localStorage.removeItem('rezz_has_cover_letter');
    }

    const params = new URLSearchParams(window.location.search);
    
    const affCode = params.get('ref') || params.get('src') || params.get('sck') || params.get('affCode');
    if (affCode) {
      localStorage.setItem('cakto_aff_code', affCode);
    }

    if (params.get('payment') === 'success') {
      setUnlockedConfigs(prev => {
        let newConfigs = [...prev, signature];
        if (params.get('cover_letter') === 'true' || params.get('order_bump') === 'cover_letter') {
          newConfigs.push(`${currentResumeId}_cover_letter`);
        }
        return [...new Set(newConfigs)];
      });
      
      // Save locally so it appears in "My Resumes" even without login
      setLocalPurchasedResumes(prev => {
        const exists = prev.find(r => r.id === currentResumeId);
        if (exists) return prev;
        const newResumes = [...prev, { id: currentResumeId, data, updatedAt: new Date().toISOString() }];
        localStorage.setItem('rezz_local_purchased', JSON.stringify(newResumes));
        return newResumes;
      });

      // Automatically save to cloud if user is logged in
      if (user) {
        saveResume(user.uid, currentResumeId, data)
          .then(() => fetchResumes(user.uid))
          .catch(err => console.error("Error auto-saving resume:", err));
      }
      
      window.history.replaceState({}, document.title, window.location.pathname);
      setAppState('payment-success');
    }
  }, [signature]); // adding signature so if it changes, we don't keep running (but we have params check) 
  // Wait, if signature changes we don't want to run the params check again unless it's in the URL, but window.history.replaceState removes 'payment=success'.
  // However, the old `localStorage` check might run again. Since we `removeItem`, it's safe.

  const getCheckoutUrl = () => {
    let baseUrl = import.meta.env.VITE_CAKTO_CHECKOUT_URL || "https://pay.cakto.com.br/";
    const affCode = localStorage.getItem('cakto_aff_code');
    
    if (affCode) {
      // Cria a URL com o parâmetro 'ref' ou 'src' dependendo de como a Cakto configurar
      // O padrão mais comum em plataformas é ?ref= ou ?sck=
      const urlObject = new URL(baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);
      urlObject.searchParams.set('ref', affCode);
      // Opcionalmente, pode setar o sck também para garantir o rastreio na Cakto:
      urlObject.searchParams.set('sck', affCode);
      return urlObject.toString();
    }
    
    return baseUrl;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Sync any local purchased resumes to the cloud now that we are logged in
        try {
          const localStr = localStorage.getItem('rezz_local_purchased');
          const unlockedStr = localStorage.getItem('rezz_unlocked');
          let localUnlocked: string[] = [];
          try { localUnlocked = JSON.parse(unlockedStr || '[]'); } catch (e) {}

          if (localStr) {
            const localArr = JSON.parse(localStr);
            if (Array.isArray(localArr) && localArr.length > 0) {
              const promises = localArr.map((localResume: any) => {
                const docUnlocked = localUnlocked.filter((cfg: string) => cfg.startsWith(`${localResume.id}_`));
                return saveResume(currentUser.uid, localResume.id, localResume.data, docUnlocked.length > 0 ? docUnlocked : undefined);
              });
              await Promise.all(promises);
            }
            // Clear local purchased resumes after successful sync so they don't duplicate or leak to other accounts
            localStorage.removeItem('rezz_local_purchased');
            setLocalPurchasedResumes([]);
          }
        } catch (err) {
          console.error("Failed to sync local resumes to cloud", err);
        }
        
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
    
    // Auto-sync unlocked configs from cloud to local device
    const cloudUnlocked = list.flatMap(r => r.unlockedTemplates || []);
    if (cloudUnlocked.length > 0) {
      setUnlockedConfigs(prev => {
        const merged = [...new Set([...prev, ...cloudUnlocked])];
        return merged;
      });
    }
  };

  const handleSaveResume = async () => {
    if (!user) {
      alert("Por favor, faça login para salvar seu currículo na nuvem. Você os encontra em 'Meus Currículos'.");
      return;
    }
    setIsSaving(true);
    try {
      const docUnlocked = unlockedConfigs.filter(cfg => cfg.startsWith(`${currentResumeId}_`));
      await saveResume(user.uid, currentResumeId, data, docUnlocked.length > 0 ? docUnlocked : undefined);
      await fetchResumes(user.uid);
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar o currículo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadResume = (doc: ResumeDoc) => {
    setCurrentResumeId(doc.id);
    setData(doc.data);
    setIsPurchasedEditing(false);
    setLastEnhancedLength(null);
    
    // Check if it's purchased
    const signaturePrefix = `${doc.id}_`;
    const isPurchased = unlockedConfigs.some(cfg => cfg.startsWith(signaturePrefix));
    
    if (isPurchased) {
      const purchasedTemplate = unlockedConfigs.find(cfg => cfg.startsWith(signaturePrefix))?.split('_')[1] as TemplateType;
      if (purchasedTemplate) setTemplate(purchasedTemplate);
      setAppState('purchased-view');
    } else {
      setAppState('editor');
    }
  };

  const isResumeWellFormed = () => {
    const hasName = (data.name?.trim()?.length ?? 0) > 0 || (data.personalInfo.fullName?.trim()?.length ?? 0) > 0;
    const hasContact = (data.personalInfo.email?.trim()?.length ?? 0) > 0 || (data.personalInfo.phone?.trim()?.length ?? 0) > 0;
    const hasExperience = data.experience && data.experience.length > 0 && data.experience.some(e => e.position?.trim() || e.company?.trim());
    const hasEducation = data.education && data.education.length > 0 && data.education.some(e => e.institution?.trim() || e.degree?.trim());
    const hasSkills = data.skills && data.skills.length > 0 && data.skills.some(s => s.name?.trim());
    const hasSummary = (data.personalInfo.summary?.trim()?.length ?? 0) > 10;
    
    return hasName && hasContact && (hasExperience || hasEducation || hasSkills || hasSummary);
  };

  const handleDownloadClick = async () => {
    if (!isResumeWellFormed()) {
      setIsInsufficientDataModalOpen(true);
      return;
    }

    if (!hasPaid) {
      setSimulateOrderBump(false);
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

    setIsProcessing(true);
    
    try {
      const wrapperElement = componentRef.current.parentElement;
      const originalTransform = wrapperElement?.style.transform || '';
      const originalTransition = wrapperElement?.style.transition || '';
      const originalHeight = wrapperElement?.style.height || '';
      const originalWidth = wrapperElement?.style.width || '';
      const originalPosition = wrapperElement?.style.position || '';
      
      if (wrapperElement) {
        // Prepare for capture: fix width to exactly 210mm (~794px) and remove scaling
        wrapperElement.style.transition = 'none';
        wrapperElement.style.transform = 'scale(1)';
        wrapperElement.style.width = '794px';
        wrapperElement.style.height = 'auto';
        wrapperElement.style.position = 'relative';
      }
      
      // Force a synchronous reflow
      void componentRef.current.offsetHeight;

      // Small delay to ensure the DOM paints at 100% scale and images are ready
      await new Promise(resolve => setTimeout(resolve, 150));

      const element = componentRef.current;

      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        onclone: (clonedDoc) => {
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.fontVariantLigatures = 'none';
            htmlEl.style.textRendering = 'optimizeLegibility';
            htmlEl.style.wordBreak = 'break-word';
          });
        }
      });

      // Restore the original layout
      if (wrapperElement) {
        wrapperElement.style.transform = originalTransform;
        wrapperElement.style.height = originalHeight;
        wrapperElement.style.width = originalWidth;
        wrapperElement.style.position = originalPosition;
        setTimeout(() => {
          if (wrapperElement) wrapperElement.style.transition = originalTransition;
        }, 50);
      }

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
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

      // Adiciona nova página apenas se sobrar um conteúdo significativo (evitar página extra em branco)
      while (heightLeft > 2) {
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

  const [isPrompting, setIsPrompting] = useState(false);
  const [lastEnhancedLength, setLastEnhancedLength] = useState<number | null>(null);

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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsProcessing(true);
      const extractedData = await extractResumeDataFromFiles(files);
      setData(extractedData);
      setCurrentResumeId(uuidv4());
      setLastEnhancedLength(null);
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

  const handleEnhanceWithAI = async () => {
    try {
      setIsPrompting(true); // We can still use isPrompting to show the loading state
      const { enhanceResumeData } = await import('./services/aiService');
      const newData = await enhanceResumeData(data);
      setData(newData);
      setLastEnhancedLength(JSON.stringify(newData).length);
    } catch (error: any) {
      alert(error.message || 'Falha ao aprimorar currículo com IA.');
    } finally {
      setIsPrompting(false);
    }
  };

  const returnToEditor = () => {
    setAppState(unlockedConfigs.some(cfg => cfg.startsWith(`${currentResumeId}_`)) ? 'purchased-view' : 'editor');
  };

  const templateNames = {
    modern: 'Moderno',
    classic: 'Clássico',
    minimal: 'Minimalista'
  };

  const purchasedResumes = (() => {
    // Combine cloud resumes + local purchased resumes
    const combined = [...resumesList, ...localPurchasedResumes];
    // Filter only those that are actually unlocked/purchased
    const filtered = combined.filter(resume => unlockedConfigs.some(cfg => cfg.startsWith(`${resume.id}_`)));
    // Remove duplicates by ID
    const unique = Array.from(new Map(filtered.map(item => [item.id, item])).values());
    return unique;
  })();

  const hasActiveResume = Boolean(
    data.personalInfo.fullName?.trim() || 
    data.personalInfo.jobTitle?.trim() || 
    data.personalInfo.summary?.trim() || 
    data.experience?.length > 0 || 
    data.education?.length > 0 || 
    data.skills?.length > 0
  );

  const currentDataLength = JSON.stringify(data).length;
  // Can enhance if never enhanced, or if user removed a significant amount of text
  const canEnhance = hasActiveResume && (lastEnhancedLength === null || currentDataLength < lastEnhancedLength - 100);

  return (
    <div className="w-full min-h-screen bg-slate-900 flex flex-col">
      {appState === 'onboarding' && (
        <div key="onboarding" className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100 flex flex-col font-sans relative overflow-hidden">
          {/* Header */}
          <header className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md relative z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg text-white font-black text-sm sm:text-xl ring-1 ring-white/20 font-serif">
                R
              </div>
              <span className="font-bold text-lg sm:text-xl tracking-tight text-white">Rezz</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] sm:text-xs font-bold rounded-xl border border-white/5 transition-all"
                >
                  <MonitorDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                  <span className="hidden min-[400px]:inline">Instalar App</span>
                </button>
              )}
              {user ? (
                <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 bg-slate-800/80 rounded-xl sm:rounded-full border border-white/5">
                  <div className="w-6 h-6 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 hidden sm:flex">
                    <UserCircle className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-slate-300 truncate max-w-[100px] sm:max-w-none">{user.displayName?.split(' ')[0] || 'Usuário'}</span>
                  <button onClick={() => {
                    signOut();
                    setLocalPurchasedResumes([]);
                    setUnlockedConfigs([]);
                    localStorage.removeItem('rezz_local_purchased');
                    localStorage.removeItem('rezz_unlocked');
                    setResumesList([]);
                  }} className="ml-1 sm:ml-2 text-slate-500 hover:text-red-400" title="Sair da conta">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20"
                >
                  <LogIn className="w-4 h-4" /> Entrar
                </button>
              )}
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto flex flex-col justify-center py-10 px-4 sm:px-6 relative w-full items-center">
            {/* Background effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none hidden sm:block"></div>

            <div className="max-w-4xl w-full space-y-10 relative z-10 flex flex-col items-center">
              <div className="text-center space-y-4 max-w-2xl">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                  O que você deseja<br/>fazer hoje?
                </h1>
                <p className="text-base sm:text-lg text-slate-400 font-medium px-4">
                  Acesse seus documentos salvos, crie um novo currículo vencedor ou participe do nosso programa de parceiros.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                
                {/* Meus Currículos - Featured */}
                <button
                  onClick={() => {
                    if (!user && purchasedResumes.length === 0) {
                       signInWithGoogle().then(() => setAppState('my-resumes'));
                    } else {
                       setAppState('my-resumes');
                    }
                  }}
                  className="col-span-1 md:col-span-2 flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-6 p-6 sm:p-8 bg-gradient-to-br from-slate-800/80 to-slate-800/40 hover:from-slate-700/80 hover:to-slate-800/80 border border-white/10 hover:border-indigo-500/40 rounded-3xl transition-all group shadow-xl"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all shrink-0">
                    <FolderOpen className="w-8 h-8 sm:w-10 sm:h-10" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 flex flex-col sm:flex-row items-center gap-3">
                      Meus Currículos
                      <span className="px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                        {purchasedResumes.length > 0 ? `${purchasedResumes.length} salvos` : (user ? 'Nuvem' : 'Acesse seus currículos')}
                      </span>
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base">
                      Acesse, edite ou exporte os currículos que você já criou. Tudo salvo com segurança na sua conta.
                    </p>
                  </div>
                  <div className="hidden sm:flex ml-auto pl-4">
                     <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all">
                       <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 rotate-180" />
                     </div>
                  </div>
                </button>

                {/* Criar Novo (IA) */}
                <button
                  onClick={() => setAppState('ai-info')}
                  className="flex flex-col text-center sm:text-left items-center sm:items-start p-6 sm:p-8 bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 hover:border-purple-500/30 rounded-3xl transition-all group"
                >
                  <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Criar Novo com IA</h2>
                  <p className="text-slate-400 text-sm">
                    Transforme uma foto ou PDF antigo em um currículo de alto nível em segundos usando inteligência artificial.
                  </p>
                </button>

                {/* Editor Manual */}
                <button
                  onClick={() => {
                   setAppState('editor');
                  }}
                  className="flex flex-col text-center sm:text-left items-center sm:items-start p-6 sm:p-8 bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 hover:border-slate-500/50 rounded-3xl transition-all group h-full"
                >
                  <div className="w-14 h-14 bg-slate-700/50 text-slate-300 group-hover:bg-slate-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all">
                    <Edit2 className="w-7 h-7" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Editor Manual</h2>
                  <p className="text-slate-400 text-sm">
                    Acesse o editor avançado. O seu progresso é salvo automaticamente no navegador enquanto você preenche os dados.
                  </p>
                </button>

                {/* Programa de Afiliados */}
                <button
                  onClick={() => setAppState('affiliate')}
                  className="col-span-1 md:col-span-2 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left p-6 sm:p-8 bg-emerald-900/10 hover:bg-emerald-900/20 border border-emerald-500/10 hover:border-emerald-500/30 rounded-3xl transition-all group gap-4 mt-2"
                >
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all shrink-0">
                      <DollarSign className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-emerald-50 mb-1">Programa de Afiliados</h3>
                      <p className="text-emerald-500/70 text-sm font-medium">Ganhe 45% de comissão indicando o Rezz</p>
                    </div>
                  </div>
                  <ArrowLeft className="hidden sm:block w-5 h-5 text-emerald-500/50 rotate-180 group-hover:translate-x-1 transition-all" />
                </button>

              </div>
            </div>
          </div>
        </div>
      )}

      {appState === 'ai-info' && (
        <div key="ai-info" className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-slate-100 flex flex-col font-sans items-center justify-center p-6">
          <div className="max-w-3xl bg-slate-800/50 border border-white/10 p-8 sm:p-12 rounded-3xl shadow-2xl text-center space-y-8">
            <div className="mx-auto w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 text-purple-400 border border-purple-500/30">
              <Wand2 className="w-8 h-8" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Tecnologia Pura no seu Currículo
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
                multiple
                ref={fileInputRef} 
                onChange={handleAiImport} 
                onClick={(e) => { (e.currentTarget as HTMLInputElement).value = ''; }}
                accept="application/pdf,image/*" 
                className="hidden" 
              />
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  } else {
                    setTimeout(() => fileInputRef.current?.click(), 100);
                  }
                }}
                disabled={isProcessing}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-purple-600 shadow-xl shadow-purple-600/30 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold rounded-2xl transition-all"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 rotate-180" />}
                {isProcessing ? "Analisando Arquivo(s)..." : "Enviar Arquivo(s)"}
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
      )}

      {appState === 'payment-success' && (
        <div key="payment-success" className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-slate-100 flex flex-col font-sans items-center justify-center p-6">
          <div className="max-w-xl bg-slate-800/50 border border-emerald-500/20 p-8 sm:p-12 rounded-3xl shadow-2xl shadow-emerald-500/10 text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="mx-auto w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Pagamento Confirmado!
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed max-w-md mx-auto">
              Muito obrigado pela confiança. Seu acesso para exportar o currículo limpo e em alta qualidade foi liberado com sucesso.
            </p>
            <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => setAppState('purchased-view')}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 shadow-xl shadow-emerald-600/30 hover:bg-emerald-500 text-white text-lg font-bold rounded-2xl transition-all w-full sm:w-auto"
              >
                Acessar Meu Currículo
              </button>
              {hasCoverLetter && (
                <button
                  onClick={() => setAppState('cover-letter')}
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-purple-600 shadow-xl shadow-purple-600/30 hover:bg-purple-500 text-white text-lg font-bold rounded-2xl transition-all w-full sm:w-auto"
                >
                  <Wand2 className="w-5 h-5" /> Acessar Carta
                </button>
              )}
              <button
                onClick={() => setAppState('affiliate')}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white text-lg font-bold rounded-2xl transition-all w-full sm:w-auto"
              >
                Como Ganhar Dinheiro
              </button>
            </div>
          </div>
        </div>
      )}

      {appState === 'affiliate' && (
        <div key="affiliate" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
          <header className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-white/5 bg-slate-900/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl ring-1 ring-white/20 font-serif">
                R
              </div>
              <h1 className="text-xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">
                Programa de Afiliados
              </h1>
            </div>
            <button
              onClick={() => setAppState('onboarding')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
          </header>
          
          <main className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto p-4 sm:p-8 flex flex-col gap-8 pb-20">
             <div className="text-center space-y-4 py-8">
               <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20">
                 <DollarSign className="w-10 h-10" />
               </div>
               <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Ganhe recomendando o Rezz</h2>
               <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                 Ajude outras pessoas a conseguirem o emprego dos sonhos e fature com isso. Receba uma comissão generosa por cada venda realizada através do seu link exclusivo da Cakto.
               </p>
             </div>

             <div className="grid sm:grid-cols-3 gap-6">
               <div className="bg-slate-800/50 border border-white/5 p-6 rounded-2xl flex flex-col items-center text-center gap-4">
                 <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                   <LinkIcon className="w-6 h-6" />
                 </div>
                 <h3 className="font-bold text-lg text-white">1. Crie seu Link</h3>
                 <p className="text-slate-400 text-sm">Cadastre-se na Cakto como afiliado do nosso produto e copie seu link de indicação exclusivo.</p>
               </div>
               <div className="bg-slate-800/50 border border-white/5 p-6 rounded-2xl flex flex-col items-center text-center gap-4">
                 <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
                   <Share2 className="w-6 h-6" />
                 </div>
                 <h3 className="font-bold text-lg text-white">2. Compartilhe seu Link</h3>
                 <p className="text-slate-400 text-sm">Na Cakto, copie o seu link de afiliado da <strong>Página de Vendas</strong>. Compartilhe-o no LinkedIn, TikTok ou WhatsApp.</p>
               </div>
               <div className="bg-slate-800/50 border border-white/5 p-6 rounded-2xl flex flex-col items-center text-center gap-4">
                 <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                   <DollarSign className="w-6 h-6" />
                 </div>
                 <h3 className="font-bold text-lg text-white">3. Receba</h3>
                 <p className="text-slate-400 text-sm">Quando o cliente vier pelo seu link, montar o currículo e pagar para exportar, a comissão entra na hora na sua conta Cakto!</p>
               </div>
             </div>

             <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left mt-8">
               <div className="flex-1 space-y-4">
                 <h2 className="text-2xl font-bold text-white">Pronto para começar?</h2>
                 <p className="text-slate-300">
                   Siga o link abaixo para ir direto para a plataforma da Cakto, afiliar-se com 1 clique e começar a ganhar 45% de comissão por cada venda!
                 </p>
                 <a 
                   href="https://app.cakto.com.br/affiliate/invite/4ca6dedc-130a-49fe-aee2-5216ede37d0e"
                   target="_blank" 
                   rel="noreferrer"
                   className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 mt-4"
                 >
                   Quero ser Afiliado do Rezz (45% de Ganho)
                 </a>
               </div>
             </div>
          </main>
        </div>
      )}

      {appState === 'cover-letter' && (
        <div key="cover-letter" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
          <header className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-white/5 bg-slate-900/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 text-white font-black text-xl ring-1 ring-white/20">
                <Wand2 className="w-5 h-5" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">
                Gerador de Carta de Apresentação
              </h1>
            </div>
            <button
              onClick={returnToEditor}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
          </header>

          <main className="flex-1 overflow-y-auto w-full mx-auto p-4 sm:p-8 flex flex-col gap-6 pb-20">
            <CoverLetterGenerator data={data} setData={setData} />
          </main>
        </div>
      )}

      {appState === 'purchased-view' && (() => {
        const purchasedTemplates = (['modern', 'classic', 'minimal'] as TemplateType[]).filter(t => unlockedConfigs.includes(`${currentResumeId}_${t}`));
        
        return (
        <div key="purchased-view" className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-indigo-500 to-purple-500 shrink-0"></div>
          <header className="flex flex-col lg:flex-row justify-between items-center px-4 sm:px-6 py-4 border-b border-emerald-500/10 bg-slate-900/40 backdrop-blur-md z-10 shrink-0 relative gap-3">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none"></div>
            <div className="flex w-full lg:w-auto items-center justify-between lg:justify-start gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAppState('my-resumes')}
                  className="p-2 bg-slate-800/80 border border-white/5 hover:bg-slate-700 text-slate-300 rounded-xl transition-all shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex flex-col">
                  <h1 className="text-lg sm:text-xl font-bold text-white leading-tight truncate max-w-[150px] sm:max-w-xs">
                    {data.name || (data.personalInfo.fullName ? data.personalInfo.fullName.split(' ')[0] : '') || 'Currículo Adquirido'}
                  </h1>
                  <span className="text-[10px] sm:text-xs text-emerald-400 font-bold px-1.5 sm:px-2 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1 w-fit mt-1">
                    <CheckCircle className="w-3 h-3" /> Comprado
                  </span>
                </div>
              </div>

              {/* Mobile Download Button (Visible only on small screens) */}
              <button
                onClick={handleDownloadClick}
                className="flex lg:hidden items-center justify-center gap-2 px-5 py-2 bg-emerald-600 shadow-md shadow-emerald-500/30 font-bold text-white hover:bg-emerald-500 rounded-xl transition-all"
                title="Exportar PDF"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Exportar</span>
              </button>
            </div>

            <div className="flex w-full lg:w-auto items-center justify-between lg:justify-end gap-2 sm:gap-3 relative z-10">
              <button
                onClick={handleSaveResume}
                disabled={isSaving}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-all border border-white/5 shadow-sm"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Salvar</span>
              </button>



              <button
                onClick={() => setIsPurchasedEditing(!isPurchasedEditing)}
                className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-white/5 text-sm font-bold rounded-xl transition-all shadow-sm"
              >
                <Edit2 className="w-4 h-4" />
                <span>{isPurchasedEditing ? 'Ocultar Edição' : 'Editar Dados'}</span>
              </button>

              <button
                onClick={() => setMobileView(mobileView === 'editor' ? 'preview' : 'editor')}
                className="flex lg:hidden flex-1 justify-center items-center gap-2 px-3 sm:px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-bold rounded-xl transition-all border border-white/5"
              >
                {mobileView === 'editor' ? <Eye className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                <span className="inline">{mobileView === 'editor' ? 'Ver PDF' : 'Editar Dados'}</span>
              </button>

              {hasCoverLetter && (
                <button
                  onClick={() => setAppState('cover-letter')}
                  className="flex lg:flex-none flex-1 justify-center items-center gap-2 px-3 sm:px-6 py-2 bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/30 text-white text-sm font-bold rounded-xl transition-all"
                >
                  <Wand2 className="w-4 h-4" />
                  <span className="inline">Carta Profissional</span>
                </button>
              )}

              <button
                onClick={handleDownloadClick}
                className="hidden lg:flex items-center gap-2 px-4 sm:px-6 py-2 bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 text-white text-sm font-bold rounded-xl transition-all"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar PDF</span>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-hidden flex flex-col lg:flex-row p-4 gap-6 items-center lg:items-start justify-center relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
            <div className="absolute inset-0 bg-slate-950/80 pointer-events-none"></div>
            <div className={`w-full lg:w-1/2 max-w-[800px] h-full overflow-y-auto bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex-col transition-all z-10 ${isPurchasedEditing ? 'lg:flex' : 'lg:hidden'} ${mobileView === 'editor' ? 'flex' : 'hidden'}`}>
               <ResumeForm data={data} onChange={setData} />
            </div>

            <div className={`h-full w-full max-w-[1000px] flex-col transition-all z-10 ${!isPurchasedEditing ? 'lg:flex-1' : 'lg:w-1/2'} ${mobileView === 'preview' ? 'flex' : 'hidden'} lg:flex`}>
              <div className="flex justify-center mb-6 gap-2 shrink-0">
                <div className="bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xl flex gap-1">
                  {purchasedTemplates.map(t => (
                    <button
                      key={t}
                      onClick={() => setTemplate(t)}
                      className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${template === t ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'}`}
                    >
                      {templateNames[t]}
                    </button>
                  ))}
                </div>
              </div>



              <div className="flex-1 overflow-y-auto flex items-start justify-center pb-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent rounded-lg" ref={containerRef}>
                <div style={{ height: 1122.52 * scale, width: 794 * scale }} className="flex justify-center transition-all duration-300">
                  <div 
                    style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
                    className="shadow-2xl rounded-sm transition-all duration-300 bg-white text-slate-900 ring-1 ring-black/5 shrink-0"
                  >
                    <ResumePreview data={data} template={template} ref={componentRef} />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
        );
      })()}

      {appState === 'my-resumes' && (
        <div key="my-resumes" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
          <header className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-white/5 bg-slate-900/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl ring-1 ring-white/20 font-serif">
                <FolderOpen className="w-5 h-5" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">
                Meus Currículos
              </h1>
            </div>
            <button
              onClick={() => setAppState('onboarding')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
          </header>
          
          <main className="flex-1 overflow-y-auto w-full max-w-6xl mx-auto p-4 sm:p-8 flex flex-col gap-6 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button
                onClick={() => {
                   const initial = getInitialData();
                   setData(initial);
                   setCurrentResumeId(initial.id || uuidv4());
                   setLastEnhancedLength(null);
                   setAppState('editor');
                }}
                className="bg-slate-800/40 border border-white/10 hover:border-indigo-500/50 hover:bg-slate-800/80 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-white min-h-[160px] group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="font-medium text-lg">Criar Novo Currículo</span>
              </button>
              
              {purchasedResumes.length > 0 && purchasedResumes.map(resume => (
                  <div key={resume.id} className={`bg-slate-800/80 border ${currentResumeId === resume.id ? 'border-indigo-500 shadow-lg shadow-indigo-500/10' : 'border-white/10 hover:border-indigo-500/50'} rounded-2xl p-5 transition-all flex flex-col gap-4 relative group`}>
                    {currentResumeId === resume.id && (
                      <div className="absolute -top-3 -right-3 bg-indigo-500 text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-md shadow-indigo-500/20">
                        Aberto Agora
                      </div>
                    )}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          defaultValue={resume.data.name || resume.data.personalInfo.fullName || 'Sem Nome'}
                          className="w-full bg-transparent text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded px-2 py-1 -ml-2 border border-transparent focus:bg-slate-900 transition-all border-b-white/10 hover:border-b-white/30 truncate"
                          placeholder="Nome do Currículo"
                          title="Clique para editar o nome"
                          onBlur={async (e) => {
                            const newName = e.target.value.trim();
                            if (newName && newName !== resume.data.name) {
                              const updatedData = { ...resume.data, name: newName };
                              if (user) {
                                const docUnlocked = unlockedConfigs.filter(cfg => cfg.startsWith(`${resume.id}_`));
                                await saveResume(user.uid, resume.id, updatedData, docUnlocked.length > 0 ? docUnlocked : undefined);
                                setResumesList(prev => prev.map(r => r.id === resume.id ? { ...r, data: updatedData } : r));
                              }
                              // Always update local list if it's there
                              setLocalPurchasedResumes(prev => prev.map(r => r.id === resume.id ? { ...r, data: updatedData } : r));
                              
                              if (currentResumeId === resume.id) setData(updatedData);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                        />
                        <p className="text-sm text-slate-400 px-1 mt-1 truncate">
                          {resume.data.personalInfo.jobTitle || 'Sem Título'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                      <span className="text-xs text-slate-500">
                        {resume.updatedAt ? new Date(typeof resume.updatedAt === 'string' ? resume.updatedAt : (typeof resume.updatedAt.toMillis === 'function' ? resume.updatedAt.toMillis() : (resume.updatedAt.seconds ? resume.updatedAt.seconds * 1000 : resume.updatedAt))).toLocaleDateString() : 'Recente'}
                      </span>
                      <div className="flex gap-2">
                        {user?.email === 'jp1067107@gmail.com' && (
                          <button
                            onClick={async () => {
                              if (window.confirm("Certeza que deseja excluir este currículo?")) {
                                if (user) {
                                  await deleteResume(user.uid, resume.id);
                                  setResumesList(prev => prev.filter(r => r.id !== resume.id));
                                }
                                setLocalPurchasedResumes(prev => prev.filter(r => r.id !== resume.id));
                                if (currentResumeId === resume.id) {
                                  const initial = getInitialData();
                                  setData(initial);
                                  setCurrentResumeId(initial.id || uuidv4());
                                }
                              }
                            }}
                            className="p-2 bg-red-900/40 hover:bg-red-800 text-red-200 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleLoadResume(resume)}
                          className={`px-4 py-2 ${currentResumeId === resume.id ? 'bg-slate-700 text-slate-300' : 'bg-indigo-600 hover:bg-indigo-500 text-white'} text-sm font-bold rounded-lg transition-all`}
                        >
                          {currentResumeId === resume.id ? 'Aberto' : 'Abrir'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          </main>
        </div>
      )}

      {appState === 'editor' && (
        <div key="editor" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Header Section */}
      <header className="flex flex-col lg:flex-row justify-between items-center px-4 sm:px-6 py-3 z-10 shrink-0 gap-4 border-b border-white/5 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (hasActiveResume) {
                  handleSaveResume();
                }
                setAppState('onboarding');
              }}
              className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-white/5 shadow-sm transition-all shrink-0 mr-1 sm:mr-2"
              title="Voltar ao Início"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl ring-1 ring-white/20 font-serif">
              R
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">
                Rezz
              </h1>
            </div>
            
          </div>

          <button
            onClick={handleDownloadClick}
            className="flex lg:hidden items-center justify-center gap-2 px-5 py-2 bg-emerald-600 shadow-md shadow-emerald-500/30 font-bold text-white hover:bg-emerald-500 rounded-xl transition-all"
            title="Exportar PDF"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Exportar</span>
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full lg:w-auto pt-2 lg:pt-0">
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-white/5 transition-all w-full sm:w-auto justify-center"
            >
              <MonitorDown className="w-4 h-4" /> Instalar App
            </button>
          )}
          
          <div className="flex gap-2 items-center justify-between sm:justify-center w-full sm:w-auto flex-wrap">
            {user ? (
              <button
                onClick={handleSaveResume}
                disabled={isSaving || !hasActiveResume}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all shadow-sm shrink-0 ${hasActiveResume ? 'bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 border border-white/5 text-slate-500 cursor-not-allowed opacity-50'}`}
                title="Salvar"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className={`w-4 h-4 ${hasActiveResume ? 'text-emerald-400' : 'text-slate-500'}`} />}
                <span className="hidden sm:inline">Salvar</span>
              </button>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 border border-white/10 hover:bg-slate-700 text-sm font-medium rounded-xl transition-all shadow-sm shrink-0"
              >
                <LogIn className="w-4 h-4" /> 
                <span className="whitespace-nowrap">Entrar para Salvar</span>
              </button>
            )}

            <button
              onClick={() => setMobileView(mobileView === 'editor' ? 'preview' : 'editor')}
              className="flex lg:hidden flex-1 sm:flex-none justify-center items-center gap-2 px-3 sm:px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-bold rounded-xl transition-all border border-white/5"
            >
              {mobileView === 'editor' ? <Eye className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              <span className="inline">{mobileView === 'editor' ? 'Ver PDF' : 'Editar Dados'}</span>
            </button>

            <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block"></div>

            <button
              onClick={handleDownloadClick}
              className={`hidden lg:flex items-center justify-center gap-2 px-6 py-2 text-sm font-bold rounded-xl transition-all shrink-0 ${hasActiveResume ? 'bg-indigo-500 shadow-md shadow-indigo-500/20 hover:bg-indigo-400 text-white' : 'bg-slate-800 border border-white/5 hover:border-indigo-500/50 text-slate-300'}`}
            >
              <Download className="w-4 h-4" /> <span className="whitespace-nowrap">Exportar PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 flex gap-6 overflow-hidden p-3 sm:p-6 w-full max-w-[1920px] mx-auto">

        {/* Editor sidebar */}
        <div className={`flex-1 h-full min-w-0 flex flex-col gap-4 ${mobileView !== 'editor' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex flex-col lg:flex-row gap-4 p-4 bg-slate-800/40 border border-white/5 rounded-2xl shrink-0 items-start lg:items-center justify-between">
            <div>
              <h2 className="text-white font-semibold text-lg">Seu Currículo</h2>
              <p className="text-slate-400 text-sm hidden sm:block">Preencha os dados manualmente ou use IA.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <input 
                type="file" 
                multiple
                ref={fileInputRef} 
                onChange={handleAiImport} 
                onClick={(e) => { (e.currentTarget as HTMLInputElement).value = ''; }}
                accept="application/pdf,image/*" 
                className="hidden" 
              />
              <button
                onClick={handleEnhanceWithAI}
                disabled={isPrompting || isProcessing || !canEnhance}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all shadow-sm shrink-0 ${canEnhance ? 'bg-purple-500/20 border border-purple-500/50 hover:bg-purple-500/40 text-purple-200 cursor-pointer' : 'bg-slate-800 border border-white/5 text-slate-500 cursor-not-allowed opacity-50'}`}
                title={canEnhance ? "Aprimorar textos para uma linguagem profissional usando IA" : (hasActiveResume ? "Limite de aprimoramento atingido para esses dados" : "Preencha o currículo primeiro")}
              >
                {isPrompting ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Wand2 className="w-4 h-4 shrink-0" />}
                <span className="whitespace-nowrap">{isPrompting ? "Aprimorando..." : "Aprimorar com IA"}</span>
              </button>
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  } else {
                    setTimeout(() => fileInputRef.current?.click(), 100);
                  }
                }}
                disabled={isProcessing || isPrompting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-500/50 hover:bg-indigo-500/40 text-indigo-200 text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                title="Recriar currículo usando inteligência artificial"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Sparkles className="w-4 h-4 shrink-0" />}
                <span className="whitespace-nowrap">{isProcessing ? "Lendo..." : "Refazer com IA"}</span>
              </button>
            </div>
          </div>
          <ResumeForm data={data} onChange={setData} />
        </div>
        
        {/* Live Preview Area */}
        <section className={`w-full lg:w-[450px] xl:w-[550px] 2xl:w-[700px] flex flex-col shrink-0 overflow-hidden ${mobileView !== 'preview' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex justify-between items-center mb-2 px-2 shrink-0 hidden lg:flex">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visualização Real</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
            </div>
          </div>

          <div className="flex items-center justify-between p-1 bg-slate-900 border border-white/10 rounded-xl shrink-0 w-full mb-4">
            {(['modern', 'classic', 'minimal'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTemplate(t as TemplateType)}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg transition-all capitalize flex items-center justify-center gap-1.5
                  ${template === t ? 'bg-indigo-500 text-white shadow-sm ring-1 ring-white/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <span className="whitespace-nowrap">{templateNames[t]}</span>
              </button>
            ))}
          </div>

          <div className="lg:hidden w-full mb-4 px-2">
            <button
              onClick={handleEnhanceWithAI}
              disabled={isPrompting || isProcessing || !canEnhance}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl transition-all shadow-sm ${canEnhance ? 'bg-purple-500/20 border border-purple-500/50 hover:bg-purple-500/40 text-purple-200 cursor-pointer' : 'bg-slate-800 border border-white/5 text-slate-500 cursor-not-allowed opacity-50'}`}
              title={canEnhance ? "Aprimorar textos para uma linguagem profissional usando IA" : (hasActiveResume ? "Limite de aprimoramento atingido para esses dados" : "Preencha o currículo primeiro")}
            >
              {isPrompting ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Wand2 className="w-4 h-4 shrink-0" />}
              <span className="whitespace-nowrap">{isPrompting ? "Aprimorando..." : "Aprimorar com IA"}</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto flex justify-center items-start pt-2 lg:pt-0 pb-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent rounded-lg" ref={containerRef}>
            <div style={{ height: 1122.52 * scale, width: 794 * scale }} className="flex justify-center transition-all duration-300">
              <div 
                style={{ 
                  transform: `scale(${scale})`, 
                  transformOrigin: 'top center'
                }}
                className={`print:transform-none shadow-2xl rounded-sm transition-all duration-300 shrink-0 ${hasActiveResume ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-400 grayscale opacity-80 blur-[0.5px] select-none pointer-events-none'}`}
              >
                <ResumePreview data={data} template={template} ref={componentRef} />
              </div>
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
                 O pagamento desbloqueia a exportação deste currículo específico com o layout atual permanentemente.
               </p>
               
               <a 
                 href={getCheckoutUrl()} 
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
               
              {user?.email === 'jp1067107@gmail.com' && (
               <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-3">
                 <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-500">
                   <input
                     type="checkbox"
                     checked={simulateOrderBump}
                     onChange={(e) => setSimulateOrderBump(e.target.checked)}
                     className="w-4 h-4 rounded text-indigo-500"
                   />
                   Simular compra COM Order Bump (Carta)
                 </label>
                 <button 
                   onClick={() => {
                     setUnlockedConfigs(prev => {
                       let next = [...prev, signature];
                       if (simulateOrderBump) next.push(`${currentResumeId}_cover_letter`);
                       return [...new Set(next)];
                     });
                     setIsPaymentModalOpen(false);
                     setAppState('payment-success');
                   }}
                   className="text-xs text-slate-400 hover:text-indigo-500 underline transition-colors"
                 >
                   (Botão Fake de Dev) Simular que já pagou
                 </button>
               </div>
              )}
            </div>
          </div>
        )}

        {isInsufficientDataModalOpen && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-8 text-center animate-in fade-in zoom-in duration-300">
               <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30">
                 <Edit2 className="w-8 h-8" />
               </div>
               <h3 className="text-2xl font-bold text-slate-800 mb-2">Currículo Incompleto</h3>
               <p className="text-slate-600 mb-6">
                 Parece que seu currículo ainda não está totalmente preenchido. Para garantir que você tenha um ótimo resultado, precisamos de pelo menos:
               </p>
               <ul className="text-left text-sm text-slate-600 mb-8 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <li className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                   Seu nome completo
                 </li>
                 <li className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                   Uma forma de contato (Email ou Telefone)
                 </li>
                 <li className="flex items-center gap-2 items-start">
                   <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                   <span>Uma seção com conteúdo (Resumo, Experiência, Educação ou Habilidades)</span>
                 </li>
               </ul>

               <button 
                 onClick={() => setIsInsufficientDataModalOpen(false)}
                 className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-slate-800/30 transition-all"
               >
                 Continuar Editando
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
    )}



    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

