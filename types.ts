
export interface Profile {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  // New Profile Pro fields
  avatar?: string; // Base64 string
  showAvatar: boolean;
  gender?: string;
  birthYear?: string; // YYYY
  workYears?: string; // e.g. "3年"
  jobStatus?: string; // e.g. "离职-随时到岗"
  salary?: string; // e.g. "15k-20k"
  nativePlace?: string;
  politicalStatus?: string;
  height?: string;
  weight?: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Experience {
  id: string;
  company: string; // Used as "Organization" for campus
  position: string; // Used as "Role" for campus
  startDate: string;
  endDate: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  level: string; 
}

// Generic item for custom sections
export interface CustomItem {
  id: string;
  title: string;      // Main bold text (left)
  subtitle: string;   // Italic text (below title)
  date: string;       // Date text (right)
  description: string;// Body text
}

export interface CustomSection {
  id: string;
  title: string;      // Section Header (e.g. "Awards", "Certificates")
  items: CustomItem[];
}

// Section Management
export type SectionType = 'education' | 'experience' | 'projects' | 'internships' | 'campus' | 'custom';

export interface SectionConfig {
  id: string;
  visible: boolean;
  type: SectionType;
  name?: string; // Optional display name override for standard sections
}

// Styling Types
export type TemplateId = 'classic' | 'modern' | 'minimal' | 'curve';
export type FontFamily = 'Calibri' | 'Microsoft YaHei' | 'SimSun' | 'KaiTi' | 'Roboto';

export interface ResumeStyle {
  templateId: TemplateId;
  fontFamily: FontFamily;
  themeColor: string;
  lineHeight: number; // e.g. 1.25, 1.5
  paragraphSpacing: number; // e.g. 4, 8 (pt)
  fontSize: number; // Base font size in pt (e.g., 10.5, 11, 12)
  pagePadding: number; // Page margin in mm
}

export interface ResumeData {
  profile: Profile;
  education: Education[];
  experience: Experience[];
  internships: Experience[]; // New
  campus: Experience[];      // New
  projects: Project[];
  skills: Skill[];
  customSections: CustomSection[];
  sectionOrder: SectionConfig[]; // New: controls order and visibility
  style: ResumeStyle; 
}

declare global {
  interface Window {
    docx: any;
    saveAs: any;
    mammoth: any;
    html2canvas: any;
    jspdf: any;
  }
}