
import React from 'react';
import { ResumeData } from '../types';

interface ResumePreviewProps {
  data: ResumeData;
  scale: number;
}

// Helper to parse simple custom tags like <b>, <i>, <c>
const RichTextRenderer: React.FC<{ text: string; themeColor: string }> = ({ text, themeColor }) => {
    if (!text) return null;
    
    // Split by tags
    // Regex matches <b>...</b>, <i>...</i>, <c>...</c> or normal text
    const parts = text.split(/(<\/?(?:b|i|c)>)/g);
    
    let isBold = false;
    let isItalic = false;
    let isColor = false;

    return (
        <>
            {parts.map((part, index) => {
                if (part === '<b>') { isBold = true; return null; }
                if (part === '</b>') { isBold = false; return null; }
                if (part === '<i>') { isItalic = true; return null; }
                if (part === '</i>') { isItalic = false; return null; }
                if (part === '<c>') { isColor = true; return null; }
                if (part === '</c>') { isColor = false; return null; }
                
                if (!part) return null;

                return (
                    <span key={index} style={{ 
                        fontWeight: isBold ? 'bold' : 'normal', 
                        fontStyle: isItalic ? 'italic' : 'normal',
                        color: isColor ? themeColor : 'inherit'
                    }}>
                        {part}
                    </span>
                );
            })}
        </>
    );
};


