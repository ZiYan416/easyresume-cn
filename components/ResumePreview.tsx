
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
        padding: `${style.pagePadding || 20}mm`,
      },
      h1: {
          fontSize: `${baseSize + 14}pt`, // approx 24pt if base is 10
          fontWeight: "bold",
          marginBottom: `${baseSize * 0.4}pt`,
          color: style.templateId === 'minimal' ? '#000' : style.themeColor,
          textAlign: (profile.showAvatar && profile.avatar) ? 'left' as const : ((style.templateId === 'modern' || style.templateId === 'minimal') ? 'left' as const : 'center' as const),
      },
      headerMeta: {
          fontSize: `${baseSize}pt`,
          color: "#000000",
          textAlign: (profile.showAvatar && profile.avatar) ? 'left' as const : ((style.templateId === 'modern' || style.templateId === 'minimal') ? 'left' as const : 'center' as const),
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

  // Helper to join non-empty strings with separator
  const joinMeta = (parts: (string | undefined)[], sep = " | ") => parts.filter(Boolean).join(sep);
  
  // Logic to build metadata lines
  const metaLines = [];
  
  // Line 1: Job Title | Salary | Status
  const line1 = joinMeta([profile.title, profile.salary, profile.jobStatus]);
  if (line1) metaLines.push(line1);

  // Line 2: Gender | Age | Years | Location | Origin
  const age = profile.birthYear ? `${new Date().getFullYear() - parseInt(profile.birthYear)}岁` : undefined;
  const line2 = joinMeta([profile.gender, age, profile.workYears, profile.location, profile.nativePlace, profile.politicalStatus]);
  if (line2) metaLines.push(line2);

  // Line 3: Contact
  const line3 = joinMeta([profile.phone, profile.email]);
  if (line3) metaLines.push(line3);

  // Extra line for Height/Weight if needed
  const line4 = joinMeta([profile.height ? `${profile.height}cm` : undefined, profile.weight ? `${profile.weight}kg` : undefined]);
  if (line4) metaLines.push(line4);


  const renderHeader = () => {
      const textAlign = dynamicStyles.headerMeta.textAlign;
      
      const MetaContent = () => (
          <>
            {metaLines.map((line, idx) => (
                <div key={idx} style={{ marginBottom: '2pt' }}>{line}</div>
            ))}
          </>
      );

      if (profile.showAvatar && profile.avatar) {
          return (
              <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: dynamicStyles.headerMeta.marginBottom,
                  paddingBottom: dynamicStyles.headerMeta.paddingBottom,
                  borderBottom: dynamicStyles.headerMeta.borderBottom
              }}>
                  <div style={{ flex: 1 }}>
                      <h1 style={{ ...dynamicStyles.h1, textAlign: 'left', marginBottom: '8pt' }}>{profile.name || "您的姓名"}</h1>
                      <div style={{ fontSize: dynamicStyles.headerMeta.fontSize, color: "#000", textAlign: 'left' }}>
                          <MetaContent />
                      </div>
                  </div>
                  <div style={{ width: '100pt', marginLeft: '20pt', flexShrink: 0 }}>
                      <img 
                        src={profile.avatar} 
                        style={{ width: '100%', height: 'auto', maxHeight: '130pt', objectFit: 'cover', borderRadius: '4pt' }} 
                        alt="Profile" 
                      />
                  </div>
              </div>
          );
      }

      return (
          <header>
            <h1 style={dynamicStyles.h1}>{profile.name || "您的姓名"}</h1>
            <div style={dynamicStyles.headerMeta}>
              <MetaContent />
            </div>
          </header>
      );
  };


  return (
    <div
      className="origin-top transition-transform duration-200"
      style={{ transform: `scale(${scale})` }}
    >
      <div id="resume-preview-content" className="a4-paper" style={dynamicStyles.page}>
        
        {renderHeader()}

        {/* Summary */}
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

            // Generalize standard sections render logic
            let items: any[] = [];
            let name = "";
            let fields: { title: string, date: string, subtitle?: string, desc?: string }[] = [];

            if (config.type === 'education') {
                items = data.education;
                name = config.name || "教育背景";
                fields = items.map(i => ({ title: i.school, date: `${i.startDate} - ${i.endDate}`, subtitle: i.degree, desc: i.description }));
            } else if (config.type === 'experience') {
                items = data.experience;
                name = config.name || "工作经历";
                fields = items.map(i => ({ title: i.company, date: `${i.startDate} - ${i.endDate}`, subtitle: i.position, desc: i.description }));
            } else if (config.type === 'internships') {
                items = data.internships;
                name = config.name || "实习经历";
                fields = items.map(i => ({ title: i.company, date: `${i.startDate} - ${i.endDate}`, subtitle: i.position, desc: i.description }));
            } else if (config.type === 'campus') {
                items = data.campus;
                name = config.name || "校园经历";
                fields = items.map(i => ({ title: i.company, date: `${i.startDate} - ${i.endDate}`, subtitle: i.position, desc: i.description }));
            } else if (config.type === 'projects') {
                items = data.projects;
                name = config.name || "项目经验";
                fields = items.map(i => ({ title: i.name, date: `${i.startDate} - ${i.endDate}`, subtitle: i.role, desc: i.description }));
            } else if (config.type === 'custom') {
                const s = data.customSections.find(s => s.id === config.id);
                if (!s || s.items.length === 0) return null;
                return (
                    <section key={s.id}>
                        <SectionTitle>{s.title}</SectionTitle>
                        <div>
                            {s.items.map(item => (
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

            if (items.length > 0) {
                return (
                    <section key={config.id}>
                        <SectionTitle>{name}</SectionTitle>
                        <div>
                            {fields.map((f, idx) => (
                                <div key={idx}>
                                    <ItemRow title={f.title || ""} date={f.date} />
                                    {f.subtitle && <div style={dynamicStyles.itemSubtitle}>{f.subtitle}</div>}
                                    {f.desc && <p style={dynamicStyles.itemBody}><RichTextRenderer text={f.desc} themeColor={style.themeColor} /></p>}
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