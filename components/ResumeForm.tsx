
import React, { useState, useRef } from 'react';
import { ResumeData, Education, Experience, Project, CustomSection, CustomItem, SectionConfig } from '../types';
import { Plus, Trash2, ChevronDown, ChevronUp, Layers, Bold, Italic, Highlighter, Briefcase, GraduationCap, FolderGit2, User, ArrowUp, ArrowDown, Eye, EyeOff, Camera, MapPin, Building2, Calendar } from 'lucide-react';

interface ResumeFormProps {
  data: ResumeData;
  onChange: (newData: ResumeData) => void;
}

// Simple Toolbar Component for TextAreas
const RichTextToolbar: React.FC<{
    value: string;
    onChange: (val: string) => void;
    id: string;
}> = ({ value, onChange, id }) => {
    const applyTag = (tag: string) => {
        const textarea = document.getElementById(id) as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);

        if (!selectedText) return;

        const before = value.substring(0, start);
        const after = value.substring(end);
        
        // Simple toggle check could be added here, but for now just wrap
        const newValue = `${before}<${tag}>${selectedText}</${tag}>${after}`;
        onChange(newValue);
    };

    return (
        <div className="flex gap-2 mb-1.5 px-1">
            <button 
                onClick={() => applyTag('b')} 
                className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors" 
                title="加粗 (Bold)"
            >
                <Bold size={14} />
            </button>
            <button 
                onClick={() => applyTag('i')} 
                className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors" 
                title="斜体 (Italic)"
            >
                <Italic size={14} />
            </button>
             <button 
                onClick={() => applyTag('c')} 
                className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors" 
                title="主题色高亮 (Theme Color)"
            >
                <Highlighter size={14} />
            </button>
        </div>
    );
};

