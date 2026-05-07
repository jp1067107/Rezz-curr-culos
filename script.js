import fs from 'fs';

let code = fs.readFileSync('src/components/ResumePreview.tsx', 'utf8');

const map = {
  'text-gray-800': 'text-[#1f2937]',
  'bg-slate-800': 'bg-[#1e293b]',
  'border-slate-600': 'border-[#475569]',
  'text-slate-400': 'text-[#94a3b8]',
  'bg-slate-700': 'bg-[#334155]',
  'border-slate-200': 'border-[#e2e8f0]',
  'text-slate-900': 'text-[#0f172a]',
  'text-blue-600': 'text-[#2563eb]',
  'text-slate-800': 'text-[#1e293b]',
  'bg-blue-600': 'bg-[#2563eb]',
  'text-gray-600': 'text-[#4b5563]',
  'text-slate-500': 'text-[#64748b]',
  'text-slate-600': 'text-[#475569]',
  'text-gray-900': 'text-[#111827]',
  'border-gray-900': 'border-[#111827]',
  'border-gray-300': 'border-[#d1d5db]',
  'text-gray-700': 'text-[#374151]',
  'text-gray-500': 'text-[#6b7280]',
  'text-gray-400': 'text-[#9ca3af]',
  'bg-gray-100': 'bg-[#f3f4f6]',
  'border-gray-200': 'border-[#e5e7eb]',
  'bg-gray-900': 'bg-[#111827]'
};

for (const [key, value] of Object.entries(map)) {
  code = code.split(key).join(value);
}

fs.writeFileSync('src/components/ResumePreview.tsx', code);
