const fs = require('fs');

let content = fs.readFileSync('src/components/ResumePreview.tsx', 'utf-8');

// Update import
content = content.replace("import { Mail, Phone, MapPin, User", "import { Mail, Phone, MapPin, Linkedin, User");

// 1. modern
content = content.replace(
  `          {personalInfo.location && (
            <div className={\`flex items-start gap-2 \${t.sidebarSmall}\`}>
              <MapPin className={\`\${isDense ? 'w-3 h-3' : 'w-4 h-4'} text-[#94a3b8] shrink-0 mt-0.5\`} />
              <span className="break-all">{personalInfo.location}</span>
            </div>
          )}`,
  `          {personalInfo.location && (
            <div className={\`flex items-start gap-2 \${t.sidebarSmall}\`}>
              <MapPin className={\`\${isDense ? 'w-3 h-3' : 'w-4 h-4'} text-[#94a3b8] shrink-0 mt-0.5\`} />
              <span className="break-all">{personalInfo.location}</span>
            </div>
          )}
          {personalInfo.linkedin && (
            <div className={\`flex items-start gap-2 \${t.sidebarSmall}\`}>
              <Linkedin className={\`\${isDense ? 'w-3 h-3' : 'w-4 h-4'} text-[#94a3b8] shrink-0 mt-0.5\`} />
              <span className="break-all">{personalInfo.linkedin}</span>
            </div>
          )}`
);

// 2. classic
content = content.replace(
  `          {personalInfo.email && <span>{personalInfo.email}</span>}`,
  `          {personalInfo.email && <span>{personalInfo.email}</span>}
          {(personalInfo.email && personalInfo.linkedin) && <span>|</span>}
          {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}`
);

// 3. minimal
content = content.replace(
  `          {personalInfo.location && <div className="text-[#9ca3af]">{personalInfo.location}</div>}`,
  `          {personalInfo.location && <div className="text-[#9ca3af]">{personalInfo.location}</div>}
          {personalInfo.linkedin && <div className="text-[#9ca3af]">{personalInfo.linkedin}</div>}`
);

// 4. executive
content = content.replace(
  `            {personalInfo.location && (
              <div className={\`flex items-start gap-2 \${t.sidebarSmall}\`}>
                <MapPin className={\`\${isDense ? 'w-3 h-3 mt-0' : 'w-3.5 h-3.5 mt-0.5'} text-[#fbbf24] shrink-0\`} />
                <span className="break-all">{personalInfo.location}</span>
              </div>
            )}`,
  `            {personalInfo.location && (
              <div className={\`flex items-start gap-2 \${t.sidebarSmall}\`}>
                <MapPin className={\`\${isDense ? 'w-3 h-3 mt-0' : 'w-3.5 h-3.5 mt-0.5'} text-[#fbbf24] shrink-0\`} />
                <span className="break-all">{personalInfo.location}</span>
              </div>
            )}
            {personalInfo.linkedin && (
              <div className={\`flex items-start gap-2 \${t.sidebarSmall}\`}>
                <Linkedin className={\`\${isDense ? 'w-3 h-3 mt-0' : 'w-3.5 h-3.5 mt-0.5'} text-[#fbbf24] shrink-0\`} />
                <span className="break-all">{personalInfo.linkedin}</span>
              </div>
            )}`
);

// 5. corporate
content = content.replace(
  `          {personalInfo.location && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#fbbf24]"/> {personalInfo.location}</div>}`,
  `          {personalInfo.location && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#fbbf24]"/> {personalInfo.location}</div>}
          {personalInfo.linkedin && <div className="flex items-center gap-1.5"><Linkedin className="w-3.5 h-3.5 text-[#fbbf24]"/> {personalInfo.linkedin}</div>}`
);

// 6. bold
content = content.replace(
  `              {personalInfo.location && <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#cbd5e1]"/> {personalInfo.location}</div>}`,
  `              {personalInfo.location && <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#cbd5e1]"/> {personalInfo.location}</div>}
              {personalInfo.linkedin && <div className="flex items-center gap-1.5"><Linkedin className="w-4 h-4 text-[#cbd5e1]"/> {personalInfo.linkedin}</div>}`
);

// 7. clean
content = content.replace(
  `          {personalInfo.location && <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#2563eb]"/> {personalInfo.location}</div>}`,
  `          {personalInfo.location && <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#2563eb]"/> {personalInfo.location}</div>}
          {personalInfo.linkedin && <div className="flex items-center gap-1.5"><Linkedin className="w-4 h-4 text-[#2563eb]"/> {personalInfo.linkedin}</div>}`
);

// 8. modern2
content = content.replace(
  `            {personalInfo.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400"/> {personalInfo.location}</span>}`,
  `            {personalInfo.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400"/> {personalInfo.location}</span>}
            {personalInfo.linkedin && <span className="flex items-center gap-1"><Linkedin className="w-3.5 h-3.5 text-gray-400"/> {personalInfo.linkedin}</span>}`
);

fs.writeFileSync('src/components/ResumePreview.tsx', content);
console.log('ResumePreview changes applied');
