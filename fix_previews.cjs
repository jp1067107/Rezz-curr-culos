const fs = require('fs');

let content = fs.readFileSync('src/components/ResumePreview.tsx', 'utf-8');

// 1. modern
content = content.replace(
  `          {personalInfo.location && (
            <div className={\`flex items-start gap-2 \${t.sidebarSmall}\`}>
              <MapPin className={\`\${isDense ? 'w-3 h-3' : 'w-4 h-4'} text-[#94a3b8] shrink-0 mt-0.5\`} />
              <span>{personalInfo.location}</span>
            </div>
          )}`,
  `          {personalInfo.location && (
            <div className={\`flex items-start gap-2 \${t.sidebarSmall}\`}>
              <MapPin className={\`\${isDense ? 'w-3 h-3' : 'w-4 h-4'} text-[#94a3b8] shrink-0 mt-0.5\`} />
              <span>{personalInfo.location}</span>
            </div>
          )}
          {personalInfo.linkedin && (
            <div className={\`flex items-start gap-2 \${t.sidebarSmall}\`}>
              <Linkedin className={\`\${isDense ? 'w-3 h-3' : 'w-4 h-4'} text-[#94a3b8] shrink-0 mt-0.5\`} />
              <span>{personalInfo.linkedin}</span>
            </div>
          )}`
);


// 4. executive
content = content.replace(
  `            {personalInfo.location && (
              <div className={\`flex items-start gap-2 \${t.sidebarSmall}\`}>
                <MapPin className={\`\${isDense ? 'w-3 h-3 mt-0' : 'w-3.5 h-3.5 mt-0.5'} text-[#fbbf24] shrink-0\`} />
                <span>{personalInfo.location}</span>
              </div>
            )}`,
  `            {personalInfo.location && (
              <div className={\`flex items-start gap-2 \${t.sidebarSmall}\`}>
                <MapPin className={\`\${isDense ? 'w-3 h-3 mt-0' : 'w-3.5 h-3.5 mt-0.5'} text-[#fbbf24] shrink-0\`} />
                <span>{personalInfo.location}</span>
              </div>
            )}
            {personalInfo.linkedin && (
              <div className={\`flex items-start gap-2 \${t.sidebarSmall}\`}>
                <Linkedin className={\`\${isDense ? 'w-3 h-3 mt-0' : 'w-3.5 h-3.5 mt-0.5'} text-[#fbbf24] shrink-0\`} />
                <span>{personalInfo.linkedin}</span>
              </div>
            )}`
);


fs.writeFileSync('src/components/ResumePreview.tsx', content);
console.log('Fixed ResumePreview changes applied');
