
import { ResumeData, ResumeStyle } from '../types';

// Helper to get font name
const getFontName = (font: string) => {
    switch(font) {
        case 'Microsoft YaHei': return 'Microsoft YaHei';
        case 'SimSun': return 'SimSun';
        case 'KaiTi': return 'KaiTi';
        case 'Roboto': return 'Roboto';
        default: return 'Calibri';
    }
};

// Common constants wrapper
const getStyleConstants = (style: ResumeStyle) => {
    const baseSizePt = style.fontSize || 10.5;
    
    return {
        MAIN_FONT: getFontName(style.fontFamily),
        THEME_COLOR: style.themeColor.replace('#', ''),
        TEXT_COLOR: "000000",
        SUBTITLE_COLOR: "666666",
        LINE_SPACING_VAL: Math.floor(style.lineHeight * 240),
        PARA_SPACING_AFTER: Math.floor(style.paragraphSpacing * 20),
        // Sizes in half-points
        sizeNormal: baseSizePt * 2,
        sizeH1: (baseSizePt + 14) * 2,
        sizeH2: (baseSizePt + 3.5) * 2,
        sizeMeta: baseSizePt * 2,
        sizeDate: (baseSizePt - 0.5) * 2,
        sizeItemTitle: (baseSizePt + 0.5) * 2,
    };
};

// Rich Text Parser Helper
const createRichTextRuns = (text: string, baseRunStyle: any, MAIN_FONT: string, THEME_COLOR: string) => {
    const { docx } = window;
    const { TextRun } = docx;

    if (!text) return [];
    
    const parts = text.split(/(<\/?(?:b|i|c)>)/g);
    let isBold = baseRunStyle.bold || false;
    let isItalic = baseRunStyle.italics || false;
    let isColor = false;

    const runs = [];

    for (const part of parts) {
        if (part === '<b>') { isBold = true; continue; }
        if (part === '</b>') { isBold = false; continue; }
        if (part === '<i>') { isItalic = true; continue; }
        if (part === '</i>') { isItalic = false; continue; }
        if (part === '<c>') { isColor = true; continue; }
        if (part === '</c>') { isColor = false; continue; }
        
        if (!part) continue;

        runs.push(new TextRun({
            text: part,
            font: MAIN_FONT,
            size: baseRunStyle.size,
            bold: isBold,
            italics: isItalic,
            color: isColor ? THEME_COLOR : (baseRunStyle.color || baseRunStyle.baseColor || "000000")
        }));
    }
    return runs;
};

/**
 * Strategy 1: Standard Flow Export
 * Uses Mix of Paragraphs and Tables. Good for ATS.
 */
