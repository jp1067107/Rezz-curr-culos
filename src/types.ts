export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  photoUrl: string | null;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
}

export interface Skill {
  id: string;
  name: string;
}

export interface Course {
  id: string;
  name: string;
  institution: string;
}

export interface CustomItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  description: string;
}

export interface CustomSection {
  id: string;
  name: string;
  items: CustomItem[];
}

export interface ResumeData {
  id?: string;
  name?: string;
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  courses?: Course[];
  customSections?: CustomSection[];
  coverLetter?: string;
  keywords?: string[];
  showHighlights?: boolean;
}

export type TemplateType = 'modern' | 'classic' | 'minimal' | 'creative';
