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
          <span key={i} className="font-bold text-[#1d4ed8] bg-[#dbeafe]/60 px-1 rounded-sm print:text-[#1e40af] print:bg-[#dbeafe]/60">
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

  const getDensity = () => {
    let textCount = 0;
    if (personalInfo.summary) textCount += personalInfo.summary.length;
    experience.forEach(exp => {
      if (exp.description) textCount += exp.description.length;
      if (exp.company) textCount += exp.company.length;
      if (exp.position) textCount += exp.position.length;
    });
    education.forEach(edu => {
      if (edu.institution) textCount += edu.institution.length;
      if (edu.degree) textCount += edu.degree.length;
    });
    skills.forEach(skill => {
      if (skill.name) textCount += skill.name.length;
    });
    if (data.courses) {
      data.courses.forEach(course => {
        if (course.name) textCount += course.name.length;
        if (course.institution) textCount += course.institution.length;
      });
    }
    if (data.customSections) {
      data.customSections.forEach(section => {
        section.items.forEach(item => {
          if (item.description) textCount += item.description.length;
          if (item.title) textCount += item.title.length;
        });
      });
    }
    return textCount;
  };

  const count = getDensity();
  const isDense = count > 2000;
  const isNormal = count > 1200 && count <= 2000;
  
  const t = {
    name: isDense ? 'text-[1.75rem]' : isNormal ? 'text-3xl' : 'text-4xl',
    job: isDense ? 'text-base' : isNormal ? 'text-lg' : 'text-xl',
    h2: isDense ? 'text-[11px]' : isNormal ? 'text-xs' : 'text-sm',
    h3: isDense ? 'text-[13px]' : isNormal ? 'text-sm' : 'text-base',
    body: isDense ? 'text-[11.5px]' : isNormal ? 'text-[13px]' : 'text-sm',
    small: isDense ? 'text-[10px]' : 'text-[11px]',
    space: isDense ? 'space-y-3' : isNormal ? 'space-y-4' : 'space-y-5',
    mb: isDense ? 'mb-4' : isNormal ? 'mb-5' : 'mb-8',
    p: isDense ? 'p-6' : 'p-8',
    sidebarSmall: isDense ? 'text-[10px]' : isNormal ? 'text-[11px]' : 'text-xs'
  };

  const renderPhoto = (className: string, innerClassName: string = "w-full h-full object-cover") => {
    if (!shouldRenderPhotoArea) return null;
    
    return (
      <div className={`${className} bg-[#f1f5f9] flex items-center justify-center overflow-hidden`}>
        {hasPhoto ? (
          <img 
            src={personalInfo.photoUrl!} 
            alt="Profile" 
            className={innerClassName}
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
    <div className="relative font-sans text-[#1f2937] bg-[#ffffff] w-[794px] min-h-[1122px] shadow-lg rounded-sm mx-auto flex print:max-w-full print:w-[100%] print:shadow-none print:rounded-none print:overflow-visible print:bg-[transparent]">
      <div className="absolute left-0 top-0 bottom-0 w-[30%] bg-[#1e293b] z-0 print:block"></div>
      {/* Sidebar */}
      <div className={`relative z-10 w-[30%] text-[#ffffff] ${t.p} flex flex-col`}>
        {renderPhoto(isDense ? "w-24 h-24 rounded-full overflow-hidden border-4 border-[#475569] mx-auto mb-5" : "w-32 h-32 rounded-full overflow-hidden border-4 border-[#475569] mx-auto mb-6")}
        
        <div className={`${t.mb} ${t.space}`}>
          <h2 className={`${t.h2} font-bold text-[#94a3b8] uppercase ${isDense ? 'mb-2' : 'mb-4'} border-b border-[#334155] pb-1`}>Contato</h2>
          {personalInfo.email && (
            <div className={`flex items-start gap-2 ${t.sidebarSmall}`}>
              <Mail className={`${isDense ? 'w-3 h-3' : 'w-4 h-4'} text-[#94a3b8] shrink-0 mt-0.5`} />
              <span className="break-all">{personalInfo.email}</span>
            </div>
          )}
          {personalInfo.phone && (
            <div className={`flex items-start gap-2 ${t.sidebarSmall}`}>
              <Phone className={`${isDense ? 'w-3 h-3' : 'w-4 h-4'} text-[#94a3b8] shrink-0 mt-0.5`} />
              <span>{personalInfo.phone}</span>
            </div>
          )}
          {personalInfo.location && (
            <div className={`flex items-start gap-2 ${t.sidebarSmall}`}>
              <MapPin className={`${isDense ? 'w-3 h-3' : 'w-4 h-4'} text-[#94a3b8] shrink-0 mt-0.5`} />
              <span>{personalInfo.location}</span>
            </div>
          )}
        </div>

        {skills.length > 0 && (
          <div className={`${t.mb} w-full`}>
            <h2 className={`${t.h2} font-bold text-[#94a3b8] uppercase ${isDense ? 'mb-2' : 'mb-4'} border-b border-[#334155] pb-1 page-break-avoid`}>Habilidades</h2>
            <div className="flex flex-col gap-1.5 w-full">
              {skills.map((skill, index) => (
                <span key={index} className={`w-full block text-left px-2 py-1.5 bg-[#334155] rounded-sm ${isDense ? 'text-[9.5px]' : 'text-[11px]'} font-medium break-words leading-tight page-break-avoid`}>
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {(data.courses || []).length > 0 && (
          <div className={`${t.mb} w-full`}>
            <h2 className={`${t.h2} font-bold text-[#94a3b8] uppercase ${isDense ? 'mb-2' : 'mb-4'} border-b border-[#334155] pb-1 page-break-avoid`}>Cursos</h2>
            <div className={t.space}>
              {data.courses!.map((course, index) => (
                <div key={index} className="page-break-avoid overflow-hidden">
                  <div className={`${t.sidebarSmall} font-bold text-[#ffffff] mb-0.5`}>{course.name}</div>
                  <div className={`text-[10px] ${!isDense && 'text-xs'} text-[#94a3b8]`}>{course.institution}{course.date ? ` | ${course.date}` : ''}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`relative z-10 w-[70%] ${t.p} pr-8 pt-8`}>
        <div className={`${isDense ? 'mb-4 pb-3' : 'mb-8 pb-6'} border-b-2 border-[#e2e8f0]`}>
          <h1 className={`${t.name} font-extrabold text-[#0f172a] mb-1.5 tracking-tight`}>{personalInfo.fullName || 'Seu Nome'}</h1>
          <p className={`${t.job} text-[#2563eb] font-semibold`}>{personalInfo.jobTitle || 'Seu Cargo'}</p>
        </div>

        {personalInfo.summary && (
          <div className={t.mb}>
            <h2 className={`${t.h2} font-bold text-[#1e293b] mb-2 flex items-center gap-2 uppercase tracking-wide`}>
              <span className={`w-6 h-[2px] bg-[#2563eb] inline-block`}></span> Perfil
            </h2>
            <p className={`${t.body} text-[#4b5563] leading-relaxed whitespace-pre-line  pl-8`}><HighlightText text={personalInfo.summary} keywords={data.keywords} showHighlights={data.showHighlights} /></p>
          </div>
        )}

        {experience.length > 0 && (
          <div className={t.mb}>
            <h2 className={`${t.h2} font-bold text-[#1e293b] mb-3 flex items-center gap-2 uppercase tracking-wide`}>
              <span className={`w-6 h-[2px] bg-[#2563eb] inline-block`}></span> Experiência Profissional
            </h2>
            <div className={`${t.space} pl-8`}>
              {experience.map((exp, index) => (
                <div key={index} className="page-break-avoid">
                  <div className="flex justify-between items-start mb-0.5 gap-3">
                    <h3 className={`font-bold text-[#1e293b] ${t.h3} break-words leading-tight`}>{exp.position}</h3>
                    <span className={`${t.small} font-bold text-[#2563eb] whitespace-nowrap shrink-0 mt-0.5`}>
                      {exp.startDate} {exp.startDate && exp.endDate ? '-' : ''} {exp.endDate}
                    </span>
                  </div>
                  <div className={`${t.body} font-semibold text-[#64748b] mb-1.5`}>{exp.company}{exp.location && <span className="font-normal text-[#6b7280] whitespace-nowrap">&nbsp;- {exp.location}</span>}</div>
                  <p className={`${t.body} text-[#4b5563] leading-relaxed whitespace-pre-line `}>
                    <HighlightText text={exp.description} keywords={data.keywords} showHighlights={data.showHighlights} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {education.length > 0 && (
          <div className={t.mb}>
            <h2 className={`${t.h2} font-bold text-[#1e293b] mb-3 flex items-center gap-2 uppercase tracking-wide`}>
               <span className={`w-6 h-[2px] bg-[#2563eb] inline-block`}></span> Formação Acadêmica
            </h2>
            <div className={`${t.space} pl-8`}>
              {education.map((edu, index) => (
                <div key={index} className="page-break-avoid w-full">
                  <div className="flex justify-between items-start mb-0.5 gap-3">
                    <h3 className={`font-bold text-[#1e293b] ${t.h3} break-words leading-tight`}>{edu.degree}</h3>
                    <span className={`${t.small} font-bold text-[#2563eb] whitespace-nowrap shrink-0 mt-0.5`}>
                      {edu.startDate} {edu.startDate && edu.endDate ? '-' : ''} {edu.endDate}
                    </span>
                  </div>
                  <div className={`${t.body} text-[#475569]`}>{edu.institution}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(data.customSections || []).map((section) => (
          <div key={section.id} className={t.mb}>
            <h2 className={`${t.h2} font-bold text-[#1e293b] mb-3 flex items-center gap-2 uppercase tracking-wide`}>
               <span className={`w-6 h-[2px] bg-[#2563eb] inline-block`}></span> {section.name}
            </h2>
            <div className={`${t.space} pl-8`}>
              {section.items.map((item) => (
                <div key={item.id} className="page-break-avoid w-full">
                  <div className="flex justify-between items-start mb-0.5 gap-3">
                    <h3 className={`font-bold text-[#1e293b] ${t.h3} break-words leading-tight`}>{item.title} {item.subtitle && <span className="font-normal text-[#64748b]">| {item.subtitle}</span>}</h3>
                    {item.date && (
                      <span className={`${t.small} font-bold text-[#2563eb] whitespace-nowrap shrink-0 mt-0.5`}>{item.date}</span>
                    )}
                  </div>
                  {item.description && (
                    <p className={`${t.body} text-[#4b5563] leading-relaxed whitespace-pre-line mt-1 `}>{item.description}</p>
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
    <div className={`font-sans text-[black] bg-[#ffffff] w-[794px] min-h-[1122px] shadow-lg rounded-sm mx-auto ${t.p} print:max-w-full print:w-[100%] print:shadow-none print:rounded-none print:overflow-visible print:bg-[transparent]`}>
      <div className={`text-center ${isDense ? 'mb-4' : 'mb-6'}`}>
        <h1 className={`${t.name} font-bold uppercase mb-1`}>{personalInfo.fullName || 'Seu Nome'}</h1>
        
        <div className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${t.body} w-full`}>
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {(personalInfo.location && personalInfo.phone) && <span>|</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {(personalInfo.phone && personalInfo.email) && <span>|</span>}
          {personalInfo.email && <span>{personalInfo.email}</span>}
        </div>
      </div>

      {personalInfo.summary && (
        <div className={t.mb}>
          <h2 className={`${isDense ? 'text-sm' : isNormal ? 'text-base' : 'text-lg'} font-bold uppercase border-b border-[black] ${isDense ? 'mb-2' : 'mb-3'} pb-1 page-break-avoid`}>Resumo Profissional</h2>
          <p className={`${t.body} leading-relaxed whitespace-pre-line `}><HighlightText text={personalInfo.summary} keywords={data.keywords} showHighlights={data.showHighlights} /></p>
        </div>
      )}

      {experience.length > 0 && (
        <div className={t.mb}>
          <h2 className={`${isDense ? 'text-sm' : isNormal ? 'text-base' : 'text-lg'} font-bold uppercase border-b border-[black] ${isDense ? 'mb-2' : 'mb-3'} pb-1 page-break-avoid`}>Experiência Profissional</h2>
          <div className={isDense ? 'space-y-3' : 'space-y-4'}>
            {experience.map((exp, index) => (
              <div key={index} className="page-break-avoid w-full">
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className={`font-bold ${isDense ? 'text-[13px]' : isNormal ? 'text-sm' : 'text-base'} leading-tight`}>{exp.position}</h3>
                  <span className={`${t.body} whitespace-nowrap shrink-0 mt-0.5`}>
                    {exp.startDate} {exp.startDate && exp.endDate ? 'a' : ''} {exp.endDate}
                  </span>
                </div>
                <div className={`mb-1.5 ${t.body}`}>
                  <span className="font-semibold">{exp.company}</span>
                  {exp.location && <span className="whitespace-nowrap">, {exp.location}</span>}
                </div>
                <p className={`${t.body} leading-relaxed whitespace-pre-line `}>
                  <HighlightText text={exp.description} keywords={data.keywords} showHighlights={data.showHighlights} />
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {education.length > 0 && (
        <div className={t.mb}>
          <h2 className={`${isDense ? 'text-sm' : isNormal ? 'text-base' : 'text-lg'} font-bold uppercase border-b border-[black] ${isDense ? 'mb-2' : 'mb-3'} pb-1 page-break-avoid`}>Formação Acadêmica</h2>
          <div className={isDense ? 'space-y-2' : 'space-y-3'}>
            {education.map((edu, index) => (
              <div key={index} className="page-break-avoid w-full">
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className={`font-bold ${isDense ? 'text-[13px]' : isNormal ? 'text-sm' : 'text-base'} leading-tight`}>{edu.degree}</h3>
                  <span className={`${t.body} whitespace-nowrap shrink-0 mt-0.5`}>
                    {edu.startDate} {edu.startDate && edu.endDate ? 'a' : ''} {edu.endDate}
                  </span>
                </div>
                <div className={`${t.body}`}>
                  <span className="font-semibold">{edu.institution}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {skills.length > 0 && (
        <div className={`w-full ${t.mb}`}>
          <h2 className={`${isDense ? 'text-sm' : isNormal ? 'text-base' : 'text-lg'} font-bold uppercase border-b border-[black] ${isDense ? 'mb-2' : 'mb-3'} pb-1 page-break-avoid`}>Habilidades e Competências</h2>
          <div className={`${t.body} leading-relaxed flex flex-wrap gap-2`}>
            {skills.map((s, index) => (
               <span key={index} className="page-break-avoid inline-block">{s.name}{index < skills.length - 1 ? ',' : ''}</span>
            ))}
          </div>
        </div>
      )}

      {(data.courses || []).length > 0 && (
        <div className={`${t.mb} w-full`}>
          <h2 className={`${isDense ? 'text-sm' : isNormal ? 'text-base' : 'text-lg'} font-bold uppercase border-b border-[black] ${isDense ? 'mb-2' : 'mb-3'} pb-1 page-break-avoid`}>Cursos Complementares</h2>
          <div className={isDense ? 'space-y-2' : 'space-y-3'}>
            {data.courses!.map((course, index) => (
              <div key={index} className="w-full page-break-avoid overflow-hidden">
                <div className={`font-bold ${isDense ? 'text-[13px]' : isNormal ? 'text-sm' : 'text-base'} mb-0.5`}>{course.name}</div>
                <div className={`${t.body}`}>{course.institution}{course.date ? ` | ${course.date}` : ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(data.customSections || []).map((section) => (
        <div key={section.id} className={`${t.mb} w-full`}>
          <h2 className={`${isDense ? 'text-sm' : isNormal ? 'text-base' : 'text-lg'} font-bold uppercase border-b border-[black] ${isDense ? 'mb-2' : 'mb-3'} pb-1 page-break-avoid`}>{section.name}</h2>
          <div className={isDense ? 'space-y-2' : 'space-y-3'}>
            {section.items.map((item) => (
              <div key={item.id} className="w-full page-break-avoid overflow-hidden">
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className={`font-bold ${isDense ? 'text-[13px]' : isNormal ? 'text-sm' : 'text-base'} leading-tight`}>{item.title} {item.subtitle && <span>- {item.subtitle}</span>}</h3>
                  {item.date && (
                    <span className={`${t.body} whitespace-nowrap shrink-0 mt-0.5`}>{item.date}</span>
                  )}
                </div>
                {item.description && (
                  <p className={`${t.body} leading-relaxed whitespace-pre-line mt-1 `}>{item.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderMinimal = () => (
    <div className={`font-display text-[#1f2937] bg-[#ffffff] w-[794px] min-h-[1122px] shadow-lg rounded-sm mx-auto ${t.p} flex flex-col print:max-w-full print:w-[100%] print:shadow-none print:rounded-none print:overflow-visible print:bg-[transparent]`}>
      <div className={`flex items-start justify-between ${isDense ? 'mb-6' : 'mb-8'}`}>
        <div className="max-w-md">
          <h1 className={`${t.name} font-extrabold mb-1.5 tracking-tight`}>{personalInfo.fullName || 'Seu Nome'}</h1>
          <p className={`${t.job} text-[#6b7280] font-medium`}>{personalInfo.jobTitle || 'Seu Cargo'}</p>
        </div>
        <div className={`text-right ${t.sidebarSmall} text-[#4b5563] space-y-0.5`}>
          {personalInfo.email && <div className="font-medium">{personalInfo.email}</div>}
          {personalInfo.phone && <div>{personalInfo.phone}</div>}
          {personalInfo.location && <div className="text-[#9ca3af]">{personalInfo.location}</div>}
        </div>
      </div>

      <div className={`grid grid-cols-12 ${isDense ? 'gap-5' : 'gap-8'} flex-1`}>
        <div className={`col-span-4 ${isDense ? 'space-y-4' : 'space-y-6'}`}>
          {renderPhoto(isDense ? "w-24 h-24 rounded-2xl overflow-hidden bg-[#f3f4f6]" : "w-32 h-32 rounded-2xl overflow-hidden bg-[#f3f4f6]", "w-full h-full object-cover grayscale")}

          {personalInfo.summary && (
            <div>
              <h2 className={`${t.sidebarSmall} font-bold text-[#9ca3af] uppercase mb-2 tracking-wider page-break-avoid`}>Sobre</h2>
              <p className={`${t.body} leading-relaxed `}><HighlightText text={personalInfo.summary} keywords={data.keywords} showHighlights={data.showHighlights} /></p>
            </div>
          )}

          {skills.length > 0 && (
            <div className="w-full">
              <h2 className={`${t.sidebarSmall} font-bold text-[#9ca3af] uppercase mb-2 tracking-wider page-break-avoid`}>Especialidades</h2>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, index) => (
                  <span key={index} className={`${t.small} font-medium px-1.5 py-0.5 bg-gray-200/50 rounded-sm text-[#374151] page-break-avoid`}>{skill.name}</span>
                ))}
              </div>
            </div>
          )}
          
          {education.length > 0 && (
            <div className={isDense ? 'mb-4' : 'mb-6'}>
              <h2 className={`${t.sidebarSmall} font-bold text-[#9ca3af] uppercase mb-2 tracking-wider page-break-avoid`}>Formação</h2>
              <div className={isDense ? 'space-y-2' : 'space-y-3'}>
                {education.map((edu, index) => (
                  <div key={index} className="page-break-avoid w-full">
                    <div className={`${t.body} font-bold leading-tight`}>{edu.degree}</div>
                    <div className={`${t.small} text-[#6b7280]`}>{edu.institution}</div>
                    <div className={`${t.small} text-[#9ca3af] mt-0.5`}>
                      {edu.startDate} {edu.startDate && edu.endDate ? '—' : ''} {edu.endDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(data.courses || []).length > 0 && (
            <div>
              <h2 className={`${t.sidebarSmall} font-bold text-[#9ca3af] uppercase mb-2 tracking-wider page-break-avoid`}>Cursos</h2>
              <div className={isDense ? 'space-y-2' : 'space-y-3'}>
                {data.courses!.map((course, index) => (
                  <div key={index} className="page-break-avoid w-full">
                    <div className={`${t.body} font-bold leading-tight`}>{course.name}</div>
                    <div className={`${t.small} text-[#6b7280]`}>{course.institution}{course.date ? ` | ${course.date}` : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={`col-span-8 ${isDense ? 'space-y-5' : 'space-y-8'}`}>
          {experience.length > 0 && (
            <div>
              <h2 className={`${t.sidebarSmall} font-bold text-[#9ca3af] uppercase mb-4 tracking-wider page-break-avoid`}>Experiência</h2>
              <div className={isDense ? 'space-y-4' : 'space-y-6'}>
                {experience.map((exp, index) => (
                  <div key={index} className="relative pl-5 border-l border-[#e5e7eb] page-break-avoid w-full">
                    <div className="absolute w-2 h-2 bg-[#111827] rounded-full -left-[4.5px] top-1.5 ring-4 ring-[#ffffff]"></div>
                    <div className={`${t.small} text-[#9ca3af] font-medium mb-0.5`}>
                       {exp.startDate} {exp.startDate && exp.endDate ? '—' : ''} {exp.endDate}
                    </div>
                    <h3 className={`${t.h3} font-bold text-[#111827] leading-tight`}>{exp.position}</h3>
                    <div className={`${t.body} font-medium text-[#6b7280] mb-2`}>{exp.company}{exp.location && <span className="font-normal text-[#6b7280] whitespace-nowrap">&nbsp;- {exp.location}</span>}</div>
                    <p className={`${t.body} text-[#4b5563] leading-relaxed whitespace-pre-line `}>
                      <HighlightText text={exp.description} keywords={data.keywords} showHighlights={data.showHighlights} />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(data.customSections || []).map((section) => (
            <div key={section.id} className="pt-2">
              <h2 className={`${t.sidebarSmall} font-bold text-[#9ca3af] uppercase mb-4 tracking-wider page-break-avoid`}>{section.name}</h2>
              <div className={isDense ? 'space-y-4' : 'space-y-6'}>
                {section.items.map((item) => (
                  <div key={item.id} className="relative pl-5 border-l border-[#e5e7eb] page-break-avoid w-full">
                    <div className="absolute w-2 h-2 bg-[#111827] rounded-full -left-[4.5px] top-1.5 ring-4 ring-[#ffffff]"></div>
                    {item.date && (
                      <div className={`${t.small} text-[#9ca3af] font-medium mb-0.5`}>{item.date}</div>
                    )}
                    <h3 className={`${t.h3} font-bold text-[#111827] leading-tight`}>
                      {item.title} {item.subtitle && <span className="font-normal text-[#6b7280]">| {item.subtitle}</span>}
                    </h3>
                    {item.description && (
                      <p className={`${t.body} text-[#4b5563] leading-relaxed whitespace-pre-line mt-1.5 `}>{item.description}</p>
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
    <div className="relative font-sans text-[#1f2937] bg-[#ffffff] w-[794px] min-h-[1122px] shadow-lg rounded-sm mx-auto flex print:max-w-full print:w-[100%] print:shadow-none print:rounded-none print:overflow-visible print:bg-[transparent]">
      {/* Absolute background covering left sidebar */}
      <div className="absolute left-0 top-0 bottom-0 w-[35%] bg-[#374151] z-0 overflow-hidden print:block">
        <div className="absolute top-0 left-[-20%] w-[140%] h-64 bg-[#fbbf24] z-0 opacity-10 print:hidden" style={{ transform: 'rotate(-10deg) translateY(-20px)' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-[#ffffff] opacity-[0.03] print:hidden" style={{ transform: 'rotate(45deg)' }}></div>
      </div>
      
      <div className={`relative z-10 w-[35%] text-[#ffffff] ${t.p} flex flex-col`}>
        <div className="relative z-10 flex flex-col pt-2">
          {renderPhoto(isDense ? "w-24 h-24 rounded-full overflow-hidden border-[3px] border-[#fbbf24] mx-auto mb-4" : "w-32 h-32 rounded-full overflow-hidden border-[3px] border-[#fbbf24] mx-auto mb-6")}
        </div>
        
        <div className={`mb-5 ${isDense ? 'space-y-1.5' : 'space-y-2'} relative z-10 w-full`}>
          <h2 className={`${t.sidebarSmall} font-bold text-[#ffffff] uppercase tracking-wider mb-2 border-b border-[#64748b] pb-1`}>Contato</h2>
          <div className="space-y-1.5">
            {personalInfo.phone && (
              <div className={`flex items-start gap-2 ${t.sidebarSmall}`}>
                <Phone className={`${isDense ? 'w-3 h-3 mt-0' : 'w-3.5 h-3.5 mt-0.5'} text-[#fbbf24] shrink-0`} />
                <span>{personalInfo.phone}</span>
              </div>
            )}
            {personalInfo.email && (
              <div className={`flex items-start gap-2 ${t.sidebarSmall}`}>
                <Mail className={`${isDense ? 'w-3 h-3 mt-0' : 'w-3.5 h-3.5 mt-0.5'} text-[#fbbf24] shrink-0`} />
                <span className="break-all">{personalInfo.email}</span>
              </div>
            )}
            {personalInfo.location && (
              <div className={`flex items-start gap-2 ${t.sidebarSmall}`}>
                <MapPin className={`${isDense ? 'w-3 h-3 mt-0' : 'w-3.5 h-3.5 mt-0.5'} text-[#fbbf24] shrink-0`} />
                <span>{personalInfo.location}</span>
              </div>
            )}
          </div>
        </div>

        {education.length > 0 && (
          <div className={`mb-5 ${isDense ? 'space-y-1.5' : 'space-y-2'} w-full relative z-10`}>
            <h2 className={`${t.sidebarSmall} font-bold text-[#ffffff] uppercase tracking-wider mb-2 border-b border-[#64748b] pb-1 page-break-avoid`}>Educação</h2>
            <div className={isDense ? 'space-y-2' : 'space-y-3'}>
              {education.map((edu, index) => (
                <div key={index} className="flex relative page-break-avoid">
                  <div className="absolute left-[3px] top-2 bottom-0 w-px bg-[#64748b]/50"></div>
                  <div className="w-2 h-2 rounded-full bg-[#fbbf24] absolute left-[0px] top-1.5 ring-2 ring-[#374151]"></div>
                  <div className="pl-4">
                    <div className={`font-bold text-[#ffffff] ${t.small} mb-0.5 leading-tight`}>{edu.degree}</div>
                    <div className={`${isDense ? 'text-[9.5px]' : 'text-[11px]'} text-[#cbd5e1]`}>{edu.institution}</div>
                    <div className={`${isDense ? 'text-[9px]' : 'text-[10px]'} text-[#fbbf24] font-medium mt-0.5`}>
                      {edu.startDate} {edu.startDate && edu.endDate ? '-' : ''} {edu.endDate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {skills.length > 0 && (
          <div className={`mb-5 ${isDense ? 'space-y-1.5' : 'space-y-2'} w-full relative z-10`}>
            <h2 className={`${t.sidebarSmall} font-bold text-[#ffffff] uppercase tracking-wider mb-2 border-b border-[#64748b] pb-1 page-break-avoid`}>Habilidades e<br/>Competências</h2>
            <div className="flex flex-wrap gap-1.5 w-full">
              {skills.map((skill, index) => (
                <span key={index} className={`px-2 py-1 bg-[#1e293b]/50 border border-[#475569]/50 rounded-sm text-white ${isDense ? 'text-[9px]' : 'text-[10px]'} font-medium break-words leading-tight flex items-center page-break-avoid`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] shrink-0 mr-1.5"></div>
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.courses && data.courses.length > 0 && (
          <div className={`mb-5 ${isDense ? 'space-y-1.5' : 'space-y-2'} w-full relative z-10`}>
            <h2 className={`${t.sidebarSmall} font-bold text-[#ffffff] uppercase tracking-wider mb-2 border-b border-[#64748b] pb-1 page-break-avoid`}>Cursos</h2>
            <ul className="space-y-2">
              {data.courses.map((course, index) => (
                <li key={index} className={`flex items-start gap-2 ${t.sidebarSmall} page-break-avoid`}>
                   <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] shrink-0 mt-1"></div>
                   <div>
                     <div className="font-bold">{course.name}</div>
                     <div className={`text-[#cbd5e1] ${isDense ? 'text-[9.5px]' : 'text-[10px]'}`}>{course.institution}{course.date ? ` | ${course.date}` : ''}</div>
                   </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {data.customSections && data.customSections.map(section => (
          <div key={section.id} className={`mb-5 ${isDense ? 'space-y-1.5' : 'space-y-2'} w-full relative z-10`}>
            <h2 className={`${t.sidebarSmall} font-bold text-[#ffffff] uppercase tracking-wider mb-2 border-b border-[#64748b] pb-1 page-break-avoid`}>{section.name}</h2>
            <div className={isDense ? 'space-y-2' : 'space-y-2.5'}>
              {section.items.map((item, index) => (
                <div key={index} className={`flex items-start gap-2 ${t.sidebarSmall} page-break-avoid`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] shrink-0 mt-1"></div>
                  <div>
                    <div className="font-bold leading-tight">{item.title} {item.subtitle && <span className="font-normal text-[#cbd5e1]">| {item.subtitle}</span>}</div>
                    {item.date && <div className={`${isDense ? 'text-[9.5px]' : 'text-[10px]'} text-[#fbbf24] mt-0.5`}>{item.date}</div>}
                    {item.description && <div className={`${isDense ? 'text-[9.5px]' : 'text-[10px]'} text-[#cbd5e1] mt-0.5 leading-tight`}>{item.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className={`relative z-10 w-[65%] pl-6 pr-8 pt-8 pb-6 flex flex-col`}>
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

        <div className="relative z-10 mb-6 flex flex-col pr-8">
          <h1 className={`${t.name} font-black text-[#374151] uppercase leading-none tracking-tight`}>
            {personalInfo.fullName ? personalInfo.fullName.split(' ').map((name, i) => (
              <div key={i}>{name}</div>
            )) : <><div className="text-[#cbd5e1]">NOME</div><div className="text-[#cbd5e1]">COMPLETO</div></>}
          </h1>
          {personalInfo.jobTitle && <p className={`${t.job} font-bold text-[#374151] uppercase mt-2 tracking-widest`}>{personalInfo.jobTitle}</p>}
        </div>
        
        <div className={`relative z-10 ${t.space} flex-1`}>
          {personalInfo.summary && (
            <div className="relative flex min-h-[50px]">
               <div className="flex flex-col items-center shrink-0 w-10 z-10 pt-0.5">
                  <div className="w-8 h-8 rounded-full bg-[#ffffff] flex items-center justify-center border-2 border-[#fbbf24] shadow-sm z-10">
                    <User className="w-4 h-4 text-[#fbbf24]" strokeWidth={2.5} />
                  </div>
                  <div className="w-px bg-[#fbbf24] flex-1 mt-1 -mb-4"></div>
               </div>
               <div className="pl-3 pt-1 pb-3 flex-1">
                 <h2 className={`${t.h3} font-black text-[#374151] uppercase mb-1.5 tracking-wider flex items-center page-break-avoid`}>
                   Resumo Profissional
                 </h2>
                 <p className={`${t.body} font-medium text-[#374151] leading-relaxed whitespace-pre-line  pr-2`}>
                   <HighlightText text={personalInfo.summary} keywords={data.keywords} showHighlights={data.showHighlights} />
                 </p>
               </div>
            </div>
          )}
          
          {experience.length > 0 && (
            <div className="relative flex min-h-[50px]">
               <div className="flex flex-col items-center shrink-0 w-10 z-10 pt-0.5">
                  <div className="w-8 h-8 rounded-full bg-[#ffffff] flex items-center justify-center border-2 border-[#fbbf24] shadow-sm z-10">
                     <Briefcase className="w-4 h-4 text-[#fbbf24]" strokeWidth={2.5} />
                  </div>
                  <div className="w-px bg-[#fbbf24] flex-1 mt-1 -mb-4"></div>
               </div>
               <div className="pl-3 pt-1 pb-3 flex-1">
                 <h2 className={`${t.h3} font-black text-[#374151] uppercase mb-3 tracking-wider page-break-avoid`}>
                   Experiência Profissional
                 </h2>
                 <div className={t.space}>
                   {experience.map((exp, idx) => (
                     <div key={idx} className="relative page-break-avoid">
                        <div className="absolute left-[-1.6rem] top-[6px] w-[7px] h-[7px] rounded-full border border-[#fbbf24] bg-[#ffffff] ring-4 ring-[#ffffff] z-20"></div>
                        
                        <div className={`font-bold text-[#374151] ${t.h3} leading-snug`}>
                           {exp.company}{exp.location && <span className="font-normal text-[#6b7280] whitespace-nowrap">&nbsp;- {exp.location}</span>}
                        </div>
                        <div className={`${t.small} font-bold text-[#374151] mt-0.5 mb-0.5 inline-flex bg-[#f1f5f9] px-2 py-0.5 rounded-sm`}>
                           Cargo: {exp.position}
                        </div>
                        <div className={`${isDense ? 'text-[9.5px]' : 'text-[10px]'} font-bold text-[#fbbf24] mb-1.5`}>
                           {exp.startDate} {exp.startDate && exp.endDate ? '-' : ''} {exp.endDate}
                        </div>
                        <div className={`${t.body} font-medium text-[#374151] leading-relaxed whitespace-pre-line pr-2 `}>
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
               <div className="w-px bg-gradient-to-b from-[#fbbf24] to-[#ffffff00] h-full"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderExecutive = () => (
    <div className={`font-sans text-[#1f2937] bg-[#ffffff] w-[794px] min-h-[1122px] shadow-lg rounded-sm mx-auto flex flex-col justify-start print:max-w-full print:w-[100%] print:shadow-none print:rounded-none print:overflow-visible print:bg-[transparent]`}>
      <div className={`w-full bg-[#1e293b] text-[#ffffff] px-8 py-6 flex items-center justify-between shrink-0`}>
         <div className="flex-1">
            <h1 className={`${t.name} font-black uppercase mb-1 tracking-tight text-[#ffffff]`}>{personalInfo.fullName || 'Seu Nome'}</h1>
            <p className={`${t.job} text-[#fbbf24] font-semibold uppercase tracking-widest`}>{personalInfo.jobTitle || 'Seu Cargo'}</p>
         </div>
         {personalInfo.photoUrl && (
            <div className="ml-6 shrink-0">
               {renderPhoto(isDense ? "w-20 h-20 rounded-full overflow-hidden border-2 border-[#fbbf24]" : "w-28 h-28 rounded-full overflow-hidden border-2 border-[#fbbf24]")}
            </div>
         )}
      </div>

      <div className={`w-full bg-[#334155] text-[#cbd5e1] px-8 py-2.5 flex flex-wrap gap-x-6 gap-y-1 ${t.small} shrink-0`}>
          {personalInfo.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#fbbf24]"/> {personalInfo.email}</div>}
          {personalInfo.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#fbbf24]"/> {personalInfo.phone}</div>}
          {personalInfo.location && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#fbbf24]"/> {personalInfo.location}</div>}
      </div>

      <div className={`px-8 pt-8 pb-6 flex-1 flex flex-col ${t.mb} gap-y-6`}>
        {personalInfo.summary && (
          <div className="w-full">
            <h2 className={`${t.h2} font-black text-[#1e293b] border-b-2 border-[#e5e7eb] uppercase pb-1 mb-2 tracking-wider flex items-center gap-2 page-break-avoid`}>
               <span className="w-3 h-3 bg-[#fbbf24] inline-block rounded-sm shrink-0"></span>
               Resumo Profissional
            </h2>
            <p className={`${t.body} leading-relaxed whitespace-pre-line text-[#4b5563]`}>
              <HighlightText text={personalInfo.summary} keywords={data.keywords} showHighlights={data.showHighlights} />
            </p>
          </div>
        )}

        {experience.length > 0 && (
          <div className="w-full">
            <h2 className={`${t.h2} font-black text-[#1e293b] border-b-2 border-[#e5e7eb] uppercase pb-1 mb-3 tracking-wider flex items-center gap-2`}>
               <span className="w-3 h-3 bg-[#fbbf24] inline-block rounded-sm shrink-0"></span>
               Experiência Profissional
            </h2>
            <div className={isDense ? 'space-y-4' : 'space-y-5'}>
              {experience.map((exp, index) => (
                <div key={index} className="page-break-avoid w-full">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className={`font-bold text-[#1e293b] ${t.h3} leading-tight`}>{exp.position}</h3>
                    <span className={`${t.small} font-bold text-[#fbbf24] shrink-0 uppercase tracking-widest`}>
                      {exp.startDate} {exp.startDate && exp.endDate ? '-' : ''} {exp.endDate}
                    </span>
                  </div>
                  <div className={`mb-1.5 ${t.body} font-medium text-[#64748b]`}>
                    {exp.company}{exp.location && <span className="whitespace-nowrap">&nbsp;| {exp.location}</span>}
                  </div>
                  <p className={`${t.body} leading-relaxed whitespace-pre-line text-[#4b5563]`}>
                    <HighlightText text={exp.description} keywords={data.keywords} showHighlights={data.showHighlights} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {education.length > 0 && (
          <div className="w-full">
            <h2 className={`${t.h2} font-black text-[#1e293b] border-b-2 border-[#e5e7eb] uppercase pb-1 mb-3 tracking-wider flex items-center gap-2`}>
               <span className="w-3 h-3 bg-[#fbbf24] inline-block rounded-sm shrink-0"></span>
               Formação Acadêmica
            </h2>
            <div className={isDense ? 'space-y-3' : 'space-y-4'}>
              {education.map((edu, index) => (
                <div key={index} className="page-break-avoid w-full">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className={`font-bold text-[#1e293b] ${t.h3} leading-tight`}>{edu.degree}</h3>
                    <span className={`${t.small} font-bold text-[#fbbf24] shrink-0 uppercase tracking-widest`}>
                      {edu.startDate} {edu.startDate && edu.endDate ? '-' : ''} {edu.endDate}
                    </span>
                  </div>
                  <div className={`${t.body} font-medium text-[#64748b]`}>
                    {edu.institution}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {skills.length > 0 && (
          <div className="w-full">
            <h2 className={`${t.h2} font-black text-[#1e293b] border-b-2 border-[#e5e7eb] uppercase pb-1 mb-3 tracking-wider flex items-center gap-2 page-break-avoid`}>
               <span className="w-3 h-3 bg-[#fbbf24] inline-block rounded-sm shrink-0"></span>
               Habilidades
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((s, i) => (
                 <span key={i} className={`inline-block ${t.small} font-bold text-[#1e293b] bg-[#f1f5f9] px-2 py-1 rounded-md border border-[#e2e8f0] page-break-avoid`}>
                   {s.name}
                 </span>
              ))}
            </div>
          </div>
        )}

        {data.courses && data.courses.length > 0 && (
          <div className="w-full">
            <h2 className={`${t.h2} font-black text-[#1e293b] border-b-2 border-[#e5e7eb] uppercase pb-1 mb-3 tracking-wider flex items-center gap-2`}>
               <span className="w-3 h-3 bg-[#fbbf24] inline-block rounded-sm shrink-0"></span>
               Cursos Complementares
            </h2>
            <div className={isDense ? 'space-y-2' : 'space-y-3'}>
              {data.courses.map((course, index) => (
                <div key={index} className="page-break-avoid w-full flex justify-between items-start">
                  <div className={`font-bold text-[#1e293b] ${t.body} leading-tight`}>{course.name}</div>
                  <div className={`${t.small} text-[#64748b] text-right ml-4 shrink-0`}>{course.institution}{course.date ? ` | ${course.date}` : ''}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.customSections && data.customSections.map((section) => (
          <div key={section.id} className="w-full">
            <h2 className={`${t.h2} font-black text-[#1e293b] border-b-2 border-[#e5e7eb] uppercase pb-1 mb-3 tracking-wider flex items-center gap-2`}>
               <span className="w-3 h-3 bg-[#fbbf24] inline-block rounded-sm shrink-0"></span>
               {section.name}
            </h2>
            <div className={isDense ? 'space-y-3' : 'space-y-4'}>
              {section.items.map((item) => (
                <div key={item.id} className="page-break-avoid w-full">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className={`font-bold text-[#1e293b] ${t.h3} leading-tight`}>{item.title} {item.subtitle && <span className="text-[#64748b] font-normal">| {item.subtitle}</span>}</h3>
                    {item.date && (
                      <span className={`${t.small} font-bold text-[#fbbf24] shrink-0 uppercase tracking-widest`}>{item.date}</span>
                    )}
                  </div>
                  {item.description && (
                    <p className={`${t.body} leading-relaxed whitespace-pre-line mt-1 text-[#4b5563]`}>{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCorporate = () => (
    <div className={`font-sans text-[#1f2937] bg-white w-[794px] min-h-[1122px] shadow-lg rounded-sm mx-auto flex flex-col pt-10 pb-8 px-12 print:max-w-full print:w-[100%] print:shadow-none print:rounded-none print:overflow-visible print:bg-transparent print:p-8 relative`}>
      
      {/* Top Banner Accent */}
      <div className="absolute top-0 left-0 right-0 h-3 bg-[#0f172a] print:hidden"></div>
      <div className="absolute top-3 left-0 right-0 h-1 bg-[#2563eb] print:hidden"></div>

      <div className="absolute top-0 left-0 right-0 h-3 bg-[#0f172a] hidden print:block"></div>
      <div className="absolute top-3 left-0 right-0 h-1 bg-[#2563eb] hidden print:block"></div>
      
      {/* Header Container */}
      <div className="w-full flex items-center gap-6 border-b-4 border-gray-100 pb-6 mb-6 mt-4 page-break-avoid">
        {shouldRenderPhotoArea && personalInfo.photoUrl && (
          <div className="shrink-0 w-28 h-28 rounded-xl overflow-hidden border-2 border-[#2563eb] shadow-sm transform -rotate-2 print:transform-none">
             <img src={personalInfo.photoUrl} alt="Profile" className="w-full h-full object-cover transform rotate-2 print:transform-none scale-110" />
          </div>
        )}
        <div className="flex-1">
          <h1 className={`${isDense ? 'text-3xl' : isNormal ? 'text-4xl' : 'text-5xl'} font-black uppercase tracking-tighter text-[#0f172a] mb-1.5`}>{personalInfo.fullName || 'Seu Nome'}</h1>
          <h2 className={`${isDense ? 'text-base' : isNormal ? 'text-lg' : 'text-xl'} font-bold uppercase tracking-widest text-[#2563eb] mb-3`}>{personalInfo.jobTitle || 'Seu Cargo'}</h2>
          
          <div className={`flex flex-wrap gap-x-5 gap-y-1.5 ${t.small} text-gray-600 font-medium`}>
              {personalInfo.email && <div className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-[#cbd5e1]"/> {personalInfo.email}</div>}
              {personalInfo.phone && <div className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-[#cbd5e1]"/> {personalInfo.phone}</div>}
              {personalInfo.location && <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#cbd5e1]"/> {personalInfo.location}</div>}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-y-7 w-full">
        {personalInfo.summary && (
          <div className="">
            <h2 className={`${t.h3} font-black text-[#0f172a] uppercase tracking-widest mb-2 flex items-center gap-2 page-break-avoid`}>
               <span className="w-4 h-4 rounded-sm bg-[#2563eb] inline-block shrink-0"></span> Resumo Profissional
            </h2>
            <p className={`${t.body} text-gray-700 leading-relaxed text-justify pl-6`}>
              <HighlightText text={personalInfo.summary} keywords={data.keywords} showHighlights={data.showHighlights} />
            </p>
          </div>
        )}

        {experience.length > 0 && (
          <div>
            <h2 className={`${t.h3} font-black text-[#0f172a] uppercase tracking-widest mb-4 flex items-center gap-2`}>
               <span className="w-4 h-4 rounded-sm bg-[#2563eb] inline-block shrink-0"></span> Experiência
            </h2>
            <div className={isDense ? 'space-y-4' : 'space-y-6'}>
              {experience.map((exp, index) => (
                <div key={index} className="page-break-avoid w-full pl-6 border-l-2 border-gray-100 relative">
                  <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-[#2563eb]"></div>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={`font-bold text-[#0f172a] ${t.h3}`}>{exp.position}</h3>
                    <span className={`${t.small} font-bold text-gray-400 uppercase tracking-wider shrink-0 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100`}>
                      {exp.startDate} {exp.startDate && exp.endDate ? '-' : ''} {exp.endDate}
                    </span>
                  </div>
                  <div className={`mb-2 font-bold text-[#3b82f6] ${t.small} uppercase tracking-wider`}>
                    {exp.company}{exp.location && <span className="text-gray-400 font-medium whitespace-nowrap">&nbsp;• {exp.location}</span>}
                  </div>
                  <div className={`${t.body} leading-relaxed text-gray-700 whitespace-pre-wrap text-justify`}>
                    <HighlightText text={exp.description} keywords={data.keywords} showHighlights={data.showHighlights} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {education.length > 0 && (
          <div>
            <h2 className={`${t.h3} font-black text-[#0f172a] uppercase tracking-widest mb-4 flex items-center gap-2`}>
               <span className="w-4 h-4 rounded-sm bg-[#2563eb] inline-block shrink-0"></span> Formação Acadêmica
            </h2>
            <div className={isDense ? 'space-y-3' : 'space-y-5'}>
              {education.map((edu, index) => (
                <div key={index} className="page-break-avoid w-full pl-6 flex justify-between items-start border-l-2 border-gray-100 relative">
                  <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-[#2563eb]"></div>
                  <div>
                    <h3 className={`font-bold text-[#0f172a] ${t.h3}`}>{edu.degree}</h3>
                    <div className={`${t.body} text-gray-500 font-medium mt-0.5`}>{edu.institution}</div>
                  </div>
                  <span className={`${t.small} font-bold text-gray-400 uppercase tracking-wider shrink-0 mt-0.5 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100`}>
                    {edu.startDate} {edu.startDate && edu.endDate ? '-' : ''} {edu.endDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(skills.length > 0 || (data.courses && data.courses.length > 0)) && (
          <div className="flex flex-wrap items-start w-full gap-8">
            {skills.length > 0 && (
              <div className="flex-1 min-w-[250px]">
                <h2 className={`${t.h3} font-black text-[#0f172a] uppercase tracking-widest mb-4 flex items-center gap-2 page-break-avoid`}>
                   <span className="w-4 h-4 rounded-sm bg-[#2563eb] inline-block shrink-0"></span> Competências
                </h2>
                <div className="flex flex-wrap gap-2 pl-6">
                  {skills.map((s, i) => (
                    <span key={i} className={`inline-block ${t.small} font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-sm border border-gray-200 shadow-sm page-break-avoid`}>
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {data.courses && data.courses.length > 0 && (
              <div className="flex-1 min-w-[250px]">
                <h2 className={`${t.h3} font-black text-[#0f172a] uppercase tracking-widest mb-4 flex items-center gap-2 page-break-avoid`}>
                   <span className="w-4 h-4 rounded-sm bg-[#2563eb] inline-block shrink-0"></span> Cursos Relevantes
                </h2>
                <div className={`${isDense ? 'space-y-2' : 'space-y-3'} pl-6`}>
                  {data.courses.map((course, index) => (
                    <div key={index} className="w-full flex items-center gap-2 page-break-avoid">
                      <div className="w-1.5 h-1.5 bg-[#2563eb] rounded-full shrink-0"></div>
                      <div className={`font-bold text-[#0f172a] ${t.body} leading-tight`}>{course.name} <span className="font-normal text-gray-500">{course.institution ? `| ${course.institution}` : ''} {course.date ? `(${course.date})` : ''}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {data.customSections && data.customSections.map((section) => (
          <div key={section.id} className="w-full">
            <h2 className={`${t.h3} font-black text-[#0f172a] uppercase tracking-widest mb-4 flex items-center gap-2`}>
               <span className="w-4 h-4 rounded-sm bg-[#2563eb] inline-block shrink-0"></span> {section.name}
            </h2>
            <div className={`${isDense ? 'space-y-4' : 'space-y-5'} pl-6`}>
              {section.items.map((item) => (
                <div key={item.id} className="page-break-avoid w-full border-l-2 border-gray-100 pl-4 relative">
                  <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-[#2563eb]"></div>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={`font-bold text-[#0f172a] ${t.h3}`}>{item.title} {item.subtitle && <span className="text-gray-400 font-normal">| {item.subtitle}</span>}</h3>
                    {item.date && (
                      <span className={`${t.small} font-bold text-gray-400 uppercase tracking-wider shrink-0 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100`}>{item.date}</span>
                    )}
                  </div>
                  {item.description && (
                    <p className={`${t.body} leading-relaxed text-gray-600 whitespace-pre-wrap mt-1 text-justify`}>{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div ref={ref} className="origin-top print:shadow-none print:m-0 print:p-0">
      {template === 'modern' && renderModern()}
      {template === 'classic' && renderClassic()}
      {template === 'minimal' && renderMinimal()}
      {template === 'creative' && renderCreative()}
      {template === 'executive' && renderExecutive()}
      {template === 'corporate' && renderCorporate()}
    </div>
  );
});