const RichTextarea: React.FC<{
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    id: string;
}> = ({ value, onChange, placeholder, className, id }) => {
    return (
        <div className="flex flex-col group">
            <div className="opacity-40 group-hover:opacity-100 transition-opacity">
                <RichTextToolbar value={value} onChange={onChange} id={id} />
            </div>
            <textarea
                id={id}
                placeholder={placeholder}
                className={`border border-slate-200 p-3 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none resize-none placeholder:text-slate-400 ${className}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    )
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className, ...props }) => (
    <div className="flex flex-col gap-1">
        {label && <label className="text-xs font-medium text-slate-500 ml-1">{label}</label>}
        <input 
            {...props}
            className={`border border-slate-200 p-2.5 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none placeholder:text-slate-400 ${className}`}
        />
    </div>
)


const ResumeForm: React.FC<ResumeFormProps> = ({ data, onChange }) => {
  const [activeSection, setActiveSection] = useState<string | null>('profile');
  const [showMoreProfile, setShowMoreProfile] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const updateProfile = (field: string, value: any) => {
    onChange({
      ...data,
      profile: { ...data.profile, [field]: value },
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          if (event.target?.result) {
              updateProfile('avatar', event.target.result as string);
          }
      };
      reader.readAsDataURL(file);
  };

  // Generic handler for array based fields
  const addItem = <T extends { id: string }>(key: keyof ResumeData, newItem: T) => {
    onChange({
      ...data,
      [key]: [...(data[key] as unknown as T[]), newItem],
    });
  };

  const removeItem = (key: keyof ResumeData, id: string) => {
    onChange({
      ...data,
      [key]: (data[key] as any[]).filter((item: any) => item.id !== id),
    });
  };

  const updateItem = (key: keyof ResumeData, id: string, field: string, value: string) => {
    onChange({
      ...data,
      [key]: (data[key] as any[]).map((item: any) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  // Section Order Management
  const moveSection = (index: number, direction: 'up' | 'down') => {
      const newOrder = [...data.sectionOrder];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (targetIndex >= 0 && targetIndex < newOrder.length) {
          [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
          onChange({ ...data, sectionOrder: newOrder });
      }
  };

  const toggleSectionVisibility = (index: number) => {
      const newOrder = [...data.sectionOrder];
      newOrder[index].visible = !newOrder[index].visible;
      onChange({ ...data, sectionOrder: newOrder });
  };


  // Custom Section Handlers
  const addCustomSection = () => {
      const newSection: CustomSection = {
          id: Date.now().toString(),
          title: "自定义板块",
          items: []
      };
      
      const newOrderEntry: SectionConfig = {
          id: newSection.id,
          type: 'custom',
          visible: true
      };

      onChange({
          ...data,
          customSections: [...data.customSections, newSection],
          sectionOrder: [...data.sectionOrder, newOrderEntry]
      });
      setActiveSection(`custom-${newSection.id}`);
  };

  const removeCustomSection = (sectionId: string) => {
      if(confirm("确定要删除这个板块吗？")) {
        // Remove from both customSections array and sectionOrder array
        onChange({
            ...data,
            customSections: data.customSections.filter(s => s.id !== sectionId),
            sectionOrder: data.sectionOrder.filter(s => s.id !== sectionId)
        });
        if (activeSection === `custom-${sectionId}`) setActiveSection(null);
      }
  };

  const updateCustomSectionTitle = (sectionId: string, newTitle: string) => {
      onChange({
          ...data,
          customSections: data.customSections.map(s => s.id === sectionId ? {...s, title: newTitle} : s)
      });
  };

  const addCustomItem = (sectionId: string) => {
      const newItem: CustomItem = {
          id: Date.now().toString(),
          title: "",
          subtitle: "",
          date: "",
          description: ""
      };
      onChange({
          ...data,
          customSections: data.customSections.map(s => 
            s.id === sectionId ? {...s, items: [...s.items, newItem]} : s
          )
      });
  };

  const updateCustomItem = (sectionId: string, itemId: string, field: keyof CustomItem, value: string) => {
      onChange({
          ...data,
          customSections: data.customSections.map(s => 
            s.id === sectionId ? {
                ...s, 
                items: s.items.map(i => i.id === itemId ? {...i, [field]: value} : i)
            } : s
          )
      });
  };

  const removeCustomItem = (sectionId: string, itemId: string) => {
      onChange({
          ...data,
          customSections: data.customSections.map(s => 
            s.id === sectionId ? {
                ...s,
                items: s.items.filter(i => i.id !== itemId)
            } : s
          )
      });
  };

  // Helper to render section header controls
  const renderSectionHeader = (config: SectionConfig, index: number, icon: React.ReactNode, title: string, customSectionId?: string) => {
      const isActive = activeSection === (customSectionId ? `custom-${customSectionId}` : config.id);
      
      return (
          <div className={`flex justify-between items-center p-4 bg-slate-50/80 border-b border-slate-100 ${!config.visible ? 'opacity-60' : ''}`}>
              <div className="flex-1 flex items-center gap-3">
                  <button 
                    onClick={() => toggleSection(customSectionId ? `custom-${customSectionId}` : config.id)} 
                    className="flex items-center gap-2 font-semibold text-slate-800 text-left flex-1"
                  >
                      {icon}
                      {customSectionId && isActive ? (
                           <input 
                            value={title}
                            onChange={(e) => updateCustomSectionTitle(customSectionId, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm border border-blue-200 rounded px-2 py-1 w-32 focus:w-48 transition-all bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder="板块标题"
                        />
                      ) : (
                          <span>{title}</span>
                      )}
                      {isActive ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                  </button>
              </div>

              <div className="flex items-center gap-1.5 ml-2">
                   {/* Visibility Toggle */}
                   <button
                      onClick={(e) => { e.stopPropagation(); toggleSectionVisibility(index); }}
                      className={`p-1.5 rounded transition-colors ${config.visible ? 'text-slate-500 hover:bg-slate-200' : 'text-slate-400 bg-slate-100'}`}
                      title={config.visible ? "隐藏板块" : "显示板块"}
                   >
                       {config.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                   </button>

                   {/* Reorder Controls */}
                   <div className="flex bg-slate-100 rounded p-0.5 border border-slate-200">
                       <button
                           onClick={(e) => { e.stopPropagation(); moveSection(index, 'up'); }}
                           disabled={index === 0}
                           className="p-1 hover:bg-white rounded disabled:opacity-30 text-slate-600"
                           title="上移"
                       >
                           <ArrowUp size={14} />
                       </button>
                       <button
                           onClick={(e) => { e.stopPropagation(); moveSection(index, 'down'); }}
                           disabled={index === data.sectionOrder.length - 1}
                           className="p-1 hover:bg-white rounded disabled:opacity-30 text-slate-600"
                           title="下移"
                       >
                           <ArrowDown size={14} />
                       </button>
                   </div>
                   
                   {/* Add Button for standard sections */}
                   {!customSectionId && (
                       <button
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if (!isActive) toggleSection(config.id);
                                const newId = Date.now().toString();
                                if (config.id === 'education') addItem('education', { id: newId, school: '', degree: '', startDate: '', endDate: '', description: '' });
                                if (config.id === 'experience') addItem('experience', { id: newId, company: '', position: '', startDate: '', endDate: '', description: '' });
                                if (config.id === 'projects') addItem('projects', { id: newId, name: '', role: '', startDate: '', endDate: '', description: '' });
                                if (config.id === 'internships') addItem('internships', { id: newId, company: '', position: '', startDate: '', endDate: '', description: '' });
                                if (config.id === 'campus') addItem('campus', { id: newId, company: '', position: '', startDate: '', endDate: '', description: '' });
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded transition-colors ml-1"
                            title="添加条目"
                       >
                            <Plus size={18} />
                       </button>
                   )}

                   {/* Custom Section Controls */}
                   {customSectionId && (
                       <>
                        <button
                            onClick={(e) => { e.stopPropagation(); removeCustomSection(customSectionId); }}
                            className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded ml-1"
                            title="删除整个板块"
                        >
                            <Trash2 size={16} />
                        </button>
                        <button
                             onClick={(e) => { 
                                 e.stopPropagation(); 
                                 if (!isActive) toggleSection(`custom-${customSectionId}`);
                                 addCustomItem(customSectionId); 
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded transition-colors"
                            title="添加条目"
                        >
                            <Plus size={18} />
                        </button>
                       </>
                   )}
              </div>
          </div>
      )
  };

  return (
    <div className="flex flex-col gap-5 p-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Basic Information (Always Top, Always Visible) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <button
          onClick={() => toggleSection('profile')}
          className="w-full flex justify-between items-center p-4 bg-slate-50/80 hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <User size={18} className="text-slate-500" />
            <span className="font-semibold text-slate-800">基本信息</span>
          </div>
          {activeSection === 'profile' ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
        </button>
        {activeSection === 'profile' && (
          <div className="p-5">
             <div className="flex gap-6 flex-col md:flex-row">
                 {/* Avatar Area */}
                 <div className="flex flex-col items-center gap-2 shrink-0">
                     <div 
                        onClick={() => avatarInputRef.current?.click()}
                        className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all overflow-hidden relative group"
                     >
                         {data.profile.avatar ? (
                             <img src={data.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                         ) : (
                             <Camera size={24} className="text-slate-400 group-hover:text-blue-400" />
                         )}
                         <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                     </div>
                     <button 
                        onClick={() => updateProfile('showAvatar', !data.profile.showAvatar)}
                        className={`text-xs px-2 py-1 rounded border ${data.profile.showAvatar ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                     >
                         {data.profile.showAvatar ? '显示照片' : '隐藏照片'}
                     </button>
                 </div>

                 {/* Inputs Grid */}
                 <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="姓名" value={data.profile.name} onChange={(e) => updateProfile('name', e.target.value)} />
                    <InputField label="求职意向 / 职位" value={data.profile.title} onChange={(e) => updateProfile('title', e.target.value)} />
                    
                    <InputField label="手机号码" value={data.profile.phone} onChange={(e) => updateProfile('phone', e.target.value)} />
                    <InputField label="电子邮箱" value={data.profile.email} onChange={(e) => updateProfile('email', e.target.value)} />

                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                         <InputField label="工作经验 (如：3年 / 应届生)" value={data.profile.workYears} onChange={(e) => updateProfile('workYears', e.target.value)} />
                         <InputField label="所在城市" value={data.profile.location} onChange={(e) => updateProfile('location', e.target.value)} />
                    </div>

                    {/* Collapsible Extended Info */}
                    {showMoreProfile && (
                        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                             <InputField label="性别" value={data.profile.gender} onChange={(e) => updateProfile('gender', e.target.value)} />
                             <InputField label="出生年份 (如：1998)" value={data.profile.birthYear} onChange={(e) => updateProfile('birthYear', e.target.value)} />
                             <InputField label="求职状态" placeholder="离职/在职" value={data.profile.jobStatus} onChange={(e) => updateProfile('jobStatus', e.target.value)} />
                             <InputField label="期望薪资" value={data.profile.salary} onChange={(e) => updateProfile('salary', e.target.value)} />
                             
                             <InputField label="籍贯" value={data.profile.nativePlace} onChange={(e) => updateProfile('nativePlace', e.target.value)} />
                             <InputField label="政治面貌" value={data.profile.politicalStatus} onChange={(e) => updateProfile('politicalStatus', e.target.value)} />
                             <InputField label="身高 (cm)" value={data.profile.height} onChange={(e) => updateProfile('height', e.target.value)} />
                             <InputField label="体重 (kg)" value={data.profile.weight} onChange={(e) => updateProfile('weight', e.target.value)} />
                        </div>
                    )}
                    
                    <button 
                        onClick={() => setShowMoreProfile(!showMoreProfile)}
                        className="md:col-span-2 text-xs text-center text-blue-500 hover:text-blue-700 py-1"
                    >
                        {showMoreProfile ? "收起更多信息" : "展开更多信息 (性别、年龄、薪资等)"}
                    </button>

                    <div className="md:col-span-2 mt-2">
                        <RichTextarea
                            id="profile-summary"
                            placeholder="个人简介 (简要描述你的优势)"
                            className="w-full h-24"
                            value={data.profile.summary}
                            onChange={(val) => updateProfile('summary', val)}
                        />
                    </div>
                 </div>
             </div>
          </div>
        )}
      </div>

      {/* Dynamic Sections Based on Order */}
      {data.sectionOrder.map((config, index) => {
          
          // --- EDUCATION ---
          if (config.type === 'education') {
              return (
                <div key={config.id} className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${!config.visible ? 'opacity-70 border-dashed' : ''}`}>
                    {renderSectionHeader(config, index, <GraduationCap size={18} className="text-slate-500" />, config.name || "教育背景")}
                    {activeSection === 'education' && config.visible && (
                    <div className="p-5 space-y-8">
                        {data.education.map((edu) => (
                        <div key={edu.id} className="relative border-b border-dashed border-slate-200 pb-6 last:border-0 last:pb-0">
                            <button onClick={() => removeItem('education', edu.id)} className="absolute -top-1 right-0 text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-6">
                            <InputField
                                placeholder="学校名称"
                                value={edu.school}
                                onChange={(e) => updateItem('education', edu.id, 'school', e.target.value)}
                            />
                            <InputField
                                placeholder="学位/专业"
                                value={edu.degree}
                                onChange={(e) => updateItem('education', edu.id, 'degree', e.target.value)}
                            />
                            <InputField
                                placeholder="开始时间"
                                value={edu.startDate}
                                onChange={(e) => updateItem('education', edu.id, 'startDate', e.target.value)}
                            />
                            <InputField
                                placeholder="结束时间"
                                value={edu.endDate}
                                onChange={(e) => updateItem('education', edu.id, 'endDate', e.target.value)}
                            />
                            <div className="md:col-span-2">
                                <RichTextarea
                                    id={`edu-${edu.id}`}
                                    placeholder="相关课程或成就 (可选)"
                                    className="w-full h-20"
                                    value={edu.description}
                                    onChange={(val) => updateItem('education', edu.id, 'description', val)}
                                />
                            </div>
                            </div>
                        </div>
                        ))}
                        {data.education.length === 0 && <p className="text-slate-400 text-sm text-center py-2">点击标题栏 + 添加教育经历</p>}
                    </div>
                    )}
                </div>
              );
          }

          // --- EXPERIENCE ---
          if (config.type === 'experience') {
              return (
                <div key={config.id} className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${!config.visible ? 'opacity-70 border-dashed' : ''}`}>
                    {renderSectionHeader(config, index, <Briefcase size={18} className="text-slate-500" />, config.name || "工作经历")}
                    {activeSection === 'experience' && config.visible && (
                    <div className="p-5 space-y-8">
                        {data.experience.map((exp) => (
                        <div key={exp.id} className="relative border-b border-dashed border-slate-200 pb-6 last:border-0 last:pb-0">
                            <button onClick={() => removeItem('experience', exp.id)} className="absolute -top-1 right-0 text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-6">
                            <InputField
                                placeholder="公司名称"
                                value={exp.company}
                                onChange={(e) => updateItem('experience', exp.id, 'company', e.target.value)}
                            />
                            <InputField
                                placeholder="职位"
                                value={exp.position}
                                onChange={(e) => updateItem('experience', exp.id, 'position', e.target.value)}
                            />
                            <InputField
                                placeholder="开始时间"
                                value={exp.startDate}
                                onChange={(e) => updateItem('experience', exp.id, 'startDate', e.target.value)}
                            />
                            <InputField
                                placeholder="结束时间"
                                value={exp.endDate}
                                onChange={(e) => updateItem('experience', exp.id, 'endDate', e.target.value)}
                            />
                            <div className="md:col-span-2">
                                <RichTextarea
                                    id={`exp-${exp.id}`}
                                    placeholder="工作内容描述 (选中文本可加粗)"
                                    className="w-full h-32"
                                    value={exp.description}
                                    onChange={(val) => updateItem('experience', exp.id, 'description', val)}
                                />
                            </div>
                            </div>
                        </div>
                        ))}
                        {data.experience.length === 0 && <p className="text-slate-400 text-sm text-center py-2">点击标题栏 + 添加工作经历</p>}
                    </div>
                    )}
                </div>
              );
          }

          // --- INTERNSHIPS ---
          if (config.type === 'internships') {
              return (
                <div key={config.id} className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${!config.visible ? 'opacity-70 border-dashed' : ''}`}>
                    {renderSectionHeader(config, index, <Briefcase size={18} className="text-slate-500" />, config.name || "实习经历")}
                    {activeSection === 'internships' && config.visible && (
                    <div className="p-5 space-y-8">
                        {data.internships.map((exp) => (
                        <div key={exp.id} className="relative border-b border-dashed border-slate-200 pb-6 last:border-0 last:pb-0">
                            <button onClick={() => removeItem('internships', exp.id)} className="absolute -top-1 right-0 text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-6">
                            <InputField
                                placeholder="实习公司"
                                value={exp.company}
                                onChange={(e) => updateItem('internships', exp.id, 'company', e.target.value)}
                            />
                            <InputField
                                placeholder="职位/角色"
                                value={exp.position}
                                onChange={(e) => updateItem('internships', exp.id, 'position', e.target.value)}
                            />
                            <InputField
                                placeholder="开始时间"
                                value={exp.startDate}
                                onChange={(e) => updateItem('internships', exp.id, 'startDate', e.target.value)}
                            />
                            <InputField
                                placeholder="结束时间"
                                value={exp.endDate}
                                onChange={(e) => updateItem('internships', exp.id, 'endDate', e.target.value)}
                            />
                            <div className="md:col-span-2">
                                <RichTextarea
                                    id={`int-${exp.id}`}
                                    placeholder="实习内容与成果描述"
                                    className="w-full h-24"
                                    value={exp.description}
                                    onChange={(val) => updateItem('internships', exp.id, 'description', val)}
                                />
                            </div>
                            </div>
                        </div>
                        ))}
                        {data.internships.length === 0 && <p className="text-slate-400 text-sm text-center py-2">点击标题栏 + 添加实习经历</p>}
                    </div>
                    )}
                </div>
              );
          }

           // --- CAMPUS ---
          if (config.type === 'campus') {
              return (
                <div key={config.id} className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${!config.visible ? 'opacity-70 border-dashed' : ''}`}>
                    {renderSectionHeader(config, index, <Building2 size={18} className="text-slate-500" />, config.name || "校园经历")}
                    {activeSection === 'campus' && config.visible && (
                    <div className="p-5 space-y-8">
                        {data.campus.map((exp) => (
                        <div key={exp.id} className="relative border-b border-dashed border-slate-200 pb-6 last:border-0 last:pb-0">
                            <button onClick={() => removeItem('campus', exp.id)} className="absolute -top-1 right-0 text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-6">
                            <InputField
                                placeholder="组织/活动名称"
                                value={exp.company}
                                onChange={(e) => updateItem('campus', exp.id, 'company', e.target.value)}
                            />
                            <InputField
                                placeholder="担任角色"
                                value={exp.position}
                                onChange={(e) => updateItem('campus', exp.id, 'position', e.target.value)}
                            />
                            <InputField
                                placeholder="开始时间"
                                value={exp.startDate}
                                onChange={(e) => updateItem('campus', exp.id, 'startDate', e.target.value)}
                            />
                            <InputField
                                placeholder="结束时间"
                                value={exp.endDate}
                                onChange={(e) => updateItem('campus', exp.id, 'endDate', e.target.value)}
                            />
                            <div className="md:col-span-2">
                                <RichTextarea
                                    id={`cam-${exp.id}`}
                                    placeholder="经历描述"
                                    className="w-full h-24"
                                    value={exp.description}
                                    onChange={(val) => updateItem('campus', exp.id, 'description', val)}
                                />
                            </div>
                            </div>
                        </div>
                        ))}
                        {data.campus.length === 0 && <p className="text-slate-400 text-sm text-center py-2">点击标题栏 + 添加校园经历</p>}
                    </div>
                    )}
                </div>
              );
          }


          // --- PROJECTS ---
          if (config.type === 'projects') {
              return (
                <div key={config.id} className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${!config.visible ? 'opacity-70 border-dashed' : ''}`}>
                    {renderSectionHeader(config, index, <FolderGit2 size={18} className="text-slate-500" />, config.name || "项目经验")}
                    {activeSection === 'projects' && config.visible && (
                    <div className="p-5 space-y-8">
                        {data.projects.map((proj) => (
                        <div key={proj.id} className="relative border-b border-dashed border-slate-200 pb-6 last:border-0 last:pb-0">
                            <button onClick={() => removeItem('projects', proj.id)} className="absolute -top-1 right-0 text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-6">
                            <InputField
                                placeholder="项目名称"
                                value={proj.name}
                                onChange={(e) => updateItem('projects', proj.id, 'name', e.target.value)}
                            />
                            <InputField
                                placeholder="担任角色"
                                value={proj.role}
                                onChange={(e) => updateItem('projects', proj.id, 'role', e.target.value)}
                            />
                            <InputField
                                placeholder="开始时间"
                                value={proj.startDate}
                                onChange={(e) => updateItem('projects', proj.id, 'startDate', e.target.value)}
                            />
                            <InputField
                                placeholder="结束时间"
                                value={proj.endDate}
                                onChange={(e) => updateItem('projects', proj.id, 'endDate', e.target.value)}
                            />
                            <div className="md:col-span-2">
                                <RichTextarea
                                    id={`proj-${proj.id}`}
                                    placeholder="项目描述与成果"
                                    className="w-full h-32"
                                    value={proj.description}
                                    onChange={(val) => updateItem('projects', proj.id, 'description', val)}
                                />
                            </div>
                            </div>
                        </div>
                        ))}
                        {data.projects.length === 0 && <p className="text-slate-400 text-sm text-center py-2">点击标题栏 + 添加项目经验</p>}
                    </div>
                    )}
                </div>
              );
          }

          // --- CUSTOM ---
          if (config.type === 'custom') {
              const section = data.customSections.find(s => s.id === config.id);
              if (!section) return null; // Should not happen if state is consistent

              return (
                <div key={section.id} className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${!config.visible ? 'opacity-70 border-dashed' : ''}`}>
                    {renderSectionHeader(config, index, <Layers size={18} className="text-slate-500" />, section.title, section.id)}
                    {activeSection === `custom-${section.id}` && config.visible && (
                        <div className="p-5 space-y-8">
                            {section.items.map(item => (
                                <div key={item.id} className="relative border-b border-dashed border-slate-200 pb-6 last:border-0 last:pb-0">
                                    <button onClick={() => removeCustomItem(section.id, item.id)} className="absolute -top-1 right-0 text-slate-400 hover:text-red-600 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-6">
                                        <InputField
                                            placeholder="标题 (如：奖项名称、证书名)"
                                            value={item.title}
                                            onChange={(e) => updateCustomItem(section.id, item.id, 'title', e.target.value)}
                                        />
                                        <InputField
                                            placeholder="日期 / 备注 (显示在右侧)"
                                            value={item.date}
                                            onChange={(e) => updateCustomItem(section.id, item.id, 'date', e.target.value)}
                                        />
                                        <InputField
                                            placeholder="副标题 (如：颁发机构) - 可选"
                                            className="md:col-span-2"
                                            value={item.subtitle}
                                            onChange={(e) => updateCustomItem(section.id, item.id, 'subtitle', e.target.value)}
                                        />
                                        <div className="md:col-span-2">
                                            <RichTextarea
                                                id={`cust-${item.id}`}
                                                placeholder="详细描述 - 可选"
                                                className="w-full h-20"
                                                value={item.description}
                                                onChange={(val) => updateCustomItem(section.id, item.id, 'description', val)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {section.items.length === 0 && <p className="text-slate-400 text-sm text-center py-2">点击标题栏 + 添加内容</p>}
                        </div>
                    )}
                </div>
              );
          }
          
          return null;
      })}

      {/* Add Section Button */}
      <button 
        onClick={addCustomSection}
        className="flex items-center justify-center gap-2 p-5 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all font-medium"
      >
        <Layers size={20} />
        <span>添加自定义板块 (如：技能、证书、奖项)</span>
      </button>

    </div>
  );
};

export default ResumeForm;
