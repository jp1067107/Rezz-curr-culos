import React, { forwardRef } from 'react';
import { ResumeData, TemplateType } from '../types';
import { Mail, Phone, MapPin, Linkedin } from 'lucide-react';

interface Props {
  data: ResumeData;
  template: TemplateType;
}

export const CoverLetterPreview = forwardRef<HTMLDivElement, Props>(({ data, template }, ref) => {
  const { personalInfo, coverLetter } = data;
  
  if (!coverLetter) return <div ref={ref}></div>;

  const renderModern = () => (
    <div className="w-[794px] h-[1122.52px] bg-[#ffffff] shadow-2xl relative overflow-hidden flex flex-col mx-auto text-left" style={{ pageBreakAfter: 'always' }}>
      <div className="h-4 bg-[#2563eb] w-full absolute top-0 left-0"></div>
      
      <div className="px-10 pt-16 pb-8 border-b-2 border-[#f1f5f9] flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-[#0f172a] mb-2">{personalInfo.fullName || 'Seu Nome'}</h1>
          {(personalInfo.jobTitle || targetJobLabel) && <p className="text-[#3b82f6] font-semibold text-lg uppercase tracking-wider">{personalInfo.jobTitle || targetJobLabel}</p>}
        </div>
      </div>

      <div className="px-10 py-6 bg-[#f8fafc] border-b border-[#f1f5f9] flex flex-wrap gap-4 text-sm text-[#475569]">
        {personalInfo.email && (
          <div className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-[#3b82f6]" /> {personalInfo.email}</div>
        )}
        {personalInfo.phone && (
          <div className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-[#3b82f6]" /> {personalInfo.phone}</div>
        )}
        {personalInfo.location && (
          <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#3b82f6]" /> {personalInfo.location}</div>
        )}
        {personalInfo.linkedin && (
          <div className="flex items-center gap-1.5"><Linkedin className="w-4 h-4 text-[#3b82f6]" /> {personalInfo.linkedin}</div>
        )}
      </div>

      <div className="p-10 flex-1 flex flex-col">
        <div className="flex-1 prose prose-sm max-w-none text-[#334155] whitespace-pre-line" style={{ lineHeight: '1.8' }}>
          {coverLetter}
        </div>
      </div>
    </div>
  );

  const renderClassic = () => {
    const today = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
    return (
      <div className="w-[794px] h-[1122.52px] bg-[#ffffff] shadow-2xl p-12 mx-auto flex flex-col text-left font-sans text-[black]" style={{ pageBreakAfter: 'always' }}>
        <header className="mb-8">
          <h1 className="text-3xl font-bold uppercase mb-1">{personalInfo.fullName || 'Seu Nome'}</h1>
          <div className="flex flex-wrap gap-x-3 text-sm">
            {personalInfo.location && <span>{personalInfo.location}</span>}
            {(personalInfo.location && personalInfo.phone) && <span>|</span>}
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {(personalInfo.phone && personalInfo.email) && <span>|</span>}
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {(personalInfo.email && personalInfo.linkedin) && <span>|</span>}
            {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
          </div>
        </header>

        <section className="mb-6 text-sm">
          <p>{today}</p>
        </section>

        <div className="flex-1 text-sm  leading-relaxed whitespace-pre-line">
          {coverLetter}
        </div>
      </div>
    );
  };

  const renderMinimal = () => (
    <div className="w-[794px] h-[1122.52px] bg-[#ffffff] shadow-2xl p-12 mx-auto flex flex-col text-left" style={{ pageBreakAfter: 'always' }}>
      <header className="text-center mb-10 pb-8 border-b border-[#e5e7eb]">
        <h1 className="text-5xl font-extrabold mb-2">{personalInfo.fullName || 'Seu Nome'}</h1>
        <p className="text-lg text-[#6b7280] uppercase tracking-[0.2em]">{personalInfo.jobTitle || targetJobLabel}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-[#4b5563]">
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.email && <span>• {personalInfo.email}</span>}
          {personalInfo.location && <span>• {personalInfo.location}</span>}
          {personalInfo.linkedin && <span>• {personalInfo.linkedin}</span>}
        </div>
      </header>
      <div className="flex-1">
         <h2 className="text-xs font-bold text-[#9ca3af] uppercase mb-6">Carta de Apresentação</h2>
         <div className="prose prose-sm max-w-none text-[#334155] whitespace-pre-line " style={{ lineHeight: '1.8' }}>
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
