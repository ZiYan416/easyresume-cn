
import React, { useState, useRef, useLayoutEffect, useMemo } from 'react';
import { ResumeData } from '../types';

interface ResumePreviewProps {
  data: ResumeData;
  scale: number;
}

// Helper to parse simple custom tags like <b>, <i>, <c>
const RichTextRenderer: React.FC<{ text: string; themeColor: string }> = ({ text, themeColor }) => {
    if (!text) return null;
    
    // Split by tags
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
        // NOTE: For pagination to work linearly, we move padding to inner blocks or measuring logic
        // But to maintain visual consistency, we render pages with this padding.
        // Special case: 'curve' has 0 container padding.
        padding: style.templateId === 'curve' ? 0 : `${style.pagePadding || 20}mm`,
      },
      h1: {
          fontSize: `${baseSize + 14}pt`,
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
          fontSize: `${baseSize + 3.5}pt`, 
          fontWeight: "bold",
          color: style.templateId === 'minimal' ? '#000' : style.themeColor,
          borderBottom: style.templateId === 'minimal' ? 'none' : `1pt solid ${style.templateId === 'modern' ? style.themeColor : '#E0E0E0'}`,
          paddingBottom: "2pt",
          marginTop: `${baseSize * 1.4}pt`,
          marginBottom: `${baseSize * 0.6}pt`,
          textTransform: style.templateId === 'minimal' ? 'uppercase' as const : 'none' as const
      },
      itemTitle: {
          fontSize: `${baseSize + 0.5}pt`, 
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
      },
      // Curve Template Styles
      curveHeader: {
        position: 'relative' as const, 
        backgroundColor: style.themeColor, 
        height: '140px', 
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: `${style.pagePadding || 20}mm`,
        paddingRight: `${style.pagePadding || 20}mm`,
        borderBottomLeftRadius: '10px',
        borderBottomRightRadius: '50% 30px',
        marginBottom: '20px'
      },
      curveSectionTitle: {
        fontWeight: "bold",
        backgroundColor: style.themeColor, 
        color: '#fff', 
        borderRadius: '20px', 
        padding: '4px 15px', 
        display: 'inline-block', 
        marginBottom: '12pt', 
        marginTop: '16pt', 
        fontSize: `${baseSize + 2}pt`
      }
  };

  // --- 1. Content Generation (Linear Blocks) ---
  
  const blocks = useMemo(() => {
    const blockList: { id: string, content: React.ReactNode }[] = [];
    const paddingVal = `${style.pagePadding || 20}mm`;

    // --- Header Block ---
    if (style.templateId === 'curve') {
        const gridItems = [
            { label: '姓名', value: profile.name },
            { label: '年龄', value: profile.birthYear ? `${new Date().getFullYear() - parseInt(profile.birthYear)}岁` : null },
            { label: '性别', value: profile.gender },
            { label: '籍贯', value: profile.nativePlace },
            { label: '经验', value: profile.workYears },
            { label: '求职', value: profile.title },
            { label: '电话', value: profile.phone },
            { label: '邮箱', value: profile.email },
            { label: '薪资', value: profile.salary },
            { label: '状态', value: profile.jobStatus },
            { label: '身高', value: profile.height ? `${profile.height}cm` : null },
            { label: '体重', value: profile.weight ? `${profile.weight}kg` : null },
            { label: '面貌', value: profile.politicalStatus },
        ].filter(item => item.value && item.value.trim() !== '');

        // Block 1: The Curve Header
        blockList.push({
            id: 'curve-header',
            content: (
                <div style={dynamicStyles.curveHeader}>
                     <div style={{ color: '#fff' }}>
                         <h1 style={{ fontSize: '28pt', fontWeight: 'bold', margin: 0, lineHeight: 1 }}>个人简历</h1>
                         <div style={{ fontSize: '10pt', opacity: 0.9, marginTop: '5px', letterSpacing: '1px' }}>PERSONAL RESUME | 我一直在努力成为更好的自己</div>
                     </div>
                </div>
            )
        });

        // Block 2: Profile Grid
        blockList.push({
            id: 'curve-profile',
            content: (
                <div style={{ padding: `0 ${paddingVal}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20pt', backgroundColor: '#f9fafb', padding: '15pt', borderRadius: '8px' }}>
                        <div style={{ flex: 1 }}>
                             <div style={{ marginBottom: '10pt', color: style.themeColor, fontWeight: 'bold', fontSize: `${baseSize + 4}pt`, borderLeft: `4px solid ${style.themeColor}`, paddingLeft: '8px' }}>基本信息</div>
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8pt', fontSize: `${baseSize}pt` }}>
                                 {gridItems.map((item, index) => (
                                     <div key={index}>
                                         <span style={{color: '#666'}}>{item.label}：</span>
                                         {item.value}
                                     </div>
                                 ))}
                             </div>
                        </div>
                        {profile.showAvatar && profile.avatar && (
                             <div style={{ marginLeft: '20pt' }}>
                                 <img src={profile.avatar} style={{ width: '90px', height: '110px', objectFit: 'cover', border: `3px solid white`, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} alt="Avatar" />
                             </div>
                        )}
                     </div>
                </div>
            )
        });

    } else {
        // Standard Header
        // Helper to join non-empty strings
        const joinMeta = (parts: (string | undefined)[], sep = " | ") => parts.filter(Boolean).join(sep);
        const metaLines = [];
        const line1 = joinMeta([profile.title, profile.salary, profile.jobStatus]);
        if (line1) metaLines.push(line1);
        const age = profile.birthYear ? `${new Date().getFullYear() - parseInt(profile.birthYear)}岁` : undefined;
        const line2 = joinMeta([profile.gender, age, profile.workYears, profile.location, profile.nativePlace, profile.politicalStatus]);
        if (line2) metaLines.push(line2);
        const line3 = joinMeta([profile.phone, profile.email]);
        if (line3) metaLines.push(line3);
        const line4 = joinMeta([profile.height ? `${profile.height}cm` : undefined, profile.weight ? `${profile.weight}kg` : undefined]);
        if (line4) metaLines.push(line4);

        blockList.push({
            id: 'standard-header',
            content: (
                <div>
                     {profile.showAvatar && profile.avatar ? (
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
                                    {metaLines.map((line, idx) => <div key={idx} style={{ marginBottom: '2pt' }}>{line}</div>)}
                                </div>
                            </div>
                            <div style={{ width: '100pt', marginLeft: '20pt', flexShrink: 0 }}>
                                <img src={profile.avatar} style={{ width: '100%', height: 'auto', maxHeight: '130pt', objectFit: 'cover', borderRadius: '4pt' }} alt="Profile" />
                            </div>
                        </div>
                    ) : (
                        <header>
                            <h1 style={dynamicStyles.h1}>{profile.name || "您的姓名"}</h1>
                            <div style={dynamicStyles.headerMeta}>
                                {metaLines.map((line, idx) => <div key={idx} style={{ marginBottom: '2pt' }}>{line}</div>)}
                            </div>
                        </header>
                    )}
                </div>
            )
        });
    }

    // --- Summary Block ---
    if (profile.summary) {
        blockList.push({
            id: 'summary-title',
            content: (
                 <div style={style.templateId === 'curve' ? { padding: `0 ${paddingVal}` } : {}}>
                    {style.templateId === 'curve' ? 
                       <h3 style={dynamicStyles.curveSectionTitle}>个人简介</h3> 
                       : <h3 style={dynamicStyles.sectionTitle}>个人简介</h3>
                    }
                 </div>
            )
        });
        blockList.push({
            id: 'summary-body',
            content: (
                <div style={style.templateId === 'curve' ? { padding: `0 ${paddingVal}` } : {}}>
                    <p style={dynamicStyles.itemBody}><RichTextRenderer text={profile.summary} themeColor={style.themeColor} /></p>
                </div>
            )
        });
    }

    // --- Sections Loop ---
    data.sectionOrder.forEach(config => {
        if (!config.visible) return;

        let items: any[] = [];
        let name = "";
        let fields: { id: string, title: string, date: string, subtitle?: string, desc?: string }[] = [];

        if (config.type === 'education') {
            items = data.education;
            name = config.name || "教育背景";
            fields = items.map(i => ({ id: i.id, title: i.school, date: `${i.startDate} - ${i.endDate}`, subtitle: i.degree, desc: i.description }));
        } else if (config.type === 'experience') {
            items = data.experience;
            name = config.name || "工作经历";
            fields = items.map(i => ({ id: i.id, title: i.company, date: `${i.startDate} - ${i.endDate}`, subtitle: i.position, desc: i.description }));
        } else if (config.type === 'internships') {
            items = data.internships;
            name = config.name || "实习经历";
            fields = items.map(i => ({ id: i.id, title: i.company, date: `${i.startDate} - ${i.endDate}`, subtitle: i.position, desc: i.description }));
        } else if (config.type === 'campus') {
            items = data.campus;
            name = config.name || "校园经历";
            fields = items.map(i => ({ id: i.id, title: i.company, date: `${i.startDate} - ${i.endDate}`, subtitle: i.position, desc: i.description }));
        } else if (config.type === 'projects') {
            items = data.projects;
            name = config.name || "项目经验";
            fields = items.map(i => ({ id: i.id, title: i.name, date: `${i.startDate} - ${i.endDate}`, subtitle: i.role, desc: i.description }));
        } else if (config.type === 'custom') {
            const s = data.customSections.find(s => s.id === config.id);
            if (s && s.items.length > 0) {
                name = s.title;
                fields = s.items.map(i => ({ id: i.id, title: i.title, date: i.date, subtitle: i.subtitle, desc: i.description }));
            }
        }

        if (fields.length > 0) {
            // Push Title Block
            blockList.push({
                id: `sec-title-${config.id}`,
                content: (
                     <div style={style.templateId === 'curve' ? { padding: `0 ${paddingVal}` } : {}}>
                        {style.templateId === 'curve' ? 
                           <h3 style={dynamicStyles.curveSectionTitle}>{name}</h3> 
                           : <h3 style={dynamicStyles.sectionTitle}>{name}</h3>
                        }
                     </div>
                )
            });

            // Push Items Blocks
            fields.forEach((f) => {
                blockList.push({
                    id: `item-${f.id}`,
                    content: (
                        <div style={style.templateId === 'curve' ? { padding: `0 ${paddingVal}` } : {}}>
                            <div className="flex justify-between items-baseline">
                                <span style={dynamicStyles.itemTitle}>{f.title}</span>
                                {f.date && <span style={dynamicStyles.itemDate}>{f.date}</span>}
                            </div>
                            {f.subtitle && <div style={dynamicStyles.itemSubtitle}>{f.subtitle}</div>}
                            {f.desc && <p style={dynamicStyles.itemBody}><RichTextRenderer text={f.desc} themeColor={style.themeColor} /></p>}
                        </div>
                    )
                });
            });
        }
    });

    return blockList;
  }, [data, style]);


  // --- 2. Pagination Measurement ---
  
  const [pageBreaks, setPageBreaks] = useState<number[]>([]);
  const measureRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
      if (!measureRef.current) return;
      
      const container = measureRef.current;
      const elements = Array.from(container.children) as HTMLElement[];
      const pageHeight = 1120; // Slightly less than 1123 for safety
      
      // Calculate effective height for content per page
      // For standard: content must fit in 1120 - padding * 2
      // For curve: container padding is 0, but content has built-in padding. 
      // The measuring blocks capture height + margins.
      // So we just check against full pageHeight for 'curve', or pageHeight - padding*2 for standard?
      // Actually, since we render 'standard' pages with padding on the wrapper, the content flows inside.
      // The measured blocks don't include that wrapper padding.
      
      let limit = pageHeight;
      if (style.templateId !== 'curve') {
          const p = (style.pagePadding || 20) * 3.78;
          limit = pageHeight - (p * 2);
      } else {
          // For curve, the wrapper is 0 padding. 
          // Header block is full width.
          // Body blocks have internal padding but that affects width, not height constraints (mostly).
          limit = pageHeight;
      }

      const breaks = [0];
      let currentH = 0;
      
      elements.forEach((el, index) => {
          const h = el.offsetHeight;
          const style = getComputedStyle(el);
          const mt = parseFloat(style.marginTop);
          const mb = parseFloat(style.marginBottom);
          const total = h + mt + mb;

          // If a single block is huge (larger than page), it will just overflow (basic handling)
          // Otherwise, check if it fits
          if (currentH + total > limit && currentH > 0) {
              breaks.push(index);
              currentH = 0;
          }
          currentH += total;
      });

      // Avoid infinite loops or unnecessary updates
      const newBreaksJson = JSON.stringify(breaks);
      setPageBreaks(prev => {
          if (JSON.stringify(prev) !== newBreaksJson) return breaks;
          return prev;
      });

  }, [blocks, scale, style]);

  // --- 3. Render Pages ---
  const renderPages = () => {
      // Determine ranges
      const pages = [];
      for (let i = 0; i < pageBreaks.length; i++) {
          const start = pageBreaks[i];
          const end = pageBreaks[i + 1] !== undefined ? pageBreaks[i + 1] : blocks.length;
          pages.push(blocks.slice(start, end));
      }

      return pages.map((pageBlocks, pageIndex) => (
          <div 
            key={pageIndex} 
            className="a4-paper preview-page" 
            style={{ 
                ...dynamicStyles.page, 
                minHeight: '297mm', // Enforce A4 height visual
                height: '297mm',
                marginBottom: '20px',
                position: 'relative',
                overflow: 'hidden' // Crop overflow if any
            }}
          >
              {pageBlocks.map(block => (
                  <React.Fragment key={block.id}>
                      {block.content}
                  </React.Fragment>
              ))}
          </div>
      ));
  };


  return (
    <div
      className="origin-top transition-transform duration-200"
      style={{ transform: `scale(${scale})` }}
    >
        {/* Visible Pages */}
        {renderPages()}

        {/* Hidden Measurement Container */}
        <div 
            ref={measureRef} 
            style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '210mm', 
                visibility: 'hidden', 
                pointerEvents: 'none',
                // Important: Match padding logic of the real page to get accurate widths -> heights
                padding: style.templateId === 'curve' ? 0 : `${style.pagePadding || 20}mm`
            }}
        >
            {blocks.map(block => (
                <div key={block.id}>
                    {block.content}
                </div>
            ))}
        </div>
    </div>
  );
};

export default ResumePreview;