export const generateDocx = async (data: ResumeData) => {
  const { docx, saveAs } = window;
  if (!docx) { alert("组件加载中..."); return; }

  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = docx;

  const style = data.style;
  const C = getStyleConstants(style);

  // --- Helpers ---
  const createBodyParagraph = (text: string, options?: { isItalic?: boolean, isSubtitle?: boolean }) => {
      const isItalic = options?.isItalic || false;
      return new Paragraph({
        children: createRichTextRuns(
            text, 
            { size: C.sizeNormal, italics: isItalic, color: C.TEXT_COLOR }, 
            C.MAIN_FONT, 
            C.THEME_COLOR
        ),
        spacing: { 
            after: options?.isSubtitle ? 40 : C.PARA_SPACING_AFTER, 
            line: C.LINE_SPACING_VAL, 
            lineRule: "auto" 
        },
        alignment: AlignmentType.JUSTIFIED, 
      });
  };

  const createItemRow = (title: string, date: string) => {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE } },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ 
                  children: [new TextRun({ text: title, font: C.MAIN_FONT, bold: true, size: C.sizeItemTitle, color: C.TEXT_COLOR })],
                  spacing: { line: C.LINE_SPACING_VAL, lineRule: "auto" }
              })],
              width: { size: 75, type: WidthType.PERCENTAGE },
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
            }),
            new TableCell({
              children: date ? [new Paragraph({ 
                  alignment: AlignmentType.RIGHT, 
                  children: [new TextRun({ text: date, font: C.MAIN_FONT, size: C.sizeDate, color: C.SUBTITLE_COLOR })],
                  spacing: { line: C.LINE_SPACING_VAL, lineRule: "auto" }
              })] : [],
              width: { size: 25, type: WidthType.PERCENTAGE },
              verticalAlign: "center",
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
            }),
          ],
        }),
      ],
    });
  };

  const createSectionTitle = (text: string) => {
      let borderConfig = undefined;
      if (style.templateId === 'modern') {
          borderConfig = { bottom: { color: C.THEME_COLOR, space: 1, style: BorderStyle.SINGLE, size: 6 } };
      } else if (style.templateId === 'classic') {
           borderConfig = { bottom: { color: "E0E0E0", space: 1, style: BorderStyle.SINGLE, size: 6 } };
      }

      return new Paragraph({
        children: [
            new TextRun({
                text: style.templateId === 'minimal' ? text.toUpperCase() : text,
                font: C.MAIN_FONT,
                bold: true,
                size: C.sizeH2,
                color: style.templateId === 'minimal' ? C.TEXT_COLOR : C.THEME_COLOR,
            })
        ],
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.LEFT,
        border: borderConfig,
        spacing: { 
            before: Math.floor(style.fontSize * 1.4 * 20), 
            after: Math.floor(style.fontSize * 0.6 * 20),  
            line: C.LINE_SPACING_VAL, 
            lineRule: "auto" 
        },
      });
  };

  // --- Assembly ---
  const blocks: any[] = [];
  
  // Header
  blocks.push(new Paragraph({
      children: [new TextRun({ text: data.profile.name, font: C.MAIN_FONT, bold: true, size: C.sizeH1, color: style.templateId === 'minimal' ? C.TEXT_COLOR : C.THEME_COLOR })],
      heading: HeadingLevel.HEADING_1,
      alignment: (style.templateId === 'modern' || style.templateId === 'minimal') ? AlignmentType.LEFT : AlignmentType.CENTER,
      spacing: { after: Math.floor(style.fontSize * 0.4 * 20), line: C.LINE_SPACING_VAL, lineRule: "auto" },
  }));

  // Meta
  const metaParts = [];
  const sep = " | ";
  const addMeta = (t: string, isSep = false) => metaParts.push(new TextRun({ text: t, font: C.MAIN_FONT, size: C.sizeMeta, color: "000000" }));
  if (data.profile.title) addMeta(data.profile.title);
  if (data.profile.title && (data.profile.phone || data.profile.email)) addMeta(sep, true);
  if (data.profile.phone) addMeta(data.profile.phone);
  if (data.profile.phone && data.profile.email) addMeta(sep, true);
  if (data.profile.email) addMeta(data.profile.email);
  if (data.profile.email && data.profile.location) addMeta(sep, true);
  if (data.profile.location) addMeta(data.profile.location);

  blocks.push(new Paragraph({
      alignment: (style.templateId === 'modern' || style.templateId === 'minimal') ? AlignmentType.LEFT : AlignmentType.CENTER,
      children: metaParts,
      spacing: { after: Math.floor(style.fontSize * 1.5 * 20), line: C.LINE_SPACING_VAL, lineRule: "auto" },
      border: style.templateId === 'minimal' ? { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 12 } } : undefined
  }));

  // Summary
  if (data.profile.summary) {
      blocks.push(createSectionTitle("个人简介"));
      blocks.push(createBodyParagraph(data.profile.summary));
  }

  // Dynamic Sections
  data.sectionOrder.forEach(config => {
      if (!config.visible) return;
      
      const processItems = (title: string, items: any[], mapFn: (i: any) => any[]) => {
          if (items.length === 0) return;
          blocks.push(createSectionTitle(title));
          items.forEach(item => blocks.push(...mapFn(item)));
      };

      if (config.type === 'education') {
          processItems(config.name || "教育背景", data.education, (edu) => [
              createItemRow(edu.school, `${edu.startDate} - ${edu.endDate}`),
              edu.degree ? createBodyParagraph(edu.degree, { isSubtitle: true, isItalic: true }) : null,
              edu.description ? createBodyParagraph(edu.description) : new Paragraph({ spacing: { after: C.PARA_SPACING_AFTER } })
          ].filter(Boolean));
      } else if (config.type === 'experience') {
           processItems(config.name || "工作经历", data.experience, (exp) => [
              createItemRow(exp.company, `${exp.startDate} - ${exp.endDate}`),
              exp.position ? createBodyParagraph(exp.position, { isSubtitle: true, isItalic: true }) : null,
              exp.description ? createBodyParagraph(exp.description) : new Paragraph({ spacing: { after: C.PARA_SPACING_AFTER } })
          ].filter(Boolean));
      } else if (config.type === 'projects') {
           processItems(config.name || "项目经验", data.projects, (proj) => [
              createItemRow(proj.name, `${proj.startDate} - ${proj.endDate}`),
              proj.role ? createBodyParagraph(proj.role, { isSubtitle: true, isItalic: true }) : null,
              proj.description ? createBodyParagraph(proj.description) : new Paragraph({ spacing: { after: C.PARA_SPACING_AFTER } })
          ].filter(Boolean));
      } else if (config.type === 'custom') {
          const s = data.customSections.find(cs => cs.id === config.id);
          if (s) {
              processItems(s.title, s.items, (item) => [
                  item.date ? createItemRow(item.title, item.date) : new Paragraph({ children: [new TextRun({ text: item.title, font: C.MAIN_FONT, bold: true, size: C.sizeItemTitle, color: C.TEXT_COLOR })], spacing: { line: C.LINE_SPACING_VAL } }),
                  item.subtitle ? createBodyParagraph(item.subtitle, { isSubtitle: true, isItalic: true }) : null,
                  item.description ? createBodyParagraph(item.description) : new Paragraph({ spacing: { after: C.PARA_SPACING_AFTER } })
              ].filter(Boolean));
          }
      }
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: C.MAIN_FONT, color: C.TEXT_COLOR, size: C.sizeNormal }, paragraph: { spacing: { line: C.LINE_SPACING_VAL } } } } },
    sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: blocks }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${data.profile.name || 'resume'}_cv.docx`);
};


/**
 * Strategy 2: Block/Table Mode Export
 * Wraps EVERYTHING in Tables to act as "Text Boxes".
 * Precise layout, Editable text, robust against alignment issues.
 */
export const generateBlockDocx = async (data: ResumeData) => {
    const { docx, saveAs } = window;
    if (!docx) { alert("组件加载中..."); return; }
  
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, HeadingLevel } = docx;
  
    const style = data.style;
    const C = getStyleConstants(style);
  
    // --- Block Helpers ---
    
    // Create a generic container table row (no border)
    const createBlockRow = (children: any[]) => {
        return new TableRow({
            children: [
                new TableCell({
                    children: children,
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    margins: { top: 0, bottom: 0, left: 0, right: 0 }, // Strict 0 margin
                    width: { size: 100, type: WidthType.PERCENTAGE }
                })
            ]
        });
    };

    // Main wrapper table for a section (encapsulates logic)
    const createSectionBlock = (rows: any[]) => {
        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
            rows: rows,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
        });
    };

    // Precise Text Elements
    const createP = (text: string, size: number, bold = false, italic = false, color = C.TEXT_COLOR, align = AlignmentType.LEFT, spacingAfter = 0) => {
        return new Paragraph({
            children: createRichTextRuns(text, { size, bold, italics: italic, color }, C.MAIN_FONT, C.THEME_COLOR),
            alignment: align,
            spacing: { after: spacingAfter, line: C.LINE_SPACING_VAL, lineRule: "auto" }
        });
    };

    // Header Block
    const headerRows = [];
    const hAlign = (style.templateId === 'modern' || style.templateId === 'minimal') ? AlignmentType.LEFT : AlignmentType.CENTER;
    
    // Name
    headerRows.push(createBlockRow([
        createP(data.profile.name, C.sizeH1, true, false, style.templateId === 'minimal' ? C.TEXT_COLOR : C.THEME_COLOR, hAlign, Math.floor(style.fontSize * 0.4 * 20))
    ]));

    // Meta
    const metaParts = [];
    const sep = " | ";
    const addMeta = (t: string) => metaParts.push(new TextRun({ text: t, font: C.MAIN_FONT, size: C.sizeMeta, color: "000000" }));
    const addSep = () => metaParts.push(new TextRun({ text: sep, font: C.MAIN_FONT, size: C.sizeMeta, color: "000000" }));

    if (data.profile.title) { addMeta(data.profile.title); if(data.profile.phone||data.profile.email) addSep(); }
    if (data.profile.phone) { addMeta(data.profile.phone); if(data.profile.email) addSep(); }
    if (data.profile.email) { addMeta(data.profile.email); if(data.profile.location) addSep(); }
    if (data.profile.location) { addMeta(data.profile.location); }

    const metaP = new Paragraph({
        children: metaParts,
        alignment: hAlign,
        spacing: { after: Math.floor(style.fontSize * 1.5 * 20), line: C.LINE_SPACING_VAL },
        border: style.templateId === 'minimal' ? { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 12 } } : undefined
    });

    headerRows.push(createBlockRow([metaP]));

    // Section Title Generator
    const createTitleRow = (title: string) => {
        let borderConfig = undefined;
        if (style.templateId === 'modern') borderConfig = { bottom: { color: C.THEME_COLOR, space: 1, style: BorderStyle.SINGLE, size: 6 } };
        else if (style.templateId === 'classic') borderConfig = { bottom: { color: "E0E0E0", space: 1, style: BorderStyle.SINGLE, size: 6 } };
        
        const p = new Paragraph({
            children: [new TextRun({
                text: style.templateId === 'minimal' ? title.toUpperCase() : title,
                font: C.MAIN_FONT, bold: true, size: C.sizeH2,
                color: style.templateId === 'minimal' ? C.TEXT_COLOR : C.THEME_COLOR,
            })],
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.LEFT,
            border: borderConfig,
            spacing: { 
                before: Math.floor(style.fontSize * 1.4 * 20), 
                after: Math.floor(style.fontSize * 0.6 * 20),
                line: C.LINE_SPACING_VAL 
            }
        });
        return createBlockRow([p]);
    };

    // Item Generator (The "Text Box" magic)
    const createItemBlock = (title: string, date: string, subtitle: string, desc: string) => {
        const itemRows = [];
        
        // Row 1: Title (Left) + Date (Right) in a nested 2-col table
        const titleTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            rows: [new TableRow({
                children: [
                    new TableCell({
                        children: [createP(title, C.sizeItemTitle, true, false, C.TEXT_COLOR)],
                        width: { size: 75, type: WidthType.PERCENTAGE },
                        margins: { top: 0, bottom: 0, left: 0, right: 0 },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                    new TableCell({
                        children: [createP(date, C.sizeDate, false, false, C.SUBTITLE_COLOR, AlignmentType.RIGHT)],
                        width: { size: 25, type: WidthType.PERCENTAGE },
                        verticalAlign: "center",
                        margins: { top: 0, bottom: 0, left: 0, right: 0 },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    })
                ]
            })]
        });
        itemRows.push(createBlockRow([titleTable]));

        // Row 2: Subtitle
        if (subtitle) {
            itemRows.push(createBlockRow([createP(subtitle, C.sizeNormal, false, true, C.TEXT_COLOR, AlignmentType.LEFT, 40)]));
        }

        // Row 3: Desc
        if (desc) {
            itemRows.push(createBlockRow([createP(desc, C.sizeNormal, false, false, C.TEXT_COLOR, AlignmentType.JUSTIFIED, C.PARA_SPACING_AFTER)]));
        } else {
            // Spacer
            itemRows.push(createBlockRow([new Paragraph({ spacing: { after: C.PARA_SPACING_AFTER } })]));
        }

        return createSectionBlock(itemRows);
    };

    // --- Building the Doc Content ---
    const allContent = [];

    // 1. Header Block
    allContent.push(createSectionBlock(headerRows));

    // 2. Summary Block
    if (data.profile.summary) {
        allContent.push(createSectionBlock([
            createTitleRow("个人简介"),
            createBlockRow([createP(data.profile.summary, C.sizeNormal, false, false, C.TEXT_COLOR, AlignmentType.JUSTIFIED, C.PARA_SPACING_AFTER)])
        ]));
    }

    // 3. Dynamic Blocks
    data.sectionOrder.forEach(config => {
        if (!config.visible) return;
        
        // Wrapper for the whole section (Title + Items)
        const sectionRows = [];
        const sectionTitle = config.name || 
            (config.type === 'education' ? "教育背景" : 
             config.type === 'experience' ? "工作经历" : 
             config.type === 'projects' ? "项目经验" : "");

        // Find items
        let items: any[] = [];
        let renderItem: (i: any) => any = () => {};

        if (config.type === 'education') {
            items = data.education;
            renderItem = (e: any) => createItemBlock(e.school, `${e.startDate} - ${e.endDate}`, e.degree, e.description);
        } else if (config.type === 'experience') {
            items = data.experience;
            renderItem = (e: any) => createItemBlock(e.company, `${e.startDate} - ${e.endDate}`, e.position, e.description);
        } else if (config.type === 'projects') {
            items = data.projects;
            renderItem = (e: any) => createItemBlock(e.name, `${e.startDate} - ${e.endDate}`, e.role, e.description);
        } else if (config.type === 'custom') {
            const s = data.customSections.find(cs => cs.id === config.id);
            if (s) {
                items = s.items;
                // Custom logic: if no date, title is just bold text
                renderItem = (i: any) => {
                    if (!i.date) return createItemBlock(i.title, "", i.subtitle, i.description);
                    return createItemBlock(i.title, i.date, i.subtitle, i.description);
                };
                // Override title
                sectionRows.push(createTitleRow(s.title));
            }
        }

        if (config.type !== 'custom') sectionRows.push(createTitleRow(sectionTitle));
        
        // For each item, we actually want to push the Block Table into the Section Row? 
        // No, we can just push multiple tables into the root doc children.
        // But to keep it "Blocky", let's make the section title a table, and each item a table.
        // We accumulate them in `allContent`.
        
        if (items.length > 0) {
            allContent.push(createSectionBlock(sectionRows)); // Pushes the Title
            items.forEach(item => {
                allContent.push(renderItem(item)); // Pushes the Item Table
            });
        }
    });

    const doc = new Document({
      styles: { default: { document: { run: { font: C.MAIN_FONT, color: C.TEXT_COLOR, size: C.sizeNormal }, paragraph: { spacing: { line: C.LINE_SPACING_VAL } } } } },
      sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: allContent }],
    });
  
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${data.profile.name || 'resume'}_block_layout.docx`);
};
