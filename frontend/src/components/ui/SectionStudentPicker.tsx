import React, { useMemo, useState } from 'react';
import { Search, X, Check, Users, UserSquare2, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PickerStudent {
  id: string;
  name: string;
  email: string;
  avatar: string;
  branch?: string;
  section?: string;
}

interface SectionStudentPickerProps {
  students: PickerStudent[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function SectionStudentPicker({ students, selectedIds, onChange }: SectionStudentPickerProps) {
  const [activeTab, setActiveTab] = useState<'section' | 'student'>('section');
  const [search, setSearch] = useState('');
  
  // Filters for the student tab
  const [filterBranch, setFilterBranch] = useState<string>('');
  const [filterSection, setFilterSection] = useState<string>('');

  // Derived sections data
  const sectionsData = useMemo(() => {
    const map = new Map<string, { branch: string; section: string; studentIds: string[] }>();
    
    students.forEach(s => {
      const b = s.branch || 'Unassigned';
      const sec = s.section || 'Unassigned';
      const key = `${b}::${sec}`;
      
      if (!map.has(key)) {
        map.set(key, { branch: b, section: sec, studentIds: [] });
      }
      map.get(key)!.studentIds.push(s.id);
    });
    
    return Array.from(map.entries()).map(([key, data]) => ({
      key,
      ...data
    })).sort((a, b) => a.branch.localeCompare(b.branch) || a.section.localeCompare(b.section));
  }, [students]);

  // Derived filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = search ? (s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())) : true;
      const matchBranch = filterBranch ? (s.branch === filterBranch) : true;
      const matchSection = filterSection ? (s.section === filterSection) : true;
      return matchSearch && matchBranch && matchSection;
    });
  }, [students, search, filterBranch, filterSection]);

  // Unique branches/sections for dropdowns
  const uniqueBranches = useMemo(() => Array.from(new Set(students.map(s => s.branch).filter(Boolean))), [students]);
  const uniqueSections = useMemo(() => Array.from(new Set(students.map(s => s.section).filter(Boolean))), [students]);

  // Section logic
  const isSectionFullySelected = (sectionStudentIds: string[]) => {
    if (sectionStudentIds.length === 0) return false;
    return sectionStudentIds.every(id => selectedIds.includes(id));
  };

  const toggleSection = (sectionStudentIds: string[]) => {
    const fullySelected = isSectionFullySelected(sectionStudentIds);
    if (fullySelected) {
      // Remove all these students
      onChange(selectedIds.filter(id => !sectionStudentIds.includes(id)));
    } else {
      // Add missing students
      const toAdd = sectionStudentIds.filter(id => !selectedIds.includes(id));
      onChange([...selectedIds, ...toAdd]);
    }
  };

  const removeSection = (sectionStudentIds: string[]) => {
    onChange(selectedIds.filter(id => !sectionStudentIds.includes(id)));
  };

  const removeStudent = (studentId: string) => {
    onChange(selectedIds.filter(id => id !== studentId));
  };

  // Group selections for the chips UI
  const { fullySelectedSections, individualStudents } = useMemo(() => {
    const fullSections: typeof sectionsData = [];
    const fullSectionStudentIds = new Set<string>();

    sectionsData.forEach(sec => {
      if (sec.studentIds.length > 0 && sec.studentIds.every(id => selectedIds.includes(id))) {
        fullSections.push(sec);
        sec.studentIds.forEach(id => fullSectionStudentIds.add(id));
      }
    });

    const individualIds = selectedIds.filter(id => !fullSectionStudentIds.has(id));
    const individuals = students.filter(s => individualIds.includes(s.id));

    return { fullySelectedSections: fullSections, individualStudents: individuals };
  }, [selectedIds, sectionsData, students]);

  return (
    <div className="flex flex-col border border-line rounded-[14px] overflow-hidden bg-surface">

      {/* Tabs */}
      <div className="flex gap-1 p-1.5 border-b border-line bg-raised">
        <button
          onClick={() => setActiveTab('section')}
          data-active={activeTab === 'section'}
          className="admin-tab flex-1 justify-center !text-[13px]"
        >
          <Layers size={15} />
          By section
        </button>
        <button
          onClick={() => setActiveTab('student')}
          data-active={activeTab === 'student'}
          className="admin-tab flex-1 justify-center !text-[13px]"
        >
          <Users size={15} />
          By student
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1">

        {activeTab === 'section' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[13px] text-ink/55">{sectionsData.length} sections found</span>
              <button
                onClick={() => onChange(students.map(s => s.id))}
                className="text-[13px] font-medium text-brand hover:underline"
              >
                Select all
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {sectionsData.map(sec => {
                const selected = isSectionFullySelected(sec.studentIds);
                return (
                  <button
                    key={sec.key}
                    onClick={() => toggleSection(sec.studentIds)}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-[12px] border text-left transition-colors",
                      selected ? "border-brand bg-brand/[0.05]" : "border-line bg-surface hover:border-ink/30"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-ink">
                        {sec.section}
                      </p>
                      <p className="text-[12px] text-ink/55">{sec.branch} · {sec.studentIds.length} students</p>
                    </div>
                    <div className={cn('w-5 h-5 rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0', selected ? 'bg-brand border-brand text-on-brand' : 'border-ink/30')}>
                      {selected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'student' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email"
                  className="cyber-input w-full pl-9 pr-3 h-9 text-[13px]"
                />
              </div>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                aria-label="Filter by branch"
                className="cyber-input h-9 px-3 text-[13px] min-w-[130px]"
              >
                <option value="">All branches</option>
                {uniqueBranches.map(b => b && <option key={b} value={b}>{b}</option>)}
              </select>
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                aria-label="Filter by section"
                className="cyber-input h-9 px-3 text-[13px] min-w-[130px]"
              >
                <option value="">All sections</option>
                {uniqueSections.map(s => s && <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex justify-between items-center text-[13px] text-ink/55">
              <span>{filteredStudents.length} students match</span>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const toAdd = filteredStudents.map(s => s.id).filter(id => !selectedIds.includes(id));
                    onChange([...selectedIds, ...toAdd]);
                  }}
                  className="font-medium text-brand hover:underline"
                >Select visible</button>
                <button onClick={() => onChange([])} className="text-ink/55 hover:text-ink">Clear all</button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
              {filteredStudents.length === 0 ? (
                <div className="py-8 text-center text-ink/50 text-[13px]">No students match these filters. Try a different search or clear the filters.</div>
              ) : (
                filteredStudents.map(student => {
                  const selected = selectedIds.includes(student.id);
                  return (
                    <button
                      key={student.id}
                      onClick={() => onChange(selected ? selectedIds.filter(id => id !== student.id) : [...selectedIds, student.id])}
                      aria-pressed={selected}
                      className={cn(
                        "w-full flex items-center gap-3 p-2.5 rounded-[10px] border text-left transition-colors",
                        selected ? "border-brand bg-brand/[0.05]" : "border-line bg-surface hover:border-ink/30"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0", selected ? "bg-brand/15 text-brand" : "bg-raised border border-line text-ink/60")}>
                        {student.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="text-[14px] font-medium text-ink truncate">{student.name}</p>
                          {(student.branch || student.section) && (
                            <span className="text-[11px] font-mono text-ink/55 px-1.5 py-0.5 rounded border border-line ml-2 shrink-0">
                              {student.branch} {student.section}
                            </span>
                          )}
                        </div>
                        <p className="text-ink/50 text-[12px] truncate">{student.email}</p>
                      </div>
                      <div className={cn('w-[18px] h-[18px] rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0', selected ? 'bg-brand border-brand text-on-brand' : 'border-ink/30')}>
                        {selected && <Check size={11} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>

      {/* Selected Chips Area */}
      <div className="bg-raised border-t border-line p-4 min-h-[80px]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] text-ink/65">
            Selected: <span className="font-mono font-medium text-ink">{selectedIds.length}</span> students
          </p>
          {selectedIds.length > 0 && (
            <button onClick={() => onChange([])} className="text-[12px] text-ink/55 hover:text-ink">Clear all</button>
          )}
        </div>

        {selectedIds.length === 0 ? (
          <p className="text-[13px] text-ink/50">No students or sections selected yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {fullySelectedSections.map(sec => (
              <div key={sec.key} className="admin-chip !text-ink">
                <Layers size={12} className="text-ink/50" />
                <span>{sec.section} <span className="text-ink/50 text-[11px]">({sec.branch})</span></span>
                <button onClick={() => removeSection(sec.studentIds)} aria-label={`Remove ${sec.section}`} className="ml-0.5 text-ink/45 hover:text-bad">
                  <X size={12} />
                </button>
              </div>
            ))}

            {individualStudents.map(stu => (
              <div key={stu.id} className="admin-chip !text-ink">
                <UserSquare2 size={12} className="text-ink/50" />
                <span>{stu.name}</span>
                <button onClick={() => removeStudent(stu.id)} aria-label={`Remove ${stu.name}`} className="ml-0.5 text-ink/45 hover:text-bad">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
