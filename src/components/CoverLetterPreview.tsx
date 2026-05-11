import React, { forwardRef } from 'react';
import { ResumeData, TemplateType } from '../types';
import { Mail, Phone, MapPin } from 'lucide-react';

interface Props {
  data: ResumeData;
  template: TemplateType;
}

export const CoverLetterPreview = forwardRef<HTMLDivElement, Props>(({ data, template }, ref) => {
  const { personalInfo, coverLetter } = data;
  
  if (!coverLetter) return <div ref={ref}></div>;

  const renderModern = () => (
    <div className="w-[794px] h-[1122.52px] bg-white shadow-2xl relative overflow-hidden flex flex-col mx-auto text-left" style={{ pageBreakAfter: 'always' }}>
      <div className="h-4 bg-[#2563eb] w-full absolute top-0 left-0"></div>
      
      <div className="px-10 pt-16 pb-8 border-b-2 border-slate-100 flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-[#0f172a] mb-2">{personalInfo.fullName || 'Seu Nome'}</h1>
          {(personalInfo.title || targetJobLabel) && <p className="text-[#3b82f6] font-semibold text-lg uppercase tracking-wider">{personalInfo.title || targetJobLabel}</p>}
        </div>
      </div>

      <div className="px-10 py-6 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-4 text-sm text-[#475569]">
        {personalInfo.email && (
          <div className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-[#3b82f6]" /> {personalInfo.email}</div>
        )}
        {personalInfo.phone && (
          <div className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-[#3b82f6]" /> {personalInfo.phone}</div>
        )}
        {personalInfo.location && (
          <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#3b82f6]" /> {personalInfo.location}</div>
        )}
      </div>

      <div className="p-10 flex-1 flex flex-col">
        <div className="flex-1 prose prose-sm max-w-none text-[#334155] whitespace-pre-line" style={{ lineHeight: '1.8' }}>
          {coverLetter}
        </div>
      </div>
    </div>
  );

  const renderClassic = () => (
    <div className="w-[794px] h-[1122.52px] bg-[#f8fafc] shadow-2xl flex mx-auto text-left" style={{ pageBreakAfter: 'always' }}>
      <div className="w-1/3 bg-[#1e293b] text-white p-8 flex flex-col">
        <h1 className="text-4xl font-bold uppercase mb-2 w-full">{personalInfo.fullName || 'Seu Nome'}</h1>
        <p className="text-[#94a3b8] tracking-widest text-sm uppercase mb-10">{personalInfo.title || targetJobLabel}</p>
        
        <div className="mb-10">
          <h2 className="text-lg font-bold border-b border-[#334155] pb-2 mb-4 uppercase tracking-wider text-[#e2e8f0]">Contato</h2>
          <ul className="space-y-4 text-sm text-[#cbd5e1]">
             {personalInfo.phone && <li className="flex items-center gap-3"><Phone className="w-4 h-4" /> {personalInfo.phone}</li>}
             {personalInfo.email && <li className="flex items-center gap-3"><Mail className="w-4 h-4" /> {personalInfo.email}</li>}
             {personalInfo.location && <li className="flex items-center gap-3"><MapPin className="w-4 h-4" /> {personalInfo.location}</li>}
          </ul>
        </div>
      </div>
      <div className="w-2/3 p-10 flex flex-col">
        <h2 className="text-2xl font-bold border-b-2 border-[#1e293b] pb-2 mb-6 uppercase tracking-wider text-[#1e293b]">Carta de Apresentação</h2>
        <div className="flex-1 prose prose-sm max-w-none text-[#334155] whitespace-pre-line" style={{ lineHeight: '1.8' }}>
          {coverLetter}
        </div>
      </div>
    </div>
  );

  const renderMinimal = () => (
    <div className="w-[794px] h-[1122.52px] bg-white shadow-2xl p-12 mx-auto flex flex-col text-left" style={{ pageBreakAfter: 'always' }}>
      <header className="text-center mb-10 pb-8 border-b border-gray-200">
        <h1 className="text-5xl font-extrabold mb-2">{personalInfo.fullName || 'Seu Nome'}</h1>
        <p className="text-lg text-gray-500 uppercase tracking-[0.2em]">{personalInfo.title || targetJobLabel}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-gray-600">
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.email && <span>• {personalInfo.email}</span>}
          {personalInfo.location && <span>• {personalInfo.location}</span>}
        </div>
      </header>
      <div className="flex-1">
         <h2 className="text-xs font-bold text-[#9ca3af] uppercase mb-6">Carta de Apresentação</h2>
         <div className="prose prose-sm max-w-none text-[#334155] whitespace-pre-line text-justify" style={{ lineHeight: '1.8' }}>
          {coverLetter}
        </div>
      </div>
    </div>
  );

  const targetJobLabel = "";

  return (
    <div ref={ref} className="origin-top print:m-0 print:p-0">
      {template === 'modern' && renderModern()}
      {template === 'classic' && renderClassic()}
      {template === 'minimal' && renderMinimal()}
    </div>
  );
});
