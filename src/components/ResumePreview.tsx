import React, { forwardRef } from 'react';
import { ResumeData, TemplateType } from '../types';
import { Mail, Phone, MapPin } from 'lucide-react';

interface ResumePreviewProps {
  data: ResumeData;
  template: TemplateType;
}

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
    <div className="font-sans text-[#1f2937] bg-white w-[210mm] min-h-[297mm] shadow-lg rounded-sm mx-auto overflow-hidden flex print:shadow-none print:rounded-none print:h-[297mm] print:overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 bg-[#1e293b] text-white p-8 flex flex-col">
        {renderPhoto("w-32 h-32 rounded-full overflow-hidden border-4 border-[#475569] mx-auto mb-6")}
        
        <div className="mb-8 space-y-3">
          <h2 className="text-sm font-bold text-[#94a3b8] uppercase mb-4">Contato</h2>
          {personalInfo.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-[#94a3b8]" />
              <span className="break-all">{personalInfo.email}</span>
            </div>
          )}
          {personalInfo.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-[#94a3b8]" />
              <span>{personalInfo.phone}</span>
            </div>
          )}
          {personalInfo.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-[#94a3b8]" />
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
            <p className="text-sm text-[#4b5563] leading-relaxed whitespace-pre-line">{personalInfo.summary}</p>
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
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-[#1e293b]">{exp.position}</h3>
                    <span className="text-xs font-semibold text-[#2563eb]">
                      {exp.startDate} {exp.startDate && exp.endDate ? '-' : ''} {exp.endDate}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-[#64748b] mb-2">{exp.company}</div>
                  <p className="text-sm text-[#4b5563] leading-relaxed whitespace-pre-line">{exp.description}</p>
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
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-[#1e293b]">{edu.degree}</h3>
                    <span className="text-xs font-semibold text-[#2563eb]">
                      {edu.startDate} {edu.startDate && edu.endDate ? '-' : ''} {edu.endDate}
                    </span>
                  </div>
                  <div className="text-sm text-[#475569]">{edu.institution}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderClassic = () => (
    <div className="font-serif text-[#111827] bg-white w-[210mm] min-h-[297mm] shadow-lg rounded-sm mx-auto p-12 print:shadow-none print:rounded-none print:h-[297mm] print:overflow-hidden">
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
          <p className="text-sm leading-relaxed">{personalInfo.summary}</p>
        </div>
      )}

      {experience.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold uppercase border-b border-[#d1d5db] mb-4 pb-1">Experiência Profissional</h2>
          <div className="space-y-6">
            {experience.map((exp, index) => (
              <div key={index} className="page-break-avoid w-full">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-lg">{exp.company}</h3>
                  <span className="text-sm italic text-[#4b5563]">
                    {exp.startDate} {exp.startDate && exp.endDate ? '—' : ''} {exp.endDate}
                  </span>
                </div>
                <div className="font-medium italic mb-2">{exp.position}</div>
                <p className="text-sm leading-relaxed whitespace-pre-line">{exp.description}</p>
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
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold">{edu.institution}</h3>
                  <span className="text-sm italic text-[#4b5563]">
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
    </div>
  );

  const renderMinimal = () => (
    <div className="font-display text-[#1f2937] bg-white w-[210mm] min-h-[297mm] shadow-lg rounded-sm mx-auto p-12 flex flex-col print:shadow-none print:rounded-none print:h-[297mm] print:overflow-hidden">
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
              <p className="text-sm leading-relaxed">{personalInfo.summary}</p>
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
                    <p className="text-sm text-[#4b5563] leading-relaxed whitespace-pre-line">{exp.description}</p>
                  </div>
                ))}
              </div>
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
    </div>
  );
});
