import React, { useState } from 'react';
import { ResumeData, Experience, Education, Skill } from '../types';
import { ImageUpload } from './ImageUpload';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ResumeFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

export function ResumeForm({ data, onChange }: ResumeFormProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'experience' | 'education' | 'skills' | 'courses' | 'customSections'>('personal');

  const updatePersonalInfo = (field: keyof ResumeData['personalInfo'], value: string | null) => {
    onChange({
      ...data,
      personalInfo: { ...data.personalInfo, [field]: value }
    });
  };

  const addCustomSection = () => {
    onChange({
      ...data,
      customSections: [...(data.customSections || []), { id: uuidv4(), name: '', items: [] }]
    });
  };

  const updateCustomSection = (id: string, name: string) => {
    onChange({
      ...data,
      customSections: (data.customSections || []).map(sec => sec.id === id ? { ...sec, name } : sec)
    });
  };

  const removeCustomSection = (id: string) => {
    onChange({
      ...data,
      customSections: (data.customSections || []).filter(sec => sec.id !== id)
    });
  };

  const addCustomItem = (sectionId: string) => {
    onChange({
      ...data,
      customSections: (data.customSections || []).map(sec => sec.id === sectionId ? {
        ...sec,
        items: [...sec.items, { id: uuidv4(), title: '', subtitle: '', date: '', description: '' }]
      } : sec)
    });
  };

  const updateCustomItem = (sectionId: string, itemId: string, field: string, value: string) => {
    onChange({
      ...data,
      customSections: (data.customSections || []).map(sec => sec.id === sectionId ? {
        ...sec,
        items: sec.items.map(item => item.id === itemId ? { ...item, [field]: value } : item)
      } : sec)
    });
  };

  const removeCustomItem = (sectionId: string, itemId: string) => {
    onChange({
      ...data,
      customSections: (data.customSections || []).map(sec => sec.id === sectionId ? {
        ...sec,
        items: sec.items.filter(item => item.id !== itemId)
      } : sec)
    });
  };

  const addExperience = () => {
    onChange({
      ...data,
      experience: [...data.experience, { id: uuidv4(), company: '', position: '', startDate: '', endDate: '', description: '' }]
    });
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    onChange({
      ...data,
      experience: data.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    });
  };

  const removeExperience = (id: string) => {
    onChange({
      ...data,
      experience: data.experience.filter(exp => exp.id !== id)
    });
  };

  const moveExperience = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === data.experience.length - 1)) return;
    const newItems = [...data.experience];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    onChange({ ...data, experience: newItems });
  };

  const addEducation = () => {
    onChange({
      ...data,
      education: [...data.education, { id: uuidv4(), institution: '', degree: '', startDate: '', endDate: '' }]
    });
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    onChange({
      ...data,
      education: data.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu)
    });
  };

  const removeEducation = (id: string) => {
    onChange({
      ...data,
      education: data.education.filter(edu => edu.id !== id)
    });
  };

  const moveEducation = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === data.education.length - 1)) return;
    const newItems = [...data.education];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    onChange({ ...data, education: newItems });
  };

  const addSkill = () => {
    onChange({
      ...data,
      skills: [...data.skills, { id: uuidv4(), name: '' }]
    });
  };

  const updateSkill = (id: string, name: string) => {
    onChange({
      ...data,
      skills: data.skills.map(skill => skill.id === id ? { ...skill, name } : skill)
    });
  };

  const removeSkill = (id: string) => {
    onChange({
      ...data,
      skills: data.skills.filter(skill => skill.id !== id)
    });
  };

  const addCourse = () => {
    onChange({
      ...data,
      courses: [...(data.courses || []), { id: uuidv4(), name: '', institution: '' }]
    });
  };

  const updateCourse = (id: string, field: 'name' | 'institution', value: string) => {
    onChange({
      ...data,
      courses: (data.courses || []).map(course => course.id === id ? { ...course, [field]: value } : course)
    });
  };

  const removeCourse = (id: string) => {
    onChange({
      ...data,
      courses: (data.courses || []).filter(course => course.id !== id)
    });
  };

  // Helper for input classes
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-100 placeholder:text-slate-500";
  const labelClass = "block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1";

  const renderTabButton = (tab: typeof activeTab, label: string, index: number) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl transition-all whitespace-nowrap ${
        activeTab === tab 
          ? 'bg-indigo-500/20 border border-indigo-400/30 text-indigo-200' 
          : 'text-slate-400 hover:bg-white/5 border border-transparent'
      }`}
    >
      <span className={`text-[10px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0 ${
        activeTab === tab ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white'
      }`}>
        {index}
      </span>
      <span className="text-xs sm:text-sm font-semibold">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-6 h-full w-full overflow-hidden">
      {/* Top Navigation */}
      <aside className="w-full shrink-0 overflow-x-auto hide-scrollbar pb-2">
        <div className="p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl flex flex-row gap-1 w-max min-w-full">
          {renderTabButton('personal', 'Dados Pessoais', 1)}
          {renderTabButton('experience', 'Experiência', 2)}
          {renderTabButton('education', 'Formação', 3)}
          {renderTabButton('skills', 'Habilidades', 4)}
          {renderTabButton('courses', 'Cursos', 5)}
          {renderTabButton('customSections', 'Seções Extras', 6)}
        </div>
      </aside>

      <section className="flex-1 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 overflow-y-auto flex flex-col scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {activeTab === 'personal' && (
          <div className="space-y-6">
            <ImageUpload 
              value={data.personalInfo.photoUrl} 
              onChange={(url) => updatePersonalInfo('photoUrl', url)} 
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nome Completo</label>
                <input 
                  type="text" 
                  value={data.personalInfo.fullName}
                  onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                  className={inputClass}
                  placeholder="João Silva"
                />
              </div>
              <div>
                <label className={labelClass}>Cargo Pretendido</label>
                <input 
                  type="text" 
                  value={data.personalInfo.jobTitle}
                  onChange={(e) => updatePersonalInfo('jobTitle', e.target.value)}
                  className={inputClass}
                  placeholder="Engenheiro de Software"
                />
              </div>
              <div>
                <label className={labelClass}>E-mail</label>
                <input 
                  type="email" 
                  value={data.personalInfo.email}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  className={inputClass}
                  placeholder="joao@email.com"
                />
              </div>
              <div>
                <label className={labelClass}>Telefone</label>
                <input 
                  type="tel" 
                  value={data.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  className={inputClass}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Localização</label>
                <input 
                  type="text" 
                  value={data.personalInfo.location}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                  className={inputClass}
                  placeholder="São Paulo, SP"
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Resumo Profissional</label>
                <textarea 
                  rows={4}
                  value={data.personalInfo.summary}
                  onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                  className={inputClass}
                  placeholder="Um breve resumo sobre sua trajetória profissional..."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'experience' && (
          <div className="space-y-6">
            {data.experience.map((exp, index) => (
              <div key={exp.id} className="p-4 bg-white/5 rounded-xl border border-white/10 relative group">
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => moveExperience(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 rounded-md"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => moveExperience(index, 'down')}
                    disabled={index === data.experience.length - 1}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 rounded-md"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => removeExperience(exp.id)}
                    className="p-1 text-slate-400 hover:text-red-400 bg-white/5 rounded-md"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={labelClass}>Empresa / Organização</label>
                    <input 
                      type="text" 
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Cargo</label>
                    <input 
                      type="text" 
                      value={exp.position}
                      onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Data de Início</label>
                    <input 
                      type="text" 
                      value={exp.startDate}
                      onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                      className={inputClass}
                      placeholder="ex: Jan 2020"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Data de Término</label>
                    <input 
                      type="text" 
                      value={exp.endDate}
                      onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                      className={inputClass}
                      placeholder="ex: O momento"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Descrição / Responsabilidades</label>
                  <textarea 
                    rows={3}
                    value={exp.description}
                    onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                    className={inputClass}
                    placeholder="Descreva seu papel e conquistas..."
                  />
                </div>
              </div>
            ))}
            <button 
              onClick={addExperience}
              className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-indigo-400 font-bold hover:border-indigo-400 hover:bg-indigo-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Adicionar Experiência
            </button>
          </div>
        )}

        {activeTab === 'education' && (
          <div className="space-y-6">
            {data.education.map((edu, index) => (
              <div key={edu.id} className="p-4 bg-white/5 rounded-xl border border-white/10 relative group">
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => moveEducation(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 rounded-md"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => moveEducation(index, 'down')}
                    disabled={index === data.education.length - 1}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 rounded-md"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => removeEducation(edu.id)}
                    className="p-1 text-slate-400 hover:text-red-400 bg-white/5 rounded-md"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Instituição de Ensino</label>
                    <input 
                      type="text" 
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Curso / Grau</label>
                    <input 
                      type="text" 
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Data de Início</label>
                    <input 
                      type="text" 
                      value={edu.startDate}
                      onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                      className={inputClass}
                      placeholder="ex: Set 2016"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Data de Término</label>
                    <input 
                      type="text" 
                      value={edu.endDate}
                      onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                      className={inputClass}
                      placeholder="ex: Dez 2020"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button 
              onClick={addEducation}
              className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-indigo-400 font-bold hover:border-indigo-400 hover:bg-indigo-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Adicionar Formação
            </button>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {data.skills.map((skill) => (
                <div key={skill.id} className="relative group">
                  <input 
                    type="text" 
                    value={skill.name}
                    onChange={(e) => updateSkill(skill.id, e.target.value)}
                    className={inputClass}
                    placeholder="ex: Gestão de Projetos"
                  />
                  <button 
                    onClick={() => removeSkill(skill.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity p-1.5 bg-white/5 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button 
              onClick={addSkill}
              className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-indigo-400 font-bold hover:border-indigo-400 hover:bg-indigo-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Adicionar Habilidade
            </button>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="space-y-4">
              {(data.courses || []).map((course) => (
                <div key={course.id} className="p-4 sm:p-5 bg-white/5 border border-white/10 rounded-2xl relative group">
                  <button 
                    onClick={() => removeCourse(course.id)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-red-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity p-2 bg-white/5 rounded-lg"
                    title="Remover curso"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-10">
                    <div>
                      <label className={labelClass}>Nome do Curso</label>
                      <input 
                        type="text" 
                        value={course.name}
                        onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                        className={inputClass}
                        placeholder="Power BI Avançado"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Instituição / Escola</label>
                      <input 
                        type="text" 
                        value={course.institution}
                        onChange={(e) => updateCourse(course.id, 'institution', e.target.value)}
                        className={inputClass}
                        placeholder="Alura"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={addCourse}
              className="w-full py-4 border-2 border-dashed border-white/20 rounded-xl text-indigo-400 font-bold hover:border-indigo-400 hover:bg-indigo-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Adicionar Curso
            </button>
          </div>
        )}

        {activeTab === 'customSections' && (
          <div className="space-y-8">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <p className="text-sm text-indigo-200">
                Adicione seções arbitrárias ao seu currículo (ex: <b>Idiomas</b>, <b>Trabalho Voluntário</b>, <b>Projetos Pessoais</b>, etc).
              </p>
            </div>
            {(data.customSections || []).map((section) => (
              <div key={section.id} className="space-y-4 p-5 bg-white/5 border border-white/10 rounded-3xl relative group/section">
                <button 
                  onClick={() => removeCustomSection(section.id)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-red-400 opacity-100 lg:opacity-0 lg:group-hover/section:opacity-100 transition-opacity p-2 bg-white/5 rounded-lg"
                  title="Remover sessão"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div>
                  <label className={labelClass}>Nome da Seção (ex: Projetos)</label>
                  <input 
                    type="text" 
                    value={section.name}
                    onChange={(e) => updateCustomSection(section.id, e.target.value)}
                    className={inputClass}
                    placeholder="Nome da Seção"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  {section.items.map((item) => (
                    <div key={item.id} className="p-4 bg-white/5 rounded-xl border border-white/5 relative group/item">
                      <button 
                        onClick={() => removeCustomItem(section.id, item.id)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-red-400 opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 transition-opacity p-1.5 bg-white/5 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 pr-8">
                        <div>
                          <label className={labelClass}>Título Principal</label>
                          <input 
                            type="text" 
                            value={item.title}
                            onChange={(e) => updateCustomItem(section.id, item.id, 'title', e.target.value)}
                            className={inputClass}
                            placeholder="ex: Inglês"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Subtítulo / Tipo</label>
                          <input 
                            type="text" 
                            value={item.subtitle}
                            onChange={(e) => updateCustomItem(section.id, item.id, 'subtitle', e.target.value)}
                            className={inputClass}
                            placeholder="ex: Fluente"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelClass}>Data (opcional)</label>
                          <input 
                            type="text" 
                            value={item.date}
                            onChange={(e) => updateCustomItem(section.id, item.id, 'date', e.target.value)}
                            className={inputClass}
                            placeholder="Ex: 2021 - 2023"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelClass}>Descrição (opcional)</label>
                          <textarea 
                            rows={2}
                            value={item.description}
                            onChange={(e) => updateCustomItem(section.id, item.id, 'description', e.target.value)}
                            className={inputClass}
                            placeholder="Detalhes adicionais..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => addCustomItem(section.id)}
                    className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-indigo-400 text-sm font-bold hover:border-indigo-400 hover:bg-indigo-500/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Item em {section.name || 'Nova Seção'}
                  </button>
                </div>
              </div>
            ))}
            <button 
              onClick={addCustomSection}
              className="w-full py-4 border-2 border-dashed border-white/20 rounded-xl text-indigo-400 font-bold hover:border-indigo-400 hover:bg-indigo-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Adicionar Nova Seção
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