const ResumePreview: React.FC<ResumePreviewProps> = ({ data, scale }) => {
  const { style, profile } = data;
  
  // Default font size if undefined
  const baseSize = style.fontSize || 10.5;

  // Map web fonts to CSS fonts
  const getCssFont = (fontFamily: string) => {
    switch(fontFamily) {
        case 'Calibri': return "'Calibri', 'Arial', sans-serif";
        case 'Microsoft YaHei': return "'Microsoft YaHei', '微软雅黑', sans-serif";
        case 'SimSun': return "'SimSun', '宋体', serif";
        case 'KaiTi': return "'KaiTi', '楷体', serif";
        case 'Roboto': return "'Roboto', sans-serif";
        default: return "'Calibri', 'Arial', sans-serif";
    }
  };

  const dynamicStyles = {
      page: {
        fontFamily: getCssFont(style.fontFamily),
        lineHeight: style.lineHeight,
        color: "#000000",
        fontSize: `${baseSize}pt`,
      },
      h1: {
          fontSize: `${baseSize + 14}pt`, // approx 24pt if base is 10
          fontWeight: "bold",
          marginBottom: `${baseSize * 0.4}pt`,
          color: style.templateId === 'minimal' ? '#000' : style.themeColor,
          textAlign: (style.templateId === 'modern' || style.templateId === 'minimal') ? 'left' as const : 'center' as const,
      },
      headerMeta: {
          fontSize: `${baseSize}pt`,
          color: "#000000",
          textAlign: (style.templateId === 'modern' || style.templateId === 'minimal') ? 'left' as const : 'center' as const,
          paddingBottom: style.templateId === 'minimal' ? '12pt' : '0',
          borderBottom: style.templateId === 'minimal' ? '1pt solid #000' : 'none',
          marginBottom: `${baseSize * 1.5}pt`
      },
      sectionTitle: {
          fontSize: `${baseSize + 3.5}pt`, // approx 14pt
          fontWeight: "bold",
          color: style.templateId === 'minimal' ? '#000' : style.themeColor,
          borderBottom: style.templateId === 'minimal' ? 'none' : `1pt solid ${style.templateId === 'modern' ? style.themeColor : '#E0E0E0'}`,
          paddingBottom: "2pt",
          marginTop: `${baseSize * 1.4}pt`,
          marginBottom: `${baseSize * 0.6}pt`,
          textTransform: style.templateId === 'minimal' ? 'uppercase' as const : 'none' as const
      },
      itemTitle: {
          fontSize: `${baseSize + 0.5}pt`, // Slightly larger than body
          fontWeight: "bold",
      },
      itemDate: {
          fontSize: `${baseSize - 0.5}pt`,
          color: "#666666",
      },
      itemSubtitle: {
           fontSize: `${baseSize}pt`,
           fontStyle: "italic",
           marginBottom: "2pt"
      },
      itemBody: {
          fontSize: `${baseSize}pt`,
          textAlign: "justify" as const,
          whiteSpace: "pre-wrap" as const,
          marginBottom: `${style.paragraphSpacing}pt`
      }
  };

  const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 style={dynamicStyles.sectionTitle}>
      {children}
    </h3>
  );

  const ItemRow: React.FC<{ title: string; date?: string }> = ({ title, date }) => (
      <div className="flex justify-between items-baseline">
        <span style={dynamicStyles.itemTitle}>{title}</span>
        {date && <span style={dynamicStyles.itemDate}>{date}</span>}
      </div>
  );

  return (
    <div
      className="origin-top transition-transform duration-200"
      style={{ transform: `scale(${scale})` }}
    >
      <div id="resume-preview-content" className="a4-paper" style={dynamicStyles.page}>
        {/* Header (Always First) */}
        <header>
          <h1 style={dynamicStyles.h1}>{profile.name || "您的姓名"}</h1>
          <div style={dynamicStyles.headerMeta} className={`flex gap-1 flex-wrap ${(style.templateId === 'modern' || style.templateId === 'minimal') ? '' : 'justify-center'}`}>
            {profile.title && <span>{profile.title}</span>}
            {profile.title && (profile.phone || profile.email) && <span> | </span>}
            {profile.phone && <span>{profile.phone}</span>}
            {profile.phone && profile.email && <span> | </span>}
            {profile.email && <span>{profile.email}</span>}
            {profile.email && profile.location && <span> | </span>}
            {profile.location && <span>{profile.location}</span>}
          </div>
        </header>

        {/* Summary (Always Second) */}
        {profile.summary && (
          <section>
            <SectionTitle>个人简介</SectionTitle>
            <p style={dynamicStyles.itemBody}>
              <RichTextRenderer text={profile.summary} themeColor={style.themeColor} />
            </p>
          </section>
        )}

        {/* Dynamic Sections Loop */}
        {data.sectionOrder.map(config => {
            if (!config.visible) return null;

            if (config.type === 'education' && data.education.length > 0) {
                return (
                    <section key={config.id}>
                        <SectionTitle>{config.name || "教育背景"}</SectionTitle>
                        <div>
                        {data.education.map((edu) => (
                            <div key={edu.id}>
                            <ItemRow title={edu.school || "学校名称"} date={`${edu.startDate} - ${edu.endDate}`} />
                            {edu.degree && <div style={dynamicStyles.itemSubtitle}>{edu.degree}</div>}
                            {edu.description && <p style={dynamicStyles.itemBody}><RichTextRenderer text={edu.description} themeColor={style.themeColor} /></p>}
                            </div>
                        ))}
                        </div>
                    </section>
                );
            }

            if (config.type === 'experience' && data.experience.length > 0) {
                return (
                    <section key={config.id}>
                        <SectionTitle>{config.name || "工作经历"}</SectionTitle>
                        <div>
                        {data.experience.map((exp) => (
                            <div key={exp.id}>
                            <ItemRow title={exp.company || "公司名称"} date={`${exp.startDate} - ${exp.endDate}`} />
                            {exp.position && <div style={dynamicStyles.itemSubtitle}>{exp.position}</div>}
                            {exp.description && <p style={dynamicStyles.itemBody}><RichTextRenderer text={exp.description} themeColor={style.themeColor} /></p>}
                            </div>
                        ))}
                        </div>
                    </section>
                );
            }

            if (config.type === 'projects' && data.projects.length > 0) {
                 return (
                    <section key={config.id}>
                        <SectionTitle>{config.name || "项目经验"}</SectionTitle>
                        <div>
                        {data.projects.map((proj) => (
                            <div key={proj.id}>
                            <ItemRow title={proj.name || "项目名称"} date={`${proj.startDate} - ${proj.endDate}`} />
                            {proj.role && <div style={dynamicStyles.itemSubtitle}>{proj.role}</div>}
                            {proj.description && <p style={dynamicStyles.itemBody}><RichTextRenderer text={proj.description} themeColor={style.themeColor} /></p>}
                            </div>
                        ))}
                        </div>
                    </section>
                );
            }

            if (config.type === 'custom') {
                const section = data.customSections.find(s => s.id === config.id);
                if (!section || section.items.length === 0) return null;

                return (
                    <section key={section.id}>
                        <SectionTitle>{section.title}</SectionTitle>
                        <div>
                            {section.items.map(item => (
                                <div key={item.id}>
                                    <ItemRow title={item.title} date={item.date} />
                                    {item.subtitle && <div style={dynamicStyles.itemSubtitle}>{item.subtitle}</div>}
                                    {item.description && <p style={dynamicStyles.itemBody}><RichTextRenderer text={item.description} themeColor={style.themeColor} /></p>}
                                </div>
                            ))}
                        </div>
                    </section>
                );
            }

            return null;
        })}
      </div>
    </div>
  );
};

export default ResumePreview;
