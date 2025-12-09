
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

// Helper to get image dimensions
const getImageDimensions = (base64: string): Promise<{ width: number; height: number; ratio: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({
                width: img.width,
                height: img.height,
                ratio: img.width / img.height
            });
        };
        img.onerror = reject;
        img.src = base64;
    });
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
 */
export const generateDocx = async (data: ResumeData) => {
  const { docx, saveAs } = window;
  if (!docx) { alert("组件加载中..."); return; }

  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun } = docx;

  const style = data.style;
  const C = getStyleConstants(style);
  
  // Convert mm to twips (1 mm approx 56.7 twips)
  const marginTwips = Math.round((style.pagePadding || 20) * 56.7);

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
  
  // -- Header Generation --
  const p = data.profile;
  const joinMeta = (parts: (string | undefined)[]) => parts.filter(Boolean).join(" | ");
  
  const metaLinesText: string[] = [];
  const line1 = joinMeta([p.title, p.salary, p.jobStatus]);
  if (line1) metaLinesText.push(line1);
  const age = p.birthYear ? `${new Date().getFullYear() - parseInt(p.birthYear)}岁` : undefined;
  const line2 = joinMeta([p.gender, age, p.workYears, p.location, p.nativePlace, p.politicalStatus]);
  if (line2) metaLinesText.push(line2);
  const line3 = joinMeta([p.phone, p.email]);
  if (line3) metaLinesText.push(line3);
  const line4 = joinMeta([p.height ? `${p.height}cm` : undefined, p.weight ? `${p.weight}kg` : undefined]);
  if (line4) metaLinesText.push(line4);

  const createMetaP = (text: string, align: any) => new Paragraph({
       children: [new TextRun({ text, font: C.MAIN_FONT, size: C.sizeMeta, color: "000000" })],
       alignment: align,
       spacing: { line: C.LINE_SPACING_VAL, lineRule: "auto" }
  });

  const hasAvatar = p.showAvatar && p.avatar;
  const headerAlign = (hasAvatar || style.templateId === 'modern' || style.templateId === 'minimal') ? AlignmentType.LEFT : AlignmentType.CENTER;

  if (hasAvatar) {
      let imgData = p.avatar!;
      if (imgData.includes(',')) imgData = imgData.split(',')[1];
      const imgBuffer = Uint8Array.from(atob(imgData), c => c.charCodeAt(0));
      
      // Calculate scaling to avoid distortion
      // Standard Box: Width 100, Height 130
      let finalW = 100;
      let finalH = 130;
      
      try {
        const dims = await getImageDimensions(p.avatar!);
        const maxW = 100;
        const maxH = 130;
        
        // Scale to fit within box while maintaining aspect ratio
        if (dims.width > dims.height) {
            // Landscape
            finalW = maxW;
            finalH = (dims.height / dims.width) * maxW;
        } else {
            // Portrait or Square
            finalH = maxH;
            finalW = (dims.width / dims.height) * maxH;
            if (finalW > maxW) {
                finalW = maxW;
                finalH = (dims.height / dims.width) * maxW;
            }
        }
      } catch (e) {
          console.warn("Could not calculate image dimensions, using default.", e);
      }


      const headerTextCell = new TableCell({
          width: { size: 80, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [
              new Paragraph({
                  children: [new TextRun({ text: p.name, font: C.MAIN_FONT, bold: true, size: C.sizeH1, color: style.templateId === 'minimal' ? C.TEXT_COLOR : C.THEME_COLOR })],
                  heading: HeadingLevel.HEADING_1,
                  alignment: AlignmentType.LEFT,
                  spacing: { after: 100 },
              }),
              ...metaLinesText.map(line => createMetaP(line, AlignmentType.LEFT))
          ]
      });

      const headerImageCell = new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
          verticalAlign: "top",
          children: [
              new Paragraph({
                  children: [
                      new ImageRun({
                          data: imgBuffer,
                          transformation: { width: finalW, height: finalH },
                          type: "png"
                      })
                  ],
                  alignment: AlignmentType.RIGHT
              })
          ]
      });

      const headerTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE } },
          rows: [new TableRow({ children: [headerTextCell, headerImageCell] })]
      });

      blocks.push(headerTable);

      if (style.templateId === 'minimal') {
           blocks.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 12 } } }));
      } else {
           blocks.push(new Paragraph({ spacing: { after: Math.floor(style.fontSize * 1.5 * 20) } })); 
      }

  } else {
      blocks.push(new Paragraph({
        children: [new TextRun({ text: p.name, font: C.MAIN_FONT, bold: true, size: C.sizeH1, color: style.templateId === 'minimal' ? C.TEXT_COLOR : C.THEME_COLOR })],
        heading: HeadingLevel.HEADING_1,
        alignment: headerAlign,
        spacing: { after: Math.floor(style.fontSize * 0.4 * 20), line: C.LINE_SPACING_VAL, lineRule: "auto" },
      }));

      metaLinesText.forEach(line => {
          blocks.push(createMetaP(line, headerAlign));
      });

      blocks.push(new Paragraph({
        border: style.templateId === 'minimal' ? { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 12 } } : undefined,
        spacing: { after: Math.floor(style.fontSize * 1.5 * 20) }
      }));
  }

  if (data.profile.summary) {
      blocks.push(createSectionTitle("个人简介"));
      blocks.push(createBodyParagraph(data.profile.summary));
  }

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
      } else if (config.type === 'internships') {
           processItems(config.name || "实习经历", data.internships, (exp) => [
              createItemRow(exp.company, `${exp.startDate} - ${exp.endDate}`),
              exp.position ? createBodyParagraph(exp.position, { isSubtitle: true, isItalic: true }) : null,
              exp.description ? createBodyParagraph(exp.description) : new Paragraph({ spacing: { after: C.PARA_SPACING_AFTER } })
          ].filter(Boolean));
      } else if (config.type === 'campus') {
           processItems(config.name || "校园经历", data.campus, (exp) => [
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
    sections: [{ properties: { page: { margin: { top: marginTwips, bottom: marginTwips, left: marginTwips, right: marginTwips } } }, children: blocks }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${data.profile.name || 'resume'}_cv.docx`);
};


/**
 * Strategy 2: Image-based Multi-page Docx
 * Accepts an array of image Blobs (one per page).
 */
export const generateImageBasedDocx = async (imageBlobs: Blob[], fileName: string) => {
    const { docx, saveAs } = window;
    if (!docx) { alert("组件加载中..."); return; }

    const { Document, Packer, Paragraph, ImageRun } = docx;

    const sections = [];

    for (const imageBlob of imageBlobs) {
        // Convert Blob to ArrayBuffer then Uint8Array
        const buffer = await imageBlob.arrayBuffer();
        const image = new Uint8Array(buffer);

        sections.push({
            properties: {
                page: {
                    margin: { top: 0, bottom: 0, left: 0, right: 0 }
                }
            },
            children: [
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: image,
                            transformation: {
                                width: 794, // Standard A4 width in pixels at 96 DPI
                                height: 1123 
                            },
                            type: "jpg" // Use JPG to match the compressed input
                        })
                    ]
                })
            ]
        });
    }

    const doc = new Document({
        sections: sections
    });

    const docBlob = await Packer.toBlob(doc);
    saveAs(docBlob, `${fileName}_image.docx`);
};
