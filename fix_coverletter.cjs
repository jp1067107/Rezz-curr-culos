const fs = require('fs');
let content = fs.readFileSync('src/components/CoverLetterPreview.tsx', 'utf-8');

// Update import
content = content.replace("import { Mail, Phone, MapPin } from", "import { Mail, Phone, MapPin, Linkedin } from");

// 1. Clean
content = content.replace(
  `        {personalInfo.location && (
          <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#3b82f6]" /> {personalInfo.location}</div>
        )}`,
  `        {personalInfo.location && (
          <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#3b82f6]" /> {personalInfo.location}</div>
        )}
        {personalInfo.linkedin && (
          <div className="flex items-center gap-1.5"><Linkedin className="w-4 h-4 text-[#3b82f6]" /> {personalInfo.linkedin}</div>
        )}`
);


// 2. Classic
content = content.replace(
  `            {personalInfo.email && <span>{personalInfo.email}</span>}
          </div>`,
  `            {personalInfo.email && <span>{personalInfo.email}</span>}
            {(personalInfo.email && personalInfo.linkedin) && <span>|</span>}
            {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
          </div>`
);

// 3. Modern
content = content.replace(
  `          {personalInfo.location && <span>• {personalInfo.location}</span>}
        </div>`,
  `          {personalInfo.location && <span>• {personalInfo.location}</span>}
          {personalInfo.linkedin && <span>• {personalInfo.linkedin}</span>}
        </div>`
);

fs.writeFileSync('src/components/CoverLetterPreview.tsx', content);
console.log('CoverLetterPreview updated');
