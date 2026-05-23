const fs = require('fs');

let content = fs.readFileSync('src/components/ResumePreview.tsx', 'utf-8');

// Inject the helper at line 125
const helperCode = `
  const sectionOrderKeys = data.sectionOrder?.length 
    ? data.sectionOrder 
    : ['summary', 'experience', 'education', 'skills', 'courses', ...(data.customSections || []).map(s => s.id)];

  const getOrder = (key: string) => {
    const idx = sectionOrderKeys.indexOf(key);
    return idx === -1 ? 999 : idx;
  };
`;

content = content.replace('const renderModern = () => (', helperCode + '\\n  const renderModern = () => (');

// Now, for each section rendering piece, we want to inject style={{ order: getOrder('...') }}
// 1. experience:
// {experience.length > 0 && (\n        <div className=
// We can replace `<div className={` or `<div className="` or `<section className={` if following the condition.

// Actually, we must be careful.
// A simpler script to add order to specific div/sections:
content = content.replace(/\{experience.length > 0 && \(\s*<div/g, '{experience.length > 0 && (\\n        <div style={{ order: getOrder("experience") }}');
content = content.replace(/\{experience.length > 0 && \(\s*<section/g, '{experience.length > 0 && (\\n        <section style={{ order: getOrder("experience") }}');

content = content.replace(/\{education.length > 0 && \(\s*<div/g, '{education.length > 0 && (\\n        <div style={{ order: getOrder("education") }}');
content = content.replace(/\{education.length > 0 && \(\s*<section/g, '{education.length > 0 && (\\n        <section style={{ order: getOrder("education") }}');

content = content.replace(/\{skills.length > 0 && \(\s*<div/g, '{skills.length > 0 && (\\n        <div style={{ order: getOrder("skills") }}');
content = content.replace(/\{skills.length > 0 && \(\s*<section/g, '{skills.length > 0 && (\\n        <section style={{ order: getOrder("skills") }}');

content = content.replace(/\{\(data.courses \|\| \[\]\).length > 0 && \(\s*<div/g, '{(data.courses || []).length > 0 && (\\n        <div style={{ order: getOrder("courses") }}');
content = content.replace(/\{\(data.courses \|\| \[\]\).length > 0 && \(\s*<section/g, '{(data.courses || []).length > 0 && (\\n        <section style={{ order: getOrder("courses") }}');

content = content.replace(/\{data.courses && data.courses.length > 0 && \(\s*<div/g, '{data.courses && data.courses.length > 0 && (\\n        <div style={{ order: getOrder("courses") }}');
content = content.replace(/\{data.courses && data.courses.length > 0 && \(\s*<section/g, '{data.courses && data.courses.length > 0 && (\\n        <section style={{ order: getOrder("courses") }}');

content = content.replace(/\{\(data.customSections \|\| \[\]\).map\(\(section\) => \(\s*<div/g, '{(data.customSections || []).map((section) => (\\n        <div style={{ order: getOrder(section.id) }}');
content = content.replace(/\{\(data.customSections \|\| \[\]\).map\(\(section\) => \(\s*<section/g, '{(data.customSections || []).map((section) => (\\n        <section style={{ order: getOrder(section.id) }}');

content = content.replace(/\{data.customSections && data.customSections.map\(\(section\) => \(\s*<div/g, '{data.customSections && data.customSections.map((section) => (\\n        <div style={{ order: getOrder(section.id) }}');
content = content.replace(/\{data.customSections && data.customSections.map\(\(section, idx\) => \(\s*<div/g, '{data.customSections && data.customSections.map((section, idx) => (\\n        <div style={{ order: getOrder(section.id) }}');
content = content.replace(/\{data.customSections && data.customSections.map\(section => \(\s*<div/g, '{data.customSections && data.customSections.map((section) => (\\n        <div style={{ order: getOrder(section.id) }}');


// Also summary
// {personalInfo.summary && (\n      <div
content = content.replace(/\{personalInfo.summary && \(\s*<div/g, '{personalInfo.summary && (\\n        <div style={{ order: getOrder("summary") }}');

// Now we need to ensure that the container properties are \`flex flex-col\`
// renderModern main content
content = content.replace(/<div className={\`relative z-10 w-\\[70\\%\\] \b/, '<div className={`relative z-10 w-[70%] flex flex-col ');
// renderModern sidebar: already flex flex-col
// renderClassic
content = content.replace(/<div className={\`font-sans text-\\[black\\] bg-\\[#ffffff\\] w-\\[794px\\]/, '<div className={`flex flex-col font-sans text-[black] bg-[#ffffff] w-[794px]');
// renderMinimal main content (already flex flex-col?)
// <div className={`col-span-8 ${isDense ? 'space-y-5' : 'space-y-8'}`}>
content = content.replace(/<div className={\`col-span-8 \b/, '<div className={`flex flex-col col-span-8 ');
// renderMinimal sidebar
content = content.replace(/<div className={\`col-span-4 \b/, '<div className={`flex flex-col col-span-4 ');

// renderCreative main
content = content.replace(/<div className={\`relative z-10 w-\\[65\\%\\] pl-6 pr-8 pt-8 pb-6 flex flex-col shrink-0\`}>/, '<div className={`relative z-10 w-[65%] pl-6 pr-8 pt-8 pb-6 flex flex-col shrink-0`}>');
// renderExecutive main
content = content.replace(/<div className={\`flex-1 pl-8 \b/, '<div className={`flex-1 pl-8 flex flex-col ');
// renderExecutive has its roots already flex flex-col mostly. But wait, Executive has two columns.
// left col: <div className={`w-[32%] bg-[#0f172a] text-white
content = content.replace(/<div className={\`w-\\[32\\%\\] bg-\\[#0f172a\\] text-white \b/, '<div className={`flex flex-col w-[32%] bg-[#0f172a] text-white ');

// renderCorporate
// main is already flex flex-col. wait, it's <main className="flex-1 mt-6">
content = content.replace(/<main className="flex-1 mt-6 \b/, '<main className="flex flex-col flex-1 mt-6 ');

// renderDetailed
content = content.replace(/<main className="flex-1 pb-8 \b/, '<main className="flex flex-col flex-1 pb-8 ');

// renderAcademic
// <main className="space-y-6 pt-2 flex flex-col
content = content.replace(/<main className="space-y-6 pt-2/, '<main className="flex flex-col space-y-6 pt-2');


fs.writeFileSync('src/components/ResumePreview.tsx', content);

console.log("Done");
