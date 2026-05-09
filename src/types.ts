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

export interface ResumeData {
  id?: string;
  name?: string;
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  courses?: Course[];
  coverLetter?: string;
}

export type TemplateType = 'modern' | 'classic' | 'minimal';
