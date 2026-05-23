const fs = require('fs');

let content = fs.readFileSync('src/components/ResumePreview.tsx', 'utf-8');

function injectHelper(source) {
  const helper = `
  const sectionOrderKeys = data.sectionOrder?.length 
    ? data.sectionOrder 
    : ['experience', 'education', 'skills', 'courses', ...(data.customSections || []).map(s => s.id)];

  const renderSection = (key, blocks) => {
    if (blocks[key]) return <React.Fragment key={key}>{blocks[key]}</React.Fragment>;
    return null;
  };
`;
  return source.replace(/const renderModern = \(\) => \(/, helper + '\n  const renderModern = () => (');
}

/*
For single column layouts like Classic, Detailed, Academic, Executive, Corporate:
We can find the sequence of:
      {experience.length > 0 && (
          ...
      )}
      ...
      {(data.customSections || []).map((section) => (
          ...
      ))}

And rewrite it. But this is too brittle.
*/

// Let's just do it manually with multi_edit_file for specific chunks.
