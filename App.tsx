
import React, { useState, useRef, useEffect } from 'react';
import { ResumeData, TemplateId, CustomSection } from './types';
import ResumeForm from './components/ResumeForm';
import ResumePreview from './components/ResumePreview';
import { generateDocx, generateImageBasedDocx } from './services/docxGenerator';
import { Download, Layout, Upload, Image as ImageIcon, FileType, Palette, Type, Sliders, ChevronLeft, ChevronRight, Settings, PenTool, Check, FileText, ChevronDown } from 'lucide-react';

// Default data
const initialData: ResumeData = {
  style: {
      templateId: 'classic',
      fontFamily: 'Calibri',
      themeColor: '#2E74B5',
      lineHeight: 1.25,
      paragraphSpacing: 8,
      fontSize: 10.5,
      pagePadding: 20
  },
  profile: {
    name: "您的姓名",
    title: "求职意向 / 职位",
    email: "email@example.com",
    phone: "13800000000",
    location: "城市",
    summary: "这里是个人简介区域。您可以在左侧编辑区输入您的自我评价、核心优势或职业目标。",
    showAvatar: true,
    avatar: "", 
    gender: "男",
    birthYear: "1998",
    workYears: "应届生",
    jobStatus: "随时到岗",
    salary: "面议",
    nativePlace: "",
    politicalStatus: "",
    height: "",
    weight: ""
  },
  education: [
    {
      id: "1",
      school: "某某大学",
      degree: "专业名称 - 学位",
      startDate: "2020-09",
      endDate: "2024-06",
      description: "主修课程：软件工程、数据结构、算法分析、Web开发技术。\n荣誉奖项：连续三年获得校级一等奖学金。"
    }
  ],
  experience: [],
  internships: [
     {
        id: "int1",
        company: "某知名互联网公司",
        position: "前端开发实习生",
        startDate: "2023-07",
        endDate: "2023-10",
        description: "1. 负责公司内部管理系统的部分模块开发，使用 React + TypeScript 技术栈。\n2. 优化了首屏加载速度，提升了用户体验。\n3. 参与代码评审，遵循团队代码规范。"
     }
  ],
  campus: [
      {
        id: "cam1",
        company: "校学生会技术部",
        position: "部长",
        startDate: "2021-09",
        endDate: "2022-06",
        description: "组织并策划了校园“黑客马拉松”活动，吸引了超过200名学生参与。"
      }
  ],
  projects: [
    {
      id: "1",
      name: "个人简历生成器",
      role: "独立开发者",
      startDate: "2023-12",
      endDate: "2024-01",
      description: "基于 React 19 和 TypeScript 开发的在线简历制作工具，支持实时预览和导出 Word 文档。"
    }
  ],
  skills: [],
  customSections: [
      {
          id: 'skills',
          title: '技能特长',
          items: [
              { id: 's1', title: '编程语言', subtitle: '', date: '', description: 'JavaScript (ES6+), TypeScript, HTML5, CSS3, Python, Java' },
              { id: 's2', title: '前端框架', subtitle: '', date: '', description: 'React, Vue.js, TailwindCSS, Next.js' }
          ]
      },
      {
          id: 'certs',
          title: '荣誉证书',
          items: [
              { id: 'c1', title: '英语 CET-6', subtitle: '', date: '2022-06', description: '' },
              { id: 'c2', title: '计算机技术与软件专业技术资格（中级）', subtitle: '', date: '2023-11', description: '' }
          ]
      },
      {
          id: 'self',
          title: '自我评价',
          items: [
              { id: 'se1', title: '', subtitle: '', date: '', description: '热爱编程，具备良好的自学能力和团队协作精神。对待工作认真负责，能够承受一定的工作压力。' }
          ]
      }
  ],
  sectionOrder: [
      { id: 'education', type: 'education', visible: true, name: '教育背景' },
      { id: 'experience', type: 'experience', visible: true, name: '工作经历' },
      { id: 'internships', type: 'internships', visible: true, name: '实习经验' },
      { id: 'projects', type: 'projects', visible: true, name: '项目经验' },
      { id: 'campus', type: 'campus', visible: true, name: '校园经历' },
      { id: 'skills', type: 'custom', visible: true, name: '技能特长' },
      { id: 'certs', type: 'custom', visible: true, name: '荣誉证书' },
      { id: 'self', type: 'custom', visible: true, name: '自我评价' }
  ]
};

