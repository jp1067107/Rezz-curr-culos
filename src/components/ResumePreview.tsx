import React, { forwardRef } from 'react';
import { ResumeData, TemplateType } from '../types';
import { Mail, Phone, MapPin, User, Briefcase, GraduationCap, Award, BookOpen, Layers } from 'lucide-react';

interface ResumePreviewProps {
  data: ResumeData;
  template: TemplateType;
}

const HighlightText = ({ text, keywords, showHighlights }: { text: string, keywords?: string[], showHighlights?: boolean }) => {
  if (!text) return null;
  if (!showHighlights || !keywords || keywords.length === 0) {
    return <>{text}</>;
  }

  const escapedKeywords = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  escapedKeywords.sort((a, b) => b.length - a.length);
  
  const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = keywords.some(k => k.toLowerCase() === part.toLowerCase());
        return isMatch ? (
          <span key={i} className="font-bold text-blue-700 bg-blue-100/60 px-1 rounded-sm print:text-blue-800 print:bg-blue-100/60">
            {part}
          </span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        );
      })}
    </>
  );
};

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(({ data, template }, ref) => {
  const { personalInfo, experience, education, skills } = data;

  const hasPhoto = !!personalInfo.photoUrl;
  const shouldRenderPhotoArea = hasPhoto;

  const renderPhoto = (className: string, innerClassName: string = "w-full h-full object-cover") => {
    if (!shouldRenderPhotoArea) return null;
    
    return (
      <div className={`${className} bg-slate-100 flex items-center justify-center overflow-hidden`}>
        {hasPhoto ? (
          <img 
            src={personalInfo.photoUrl!} 
            alt="Profile" 
            className={innerClassName}
            crossOrigin="anonymous"
            style={{ 
              display: 'block',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'cover'
            }} 
          />
        ) : null}
      </div>
    );
  };

  const renderModern = () => (
    <div className="font-sans text-[#1f2937] bg-white w-[794px] min-h-[1123px] shadow-lg rounded-sm mx-auto overflow-hidden flex print:shadow-none print:rounded-none print:h-[1123px] print:overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 bg-[#1e293b] text-white p-8 flex flex-col">
        {renderPhoto("w-32 h-32 rounded-full overflow-hidden border-4 border-[#475569] mx-auto mb-6")}
        
        <div className="mb-8 space-y-3">
          <h2 className="text-sm font-bold text-[#94a3b8] uppercase mb-4">Contato</h2>
          {personalInfo.email && (
            <div className="flex items-start gap-2 text-sm">
              <Mail className="w-4 h-4 text-[#94a3b8] shrink-0 mt-0.5" />
              <span className="break-all">{personalInfo.email}</span>
            </div>
          )}
          {personalInfo.phone && (
            <div className="flex items-start gap-2 text-sm">
              <Phone className="w-4 h-4 text-[#94a3b8] shrink-0 mt-0.5" />
              <span>{personalInfo.phone}</span>
            </div>
          )}
          {personalInfo.location && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-[#94a3b8] shrink-0 mt-0.5" />
              <span>{personalInfo.location}</span>
            </div>
          )}
        </div>

        {skills.length > 0 && (
          <div className="mb-8 page-break-avoid w-full">
            <h2 className="text-sm font-bold text-[#94a3b8] uppercase mb-4">Habilidades</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span key={index} className="px-2 py-1 bg-[#334155] rounded text-xs">
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {(data.courses || []).length > 0 && (
          <div className="mb-8 page-break-avoid w-full">
            <h2 className="text-sm font-bold text-[#94a3b8] uppercase mb-4">Cursos</h2>
            <div className="space-y-4">
              {data.courses!.map((course, index) => (
                <div key={index}>
                  <div className="text-sm font-bold text-white mb-0.5">{course.name}</div>
                  <div className="text-xs text-[#94a3b8]">{course.institution}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="w-2/3 p-8">
        <div className="mb-8 border-b-2 border-[#e2e8f0] pb-6">
          <h1 className="text-4xl font-bold text-[#0f172a] mb-2">{personalInfo.fullName || 'Seu Nome'}</h1>
          <p className="text-xl text-[#2563eb] font-medium">{personalInfo.jobTitle || 'Seu Cargo'}</p>
        </div>

        {personalInfo.summary && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#1e293b] mb-3 flex items-center gap-2">
              <span className="w-8 h-px bg-[#2563eb] inline-block"></span> Perfil
            </h2>
            <p className="text-sm text-[#4b5563] leading-relaxed whitespace-pre-line"><HighlightText text={personalInfo.summary} keywords={data.keywords} showHighlights={data.showHighlights} /></p>
          </div>
        )}

        {experience.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#1e293b] mb-4 flex items-center gap-2">
              <span className="w-8 h-px bg-[#2563eb] inline-block"></span> Experiência Profissional
            </h2>
            <div className="space-y-5">
              {experience.map((exp, index) => (
                <div key={index} className="page-break-avoid">
                  <div className="flex justify-between items-start mb-1 gap-4">
                    <h3 className="font-bold text-[#1e293b] break-words">{exp.position}</h3>
                    <span className="text-xs font-semibold text-[#2563eb] whitespace-nowrap shrink-0 mt-1">
                      {exp.startDate} {exp.startDate && exp.endDate ? '-' : ''} {exp.endDate}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-[#64748b] mb-2">{exp.company}</div>
                  <p className="text-sm text-[#4b5563] leading-relaxed whitespace-pre-line">
                    <HighlightText text={exp.description} keywords={data.keywords} showHighlights={data.showHighlights} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {education.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-[#1e293b] mb-4 flex items-center gap-2">
               <span className="w-8 h-px bg-[#2563eb] inline-block"></span> Formação Acadêmica
            </h2>
            <div className="space-y-4">
              {education.map((edu, index) => (
                <div key={index} className="page-break-avoid w-full">
                  <div className="flex justify-between items-start mb-1 gap-4">
                    <h3 className="font-bold text-[#1e293b] break-words">{edu.degree}</h3>
                    <span className="text-xs font-semibold text-[#2563eb] whitespace-nowrap shrink-0 mt-1">
                      {edu.startDate} {edu.startDate && edu.endDate ? '-' : ''} {edu.endDate}
                    </span>
                  </div>
                  <div className="text-sm text-[#475569]">{edu.institution}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(data.customSections || []).map((section) => (
          <div key={section.id} className="mb-8">
            <h2 className="text-xl font-bold text-[#1e293b] mb-4 flex items-center gap-2">
               <span className="w-8 h-px bg-[#2563eb] inline-block"></span> {section.name}
            </h2>
            <div className="space-y-4">
              {section.items.map((item) => (
                <div key={item.id} className="page-break-avoid w-full">
                  <div className="flex justify-between items-start mb-1 gap-4">
                    <h3 className="font-bold text-[#1e293b] break-words">{item.title} {item.subtitle && <span className="font-normal text-[#64748b]">| {item.subtitle}</span>}</h3>
                    {item.date && (
                      <span className="text-xs font-semibold text-[#2563eb] whitespace-nowrap shrink-0 mt-1">{item.date}</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-[#4b5563] leading-relaxed whitespace-pre-line mt-1">{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderClassic = () => (
    <div className="font-serif text-[#111827] bg-white w-[794px] min-h-[1123px] shadow-lg rounded-sm mx-auto p-12 print:shadow-none print:rounded-none print:h-[1123px] print:overflow-hidden">
      <div className="flex flex-col items-center text-center border-b-2 border-[#111827] pb-6 mb-8 relative">
        {renderPhoto("w-24 h-24 rounded-full overflow-hidden border border-[#d1d5db] mb-4")}
        <h1 className="text-4xl font-bold uppercase mb-2 w-full">{personalInfo.fullName || 'Seu Nome'}</h1>
        <p className="text-lg italic text-[#374151] mb-3 w-full">{personalInfo.jobTitle || 'Seu Cargo'}</p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[#4b5563] w-full">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
        </div>
      </div>

      {personalInfo.summary && (
        <div className="mb-8">
          <p className="text-sm leading-relaxed whitespace-pre-line"><HighlightText text={personalInfo.summary} keywords={data.keywords} showHighlights={data.showHighlights} /></p>
        </div>
      )}

      {experience.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold uppercase border-b border-[#d1d5db] mb-4 pb-1">Experiência Profissional</h2>
          <div className="space-y-6">
            {experience.map((exp, index) => (
              <div key={index} className="page-break-avoid w-full">
                <div className="flex justify-between items-start mb-1 gap-4">
                  <h3 className="font-bold text-lg break-words">{exp.company}</h3>
                  <span className="text-sm italic text-[#4b5563] whitespace-nowrap shrink-0 mt-1">
                    {exp.startDate} {exp.startDate && exp.endDate ? '—' : ''} {exp.endDate}
                  </span>
                </div>
                <div className="font-medium italic mb-2">{exp.position}</div>
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  <HighlightText text={exp.description} keywords={data.keywords} showHighlights={data.showHighlights} />
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {education.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold uppercase border-b border-[#d1d5db] mb-4 pb-1">Formação Acadêmica</h2>
          <div className="space-y-4">
            {education.map((edu, index) => (
              <div key={index} className="page-break-avoid w-full">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-bold break-words">{edu.institution}</h3>
                  <span className="text-sm italic text-[#4b5563] whitespace-nowrap shrink-0 mt-1">
                    {edu.startDate} {edu.startDate && edu.endDate ? '—' : ''} {edu.endDate}
                  </span>
                </div>
                <div className="text-sm">{edu.degree}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {skills.length > 0 && (
        <div className="page-break-avoid w-full mb-8">
          <h2 className="text-xl font-bold uppercase border-b border-[#d1d5db] mb-4 pb-1">Habilidades</h2>
          <p className="text-sm leading-relaxed">
            {skills.map(s => s.name).join(' • ')}
          </p>
        </div>
      )}

      {(data.courses || []).length > 0 && (
        <div className="mb-8 page-break-avoid w-full">
          <h2 className="text-xl font-bold uppercase border-b border-[#d1d5db] mb-4 pb-1">Cursos Complementares</h2>
          <div className="space-y-4">
            {data.courses!.map((course, index) => (
              <div key={index} className="w-full">
                <div className="font-bold text-lg mb-1">{course.name}</div>
                <div className="text-sm italic text-[#4b5563]">{course.institution}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(data.customSections || []).map((section) => (
        <div key={section.id} className="mb-8 page-break-avoid w-full">
          <h2 className="text-xl font-bold uppercase border-b border-[#d1d5db] mb-4 pb-1">{section.name}</h2>
          <div className="space-y-4">
            {section.items.map((item) => (
              <div key={item.id} className="w-full">
                <div className="flex justify-between items-start mb-1 gap-4">
                  <h3 className="font-bold text-lg break-words">{item.title} {item.subtitle && <span className="font-medium italic text-[#4b5563] text-base">| {item.subtitle}</span>}</h3>
                  {item.date && (
                    <span className="text-sm italic text-[#4b5563] whitespace-nowrap shrink-0 mt-1">{item.date}</span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm leading-relaxed whitespace-pre-line mt-1">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderMinimal = () => (
    <div className="font-display text-[#1f2937] bg-white w-[794px] min-h-[1123px] shadow-lg rounded-sm mx-auto p-12 flex flex-col print:shadow-none print:rounded-none print:h-[1123px] print:overflow-hidden">
      <div className="flex items-start justify-between mb-12">
        <div className="max-w-md">
          <h1 className="text-5xl font-extrabold mb-2">{personalInfo.fullName || 'Seu Nome'}</h1>
          <p className="text-xl text-[#6b7280] font-medium">{personalInfo.jobTitle || 'Seu Cargo'}</p>
        </div>
        <div className="text-right text-sm text-[#4b5563] space-y-1">
          {personalInfo.email && <div className="font-medium">{personalInfo.email}</div>}
          {personalInfo.phone && <div>{personalInfo.phone}</div>}
          {personalInfo.location && <div className="text-[#9ca3af]">{personalInfo.location}</div>}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1">
        <div className="col-span-4 space-y-8">
          {renderPhoto("w-32 h-32 rounded-2xl overflow-hidden bg-[#f3f4f6]", "w-full h-full object-cover grayscale")}

          {personalInfo.summary && (
            <div>
              <h2 className="text-xs font-bold text-[#9ca3af] uppercase mb-3">Sobre</h2>
              <p className="text-sm leading-relaxed"><HighlightText text={personalInfo.summary} keywords={data.keywords} showHighlights={data.showHighlights} /></p>
            </div>
          )}

          {skills.length > 0 && (
            <div className="page-break-avoid w-full">
              <h2 className="text-xs font-bold text-[#9ca3af] uppercase mb-3">Especialidades</h2>
              <ul className="space-y-1">
                {skills.map((skill, index) => (
                  <li key={index} className="text-sm font-medium">{skill.name}</li>
                ))}
              </ul>
            </div>
          )}
          
          {education.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs font-bold text-[#9ca3af] uppercase mb-3">Formação</h2>
              <div className="space-y-3">
                {education.map((edu, index) => (
                  <div key={index} className="page-break-avoid w-full">
                    <div className="text-sm font-bold">{edu.degree}</div>
                    <div className="text-xs text-[#6b7280] mb-1">{edu.institution}</div>
                    <div className="text-xs text-[#9ca3af]">
                      {edu.startDate} {edu.startDate && edu.endDate ? '—' : ''} {edu.endDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(data.courses || []).length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-[#9ca3af] uppercase mb-3">Cursos</h2>
              <div className="space-y-3">
                {data.courses!.map((course, index) => (
                  <div key={index} className="page-break-avoid w-full">
                    <div className="text-sm font-bold">{course.name}</div>
                    <div className="text-xs text-[#6b7280]">{course.institution}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-8 space-y-10">
          {experience.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-[#9ca3af] uppercase mb-6">Experiência</h2>
              <div className="space-y-8">
                {experience.map((exp, index) => (
                  <div key={index} className="relative pl-6 border-l border-[#e5e7eb] page-break-avoid w-full">
                    <div className="absolute w-2 h-2 bg-[#111827] rounded-full -left-[4.5px] top-1.5 ring-4 ring-white"></div>
                    <div className="text-xs text-[#9ca3af] font-medium mb-1">
                       {exp.startDate} {exp.startDate && exp.endDate ? '—' : ''} {exp.endDate}
                    </div>
                    <h3 className="text-lg font-bold text-[#111827]">{exp.position}</h3>
                    <div className="text-sm font-medium text-[#6b7280] mb-3">{exp.company}</div>
                    <p className="text-sm text-[#4b5563] leading-relaxed whitespace-pre-line">
                      <HighlightText text={exp.description} keywords={data.keywords} showHighlights={data.showHighlights} />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(data.customSections || []).map((section) => (
            <div key={section.id} className="pt-4">
              <h2 className="text-xs font-bold text-[#9ca3af] uppercase mb-6">{section.name}</h2>
              <div className="space-y-8">
                {section.items.map((item) => (
                  <div key={item.id} className="relative pl-6 border-l border-[#e5e7eb] page-break-avoid w-full">
                    <div className="absolute w-2 h-2 bg-[#111827] rounded-full -left-[4.5px] top-1.5 ring-4 ring-white"></div>
                    {item.date && (
                      <div className="text-xs text-[#9ca3af] font-medium mb-1">{item.date}</div>
                    )}
                    <h3 className="text-lg font-bold text-[#111827]">
                      {item.title} {item.subtitle && <span className="font-normal text-[#6b7280]">| {item.subtitle}</span>}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-[#4b5563] leading-relaxed whitespace-pre-line mt-2">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCreative = () => (
    <div className="font-sans text-[#1f2937] bg-white w-[794px] min-h-[1123px] shadow-lg rounded-sm mx-auto overflow-hidden flex print:shadow-none print:rounded-none print:h-[1123px] print:overflow-hidden relative">
      <div className="w-[35%] bg-[#374151] text-white pt-8 pb-6 px-6 flex flex-col relative z-20 overflow-hidden">
        {/* Geometric elements on left sidebar */}
        <div className="absolute top-0 left-[-20%] w-[140%] h-64 bg-[#fbbf24] z-0 opacity-10" style={{ transform: 'rotate(-10deg) translateY(-20px)' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-white opacity-[0.03]" style={{ transform: 'rotate(45deg)' }}></div>
        
        <div className="relative z-10 flex flex-col pt-2">
          {renderPhoto("w-32 h-32 rounded-full overflow-hidden border-[3px] border-[#fbbf24] mx-auto mb-6")}
        </div>
        
        <div className="mb-6 space-y-3 relative z-10 w-full">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-3 border-b-2 border-slate-500 pb-1">Contato</h2>
          <div className="space-y-2.5">
            {personalInfo.phone && (
              <div className="flex items-start gap-3 text-xs">
                <Phone className="w-3.5 h-3.5 text-[#fbbf24] shrink-0 mt-0.5" />
                <span>{personalInfo.phone}</span>
              </div>
            )}
            {personalInfo.email && (
              <div className="flex items-start gap-3 text-xs">
                <Mail className="w-3.5 h-3.5 text-[#fbbf24] shrink-0 mt-0.5" />
                <span className="break-all">{personalInfo.email}</span>
              </div>
            )}
            {personalInfo.location && (
              <div className="flex items-start gap-3 text-xs">
                <MapPin className="w-3.5 h-3.5 text-[#fbbf24] shrink-0 mt-0.5" />
                <span>{personalInfo.location}</span>
              </div>
            )}
          </div>
        </div>

        {education.length > 0 && (
          <div className="mb-6 space-y-3 page-break-avoid w-full relative z-10">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-3 border-b-2 border-slate-500 pb-1">Educação</h2>
            <div className="space-y-3">
              {education.map((edu, index) => (
                <div key={index} className="flex relative">
                  <div className="absolute left-[3px] top-2 bottom-0 w-px bg-slate-500/50"></div>
                  <div className="w-2 h-2 rounded-full bg-[#fbbf24] absolute left-[0px] top-1.5 ring-2 ring-[#374151]"></div>
                  <div className="pl-4">
                    <div className="font-bold text-white text-sm mb-0.5 leading-tight">{edu.degree}</div>
                    <div className="text-xs text-slate-300">{edu.institution}</div>
                    <div className="text-[11px] text-[#fbbf24] font-medium mt-0.5">
                      {edu.startDate} {edu.startDate && edu.endDate ? '-' : ''} {edu.endDate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {skills.length > 0 && (
          <div className="mb-6 space-y-3 page-break-avoid w-full relative z-10">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-3 border-b-2 border-slate-500 pb-1">Habilidades e<br/>Competências</h2>
            <ul className="space-y-1.5">
              {skills.map((skill, index) => (
                <li key={index} className="flex items-start gap-2.5 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] shrink-0 mt-1"></div>
                  <span>{skill.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.courses && data.courses.length > 0 && (
          <div className="mb-6 space-y-3 page-break-avoid w-full relative z-10">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-3 border-b-2 border-slate-500 pb-1">Cursos</h2>
            <ul className="space-y-3">
              {data.courses.map((course, index) => (
                <li key={index} className="flex items-start gap-2.5 text-xs">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] shrink-0 mt-1"></div>
                   <div>
                     <div className="font-bold">{course.name}</div>
                     <div className="text-slate-300 text-[11px]">{course.institution}</div>
                   </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {data.customSections && data.customSections.map(section => (
          <div key={section.id} className="mb-6 space-y-3 page-break-avoid w-full relative z-10">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-3 border-b-2 border-slate-500 pb-1">{section.name}</h2>
            <div className="space-y-3">
              {section.items.map((item, index) => (
                <div key={index} className="flex items-start gap-2.5 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] shrink-0 mt-1"></div>
                  <div>
                    <div className="font-bold">{item.title} {item.subtitle && <span className="font-normal text-slate-300">| {item.subtitle}</span>}</div>
                    {item.date && <div className="text-[11px] text-[#fbbf24]">{item.date}</div>}
                    {item.description && <div className="text-[11px] text-slate-300 mt-0.5">{item.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="w-[65%] pl-8 pr-12 pt-12 pb-8 relative flex flex-col">
        {/* Geometric shapes pattern on the top right */}
        <div className="absolute top-0 right-0 z-0 overflow-hidden pointer-events-none">
           <svg width="200" height="200" viewBox="0 0 250 250" xmlns="http://www.w3.org/2000/svg">
              <polygon points="100,0 250,0 250,150" fill="#374151" />
              <polygon points="135,0 250,0 250,115" fill="#fbbf24" />
              {/* Dots */}
              {Array.from({ length: 4 }).map((_, r) => 
                Array.from({ length: 4 }).map((_, c) => (
                  <circle key={`${r}-${c}`} cx={35 + c*12} cy={20 + r*12} r="2" fill="#374151" />
                ))
              )}
              {Array.from({ length: 4 }).map((_, r) => 
                Array.from({ length: 4 }).map((_, c) => (
                  <circle key={`w-${r}-${c}`} cx={170 + c*12} cy={140 + r*12} r="2" fill="#e5e7eb" />
                ))
              )}
           </svg>
        </div>

        <div className="relative z-10 mb-8 flex flex-col pr-8">
          <h1 className="text-[2.75rem] font-black text-[#374151] uppercase leading-none tracking-tight">
            {personalInfo.fullName ? personalInfo.fullName.split(' ').map((name, i) => (
              <div key={i}>{name}</div>
            )) : <><div className="text-slate-300">NOME</div><div className="text-slate-300">COMPLETO</div></>}
          </h1>
          {personalInfo.jobTitle && <p className="text-xl font-bold text-[#374151] uppercase mt-3 tracking-widest">{personalInfo.jobTitle}</p>}
        </div>
        
        <div className="relative z-10 space-y-6 flex-1">
          {personalInfo.summary && (
            <div className="relative flex min-h-[50px]">
               <div className="flex flex-col items-center shrink-0 w-10 z-10 pt-0.5">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border-2 border-[#fbbf24] shadow-sm z-10">
                    <User className="w-4 h-4 text-[#fbbf24]" strokeWidth={2.5} />
                  </div>
                  <div className="w-px bg-[#fbbf24] flex-1 mt-1 -mb-6"></div>
               </div>
               <div className="pl-3 pt-1 pb-4 flex-1">
                 <h2 className="text-xl font-black text-[#374151] uppercase mb-2 tracking-wider flex items-center">
                   Resumo Profissional
                 </h2>
                 <p className="text-[13px] font-medium text-gray-700 leading-relaxed whitespace-pre-line text-justify pr-2">
                   <HighlightText text={personalInfo.summary} keywords={data.keywords} showHighlights={data.showHighlights} />
                 </p>
               </div>
            </div>
          )}
          
          {experience.length > 0 && (
            <div className="relative flex min-h-[50px]">
               <div className="flex flex-col items-center shrink-0 w-10 z-10 pt-0.5">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border-2 border-[#fbbf24] shadow-sm z-10">
                     <Briefcase className="w-4 h-4 text-[#fbbf24]" strokeWidth={2.5} />
                  </div>
                  <div className="w-px bg-[#fbbf24] flex-1 mt-1 -mb-6"></div>
               </div>
               <div className="pl-3 pt-1 pb-4 flex-1">
                 <h2 className="text-xl font-black text-[#374151] uppercase mb-4 tracking-wider">
                   Experiência Profissional
                 </h2>
                 <div className="space-y-6">
                   {experience.map((exp, idx) => (
                     <div key={idx} className="relative page-break-avoid">
                        <div className="absolute left-[-1.6rem] top-[6px] w-[7px] h-[7px] rounded-full border border-[#fbbf24] bg-white ring-4 ring-white z-20"></div>
                        
                        <div className="font-bold text-[#374151] text-[14px] leading-snug">
                           {exp.company} {exp.location && <span className="font-normal text-gray-500">- {exp.location}</span>}
                        </div>
                        <div className="text-[12px] font-bold text-gray-700 mt-0.5 mb-0.5 inline-flex bg-slate-100 px-2 py-0.5 rounded-sm">
                           Cargo: {exp.position}
                        </div>
                        <div className="text-[11px] font-bold text-[#fbbf24] mb-2">
                           {exp.startDate} {exp.startDate && exp.endDate ? '-' : ''} {exp.endDate}
                        </div>
                        <div className="text-[13px] font-medium text-gray-700 leading-relaxed whitespace-pre-line pr-2 text-justify">
                           <HighlightText text={exp.description} keywords={data.keywords} showHighlights={data.showHighlights} />
                        </div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          )}
          
          {/* Fim da linha amarela se houver itens acima, para fechar bonitinho */}
          {(personalInfo.summary || experience.length > 0) && (
            <div className="absolute bottom-0 left-0 flex flex-col items-center shrink-0 w-10 h-10 z-0">
               <div className="w-px bg-gradient-to-b from-[#fbbf24] to-transparent h-full"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div ref={ref} className="origin-top print:shadow-none print:m-0 print:p-0">
      {template === 'modern' && renderModern()}
      {template === 'classic' && renderClassic()}
      {template === 'minimal' && renderMinimal()}
      {template === 'creative' && renderCreative()}
    </div>
  );
});