function App() {
  const [resumeData, setResumeData] = useState<ResumeData>(initialData);
  const [activeTab, setActiveTab] = useState<'content' | 'design'>('content');
  const [scale, setScale] = useState(0.85);
  const [isImporting, setIsImporting] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadBtnRef = useRef<HTMLDivElement>(null);

  // Click outside to close download menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (downloadBtnRef.current && !downloadBtnRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Responsive Scale Listener
  useEffect(() => {
    const handleResize = () => {
        const width = window.innerWidth;
        if (width < 768) {
            // Mobile: Fit width minus padding (approx)
            // A4 width is ~210mm. Screen width pixels need to map to that.
            // Let's assume standard A4 pixel width is around 794px at 96 DPI.
            // We want the paper to fit in (window.innerWidth - 32px).
            const containerWidth = width - 40; 
            const paperOriginalWidth = 794; 
            const newScale = Math.max(0.4, containerWidth / paperOriginalWidth);
            setScale(newScale);
        } else if (width < 1200) {
            setScale(0.65);
        } else {
            setScale(0.85);
        }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDownloadStandard = () => {
    generateDocx(resumeData);
    setShowDownloadMenu(false);
  };

  const handleDownloadImageDocx = async () => {
      const { html2canvas } = window;
      if (!html2canvas) {
          alert("导出组件加载中，请稍后再试。");
          return;
      }
      
      const originalElement = document.getElementById('resume-preview-content');
      if (!originalElement) return;

      // Clone logic to render full size off-screen
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '210mm';
      container.style.zIndex = '-1';
      document.body.appendChild(container);

      const clone = originalElement.cloneNode(true) as HTMLElement;
      clone.style.transform = 'none';
      clone.style.margin = '0';
      clone.style.boxShadow = 'none';
      container.appendChild(clone);

      try {
          // Wait for images
          const images = Array.from(clone.getElementsByTagName('img'));
          await Promise.all(images.map(img => {
              if (img.complete) return Promise.resolve();
              return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
          }));

          const canvas = await html2canvas(clone, { 
              scale: 2, // High res for print
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff',
              windowWidth: 794,
          });

          // Convert canvas to blob
          canvas.toBlob((blob: Blob | null) => {
              if (blob) {
                  generateImageBasedDocx(blob, resumeData.profile.name || 'resume');
              } else {
                  alert("导出生成失败");
              }
          }, 'image/png');

      } catch (error) {
          console.error("Export failed", error);
          alert("导出失败，请重试");
      } finally {
          document.body.removeChild(container);
          setShowDownloadMenu(false);
      }
  };

  const captureExactPreview = async (type: 'image' | 'pdf') => {
      const { html2canvas, jspdf } = window;
      if (!html2canvas || (type === 'pdf' && !jspdf)) {
          alert("导出组件加载中，请稍后再试。");
          return;
      }
      const originalElement = document.getElementById('resume-preview-content');
      if (!originalElement) return;

      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '210mm';
      container.style.zIndex = '-1';
      document.body.appendChild(container);

      const clone = originalElement.cloneNode(true) as HTMLElement;
      clone.style.transform = 'none';
      clone.style.margin = '0';
      clone.style.boxShadow = 'none';
      container.appendChild(clone);

      try {
          // Wait for images to load in clone if any (avatar)
          const images = Array.from(clone.getElementsByTagName('img'));
          await Promise.all(images.map(img => {
              if (img.complete) return Promise.resolve();
              return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
          }));

          const canvas = await html2canvas(clone, { 
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff',
              windowWidth: 794,
          });

          if (type === 'image') {
            const link = document.createElement('a');
            link.download = `${resumeData.profile.name || 'resume'}_preview.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
          } else {
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const { jsPDF } = jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = 210; 
            const pdfHeight = 297;
            const imgProps = pdf.getImageProperties(imgData);
            const pdfImgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfImgHeight);
            pdf.save(`${resumeData.profile.name || 'resume'}.pdf`);
          }

      } catch (error) {
          console.error("Export failed", error);
          alert("导出失败，请重试");
      } finally {
          document.body.removeChild(container);
      }
  };

  const handleExportImage = () => captureExactPreview('image');
  const handleExportPDF = () => captureExactPreview('pdf');

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      setIsImporting(true);

      reader.onload = (e) => {
          const arrayBuffer = e.target?.result;
          if (!window.mammoth) {
              alert("导入组件未加载，请刷新页面重试");
              setIsImporting(false);
              return;
          }

          window.mammoth.extractRawText({ arrayBuffer: arrayBuffer })
              .then((result: any) => {
                  const text = result.value;
                  parseAndPopulateData(text);
                  setIsImporting(false);
                  if (fileInputRef.current) fileInputRef.current.value = ''; 
              })
              .catch((err: any) => {
                  console.error(err);
                  alert("无法解析该文档");
                  setIsImporting(false);
              });
      };
      reader.readAsArrayBuffer(file);
  };

  const parseAndPopulateData = (text: string) => {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) return;
      const newData = { ...resumeData };
      if (lines[0]) newData.profile.name = lines[0];
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/;
      const emailMatch = text.match(emailRegex);
      if (emailMatch) newData.profile.email = emailMatch[0];
      const phoneRegex = /(1\d{10})/;
      const phoneMatch = text.match(phoneRegex);
      if (phoneMatch) newData.profile.phone = phoneMatch[0];
      
      const summaryCandidate = lines.slice(1, 6).join('\n'); 
      newData.profile.summary = "【从文档导入的文本摘要，请手动整理】\n" + summaryCandidate + "...(更多内容请查看原文档)";

      setResumeData(newData);
      alert("文档导入成功！\n\n注意：已提取姓名/电话/邮箱，其他内容请在左侧手动完善。");
  };

  const updateStyle = (key: keyof import('./types').ResumeStyle, value: any) => {
      setResumeData({
          ...resumeData,
          style: { ...resumeData.style, [key]: value }
      });
  };

  const DesignPanel = () => (
      <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Template Selection */}
          <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                    <Layout size={18} /> 
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">简历模板</h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                  {[
                      { id: 'classic', name: '经典商务 (Classic)', desc: '稳重、居中对齐，适合传统行业', color: 'border-l-4 border-blue-600' },
                      { id: 'modern', name: '现代先锋 (Modern)', desc: '左对齐标题，带有醒目分割线', color: 'border-l-4 border-emerald-500' },
                      { id: 'minimal', name: '极简主义 (Minimal)', desc: '无边框，纯净排版，注重内容', color: 'border-l-4 border-slate-800' }
                  ].map(t => (
                      <button
                          key={t.id}
                          onClick={() => updateStyle('templateId', t.id as TemplateId)}
                          className={`relative group flex flex-col items-start p-4 rounded-xl border transition-all duration-200 text-left hover:shadow-md ${resumeData.style.templateId === t.id ? 'bg-white border-blue-500 ring-1 ring-blue-500 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                      >
                          <div className="flex justify-between w-full items-center mb-1">
                             <span className={`font-bold ${resumeData.style.templateId === t.id ? 'text-blue-700' : 'text-slate-700'}`}>{t.name}</span>
                             {resumeData.style.templateId === t.id && <Check size={16} className="text-blue-600" />}
                          </div>
                          <span className="text-xs text-slate-500">{t.desc}</span>
                      </button>
                  ))}
              </div>
          </section>

          <hr className="border-slate-100" />

          {/* Typography */}
          <section className="space-y-4">
               <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
                    <Type size={18} /> 
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">字体设置</h3>
              </div>
              <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                <select 
                    className="w-full p-2.5 rounded-md bg-transparent text-slate-700 font-medium focus:outline-none"
                    value={resumeData.style.fontFamily}
                    onChange={(e) => updateStyle('fontFamily', e.target.value)}
                >
                    <option value="Calibri">默认 (Calibri) - 通用推荐</option>
                    <option value="Microsoft YaHei">微软雅黑 - 现代屏显</option>
                    <option value="SimSun">宋体 (SimSun) - 传统打印</option>
                    <option value="KaiTi">楷体 (KaiTi) - 优雅手写</option>
                    <option value="Roboto">Roboto - 英文简历推荐</option>
                </select>
              </div>
          </section>

           {/* Color Selection */}
           <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
                    <Palette size={18} /> 
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">主题色</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                  {['#2E74B5', '#2C3E50', '#C0392B', '#27AE60', '#8E44AD', '#D35400', '#000000'].map(color => (
                      <button
                          key={color}
                          onClick={() => updateStyle('themeColor', color)}
                          className={`w-10 h-10 rounded-full shadow-sm transition-transform hover:scale-110 flex items-center justify-center ${resumeData.style.themeColor === color ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                          style={{ backgroundColor: color }}
                      >
                          {resumeData.style.themeColor === color && <Check size={16} className="text-white drop-shadow-md" />}
                      </button>
                  ))}
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 shadow-sm hover:scale-110 transition-transform flex items-center justify-center bg-white group">
                    <input 
                        type="color" 
                        value={resumeData.style.themeColor}
                        onChange={(e) => updateStyle('themeColor', e.target.value)}
                        className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer opacity-0"
                    />
                    <Sliders size={16} className="text-slate-500 group-hover:text-slate-800" />
                  </div>
              </div>
          </section>

          <hr className="border-slate-100" />

          {/* Spacing & Layout */}
          <section className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                    <Sliders size={18} /> 
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">排版细节</h3>
              </div>
              
              <div className="space-y-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  {/* Font Size */}
                  <div className="space-y-2">
                      <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600">正文基础字号</span>
                          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">{resumeData.style.fontSize}pt</span>
                      </div>
                      <input 
                          type="range" min="9" max="12" step="0.5"
                          value={resumeData.style.fontSize || 10.5}
                          onChange={(e) => updateStyle('fontSize', parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                  </div>

                  {/* Line Height */}
                  <div className="space-y-2">
                      <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600">行间距 (Line Height)</span>
                          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">{resumeData.style.lineHeight}x</span>
                      </div>
                      <input 
                          type="range" min="1.0" max="2.0" step="0.05"
                          value={resumeData.style.lineHeight}
                          onChange={(e) => updateStyle('lineHeight', parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                  </div>

                  {/* Paragraph Spacing */}
                  <div className="space-y-2">
                      <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600">段落间距</span>
                          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">{resumeData.style.paragraphSpacing}pt</span>
                      </div>
                      <input 
                          type="range" min="0" max="24" step="2"
                          value={resumeData.style.paragraphSpacing}
                          onChange={(e) => updateStyle('paragraphSpacing', parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                  </div>

                  {/* Page Padding */}
                  <div className="space-y-2">
                      <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600">页面边距</span>
                          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">{resumeData.style.pagePadding || 20}mm</span>
                      </div>
                      <input 
                          type="range" min="10" max="35" step="1"
                          value={resumeData.style.pagePadding || 20}
                          onChange={(e) => updateStyle('pagePadding', parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                  </div>
              </div>
          </section>
      </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".docx" className="hidden" />

      {/* Modern Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          
          {/* Logo Area */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center text-white shadow-sm">
                <FileText size={18} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 hidden md:inline">
                EasyResume
            </span>
          </div>
          
          {/* Actions Area */}
          <div className="flex items-center gap-2 sm:gap-3">
             {/* Zoom Controls (Hidden on tiny screens) */}
             <div className="hidden lg:flex items-center bg-slate-50 rounded-lg p-1 mr-4 border border-slate-200">
                <button onClick={() => setScale(Math.max(0.4, scale - 0.1))} className="p-1 hover:bg-white hover:shadow-sm rounded text-slate-600 transition-all"><ChevronLeft size={14} /></button>
                <span className="text-xs px-2 min-w-[3rem] text-center font-medium text-slate-600">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(Math.min(1.5, scale + 0.1))} className="p-1 hover:bg-white hover:shadow-sm rounded text-slate-600 transition-all"><ChevronRight size={14} /></button>
             </div>

            <button 
                onClick={handleImportClick} 
                disabled={isImporting} 
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:ring-4 focus:ring-slate-100 transition-all"
            >
                <Upload size={16} /> 
                <span className="hidden sm:inline">导入</span>
            </button>

            <div className="hidden sm:block h-6 w-px bg-slate-200 mx-1"></div>

            <div className="flex gap-1 sm:gap-2">
                <button onClick={handleExportImage} className="hidden sm:block group relative p-2 text-slate-500 hover:text-indigo-600 transition-colors" title="导出为图片">
                    <ImageIcon size={20} />
                </button>
                <button onClick={handleExportPDF} className="hidden sm:block group relative p-2 text-slate-500 hover:text-red-600 transition-colors" title="导出为 PDF">
                    <FileType size={20} />
                </button>
                
                {/* Download Dropdown */}
                <div className="relative" ref={downloadBtnRef}>
                    <button 
                        onClick={() => setShowDownloadMenu(!showDownloadMenu)} 
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 transition-all shadow-sm"
                    >
                        <Download size={16} /> 
                        <span className="hidden sm:inline">下载</span>
                        <ChevronDown size={14} className={`transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showDownloadMenu && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-30 animate-in fade-in zoom-in-95 duration-200">
                             <div className="p-2 space-y-1">
                                <button 
                                    onClick={handleDownloadStandard}
                                    className="w-full text-left p-3 hover:bg-blue-50 rounded-lg group transition-colors"
                                >
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="font-bold text-slate-800 group-hover:text-blue-700">标准文档</span>
                                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">文字可编辑</span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        标准 Word 流式排版，适合大多数场景。
                                    </p>
                                </button>
                                
                                <div className="h-px bg-slate-100 mx-2"></div>

                                <button 
                                    onClick={handleDownloadImageDocx}
                                    className="w-full text-left p-3 hover:bg-emerald-50 rounded-lg group transition-colors"
                                >
                                     <div className="flex justify-between items-center mb-0.5">
                                        <span className="font-bold text-slate-800 group-hover:text-emerald-700">图片版文档 (视觉完美)</span>
                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">绝对不跑版</span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        将简历生成为高清图片插入 Word。100% 还原网页排版，但文字不可编辑。
                                    </p>
                                </button>
                             </div>
                        </div>
                    )}
                </div>

            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row max-w-[1600px] mx-auto w-full">
        
        {/* Left: Editor Sidebar */}
        <div className="w-full md:w-[420px] lg:w-[480px] bg-white border-r border-slate-200 flex flex-col z-10 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] h-1/2 md:h-full">
            {/* Sidebar Navigation */}
            <div className="flex border-b border-slate-100 p-2 gap-2 bg-white">
                <button 
                    onClick={() => setActiveTab('content')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                        activeTab === 'content' 
                        ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                    <PenTool size={16} /> 内容编辑
                </button>
                <button 
                    onClick={() => setActiveTab('design')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                        activeTab === 'design' 
                        ? 'bg-purple-50 text-purple-700 shadow-sm ring-1 ring-purple-100' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                    <Settings size={16} /> 全局设计
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
                {activeTab === 'content' ? (
                     <ResumeForm data={resumeData} onChange={setResumeData} />
                ) : (
                     <DesignPanel />
                )}
            </div>
        </div>

        {/* Right: Preview Area */}
        <div className="flex-1 bg-[#F8FAFC] overflow-y-auto relative flex justify-center items-start pt-8 pb-20 px-4 h-1/2 md:h-full border-t md:border-t-0 border-slate-200">
           {/* Preview Badge */}
           <div className="absolute top-4 pointer-events-none z-10 opacity-60 hover:opacity-100 transition-opacity">
             <span className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
                 {resumeData.style.templateId === 'classic' && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                 {resumeData.style.templateId === 'modern' && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                 {resumeData.style.templateId === 'minimal' && <span className="w-2 h-2 rounded-full bg-slate-800"></span>}
                 {resumeData.style.templateId === 'classic' && '经典'}
                 {resumeData.style.templateId === 'modern' && '现代'}
                 {resumeData.style.templateId === 'minimal' && '极简'}
                 <span className="text-slate-300">|</span>
                 所见即所得
             </span>
           </div>
           
           {/* The Paper */}
           <div className="shadow-2xl rounded-sm transition-all duration-300 mt-6 mb-20">
                <ResumePreview data={resumeData} scale={scale} />
           </div>
        </div>

      </main>
    </div>
  );
}

export default App;
