import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const documents = [
  'README.md',
  'docs/ARCHITECTURE.md',
  'docs/INSTALLATION.md',
  'docs/FUTURE_IMPROVEMENTS.md',
  'docs/CHANGELOG.md',
  'reports/FINAL_REPORT.md',
  'reports/PROPOSAL.md',
  'reports/TEST_REPORT.md',
  'interview/PROJECT_SUMMARY.md',
  'interview/INTERVIEW_NOTES.md',
  'interview/CHALLENGES.md',
  'interview/RESUME_POINTS.md',
  'interview/ELEVATOR_PITCH.md',
  'interview/FAQ.md'
];

function escapeLatex(value) {
  return value
    .replaceAll('\\', '\\textbackslash{}')
    .replaceAll('&', '\\&')
    .replaceAll('%', '\\%')
    .replaceAll('$', '\\$')
    .replaceAll('#', '\\#')
    .replaceAll('_', '\\_')
    .replaceAll('{', '\\{')
    .replaceAll('}', '\\}')
    .replaceAll('~', '\\textasciitilde{}')
    .replaceAll('^', '\\textasciicircum{}');
}

function renderInline(value) {
  const parts = value.split(/(`[^`]+`|\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return `\\texttt{${escapeLatex(part.slice(1, -1))}}`;
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return `${escapeLatex(linkMatch[1])} (${escapeLatex(linkMatch[2])})`;
    }

    return escapeLatex(part);
  }).join('');
}

function closeList(output, activeList) {
  if (activeList) {
    output.push(`\\end{${activeList}}`);
  }
  return null;
}

function markdownToLatex(markdown) {
  const output = [];
  let activeList = null;
  let inCodeBlock = false;

  for (const line of markdown.split(/\r?\n/)) {
    if (line.startsWith('```')) {
      activeList = closeList(output, activeList);
      output.push(inCodeBlock ? '\\end{verbatim}' : '\\begin{verbatim}');
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      output.push(line);
      continue;
    }

    if (line.trim() === '') {
      activeList = closeList(output, activeList);
      output.push('');
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      activeList = closeList(output, activeList);
      const command = headingMatch[1].length === 1 ? 'section*' : headingMatch[1].length === 2 ? 'subsection*' : 'subsubsection*';
      output.push(`\\${command}{${renderInline(headingMatch[2])}}`);
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      if (activeList !== 'itemize') {
        activeList = closeList(output, activeList);
        activeList = 'itemize';
        output.push('\\begin{itemize}');
      }
      output.push(`\\item ${renderInline(bulletMatch[1])}`);
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      if (activeList !== 'enumerate') {
        activeList = closeList(output, activeList);
        activeList = 'enumerate';
        output.push('\\begin{enumerate}');
      }
      output.push(`\\item ${renderInline(orderedMatch[1])}`);
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      activeList = closeList(output, activeList);
      output.push('\\hrulefill');
      continue;
    }

    activeList = closeList(output, activeList);
    output.push(renderInline(line));
  }

  closeList(output, activeList);
  if (inCodeBlock) {
    output.push('\\end{verbatim}');
  }

  return output.join('\n');
}

function documentSource(title, body) {
  return `\\documentclass[11pt]{article}
\\usepackage[margin=0.9in]{geometry}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}
\\usepackage{enumitem}
\\setlist{nosep,leftmargin=*}
\\setlength{\\parskip}{0.65em}
\\setlength{\\parindent}{0pt}
\\begin{document}
\\begin{center}
{\\LARGE\\bfseries ${escapeLatex(title)}}\\par
\\vspace{0.4em}
{\\small Generated from the repository Markdown source}\\par
\\end{center}
\\hrule
\\vspace{1em}
${body}
\\end{document}
`;
}

async function renderDocument(documentPath) {
  const absolutePath = resolve(documentPath);
  const markdown = await readFile(absolutePath, 'utf8');
  const title = markdown.match(/^#\s+(.+)$/m)?.[1] ?? basename(documentPath, '.md');
  const tempDirectory = await mkdtemp(join(tmpdir(), 'glyphr-monocam-pdf-'));
  const outputDirectory = dirname(absolutePath);
  const texName = `${basename(documentPath, '.md')}.tex`;
  const texPath = join(tempDirectory, texName);

  try {
    await writeFile(texPath, documentSource(title, markdownToLatex(markdown)), 'utf8');
    await execFileAsync('tectonic', ['--outdir', outputDirectory, texPath]);
    process.stdout.write(`Generated ${join(outputDirectory, `${basename(documentPath, '.md')}.pdf`)}\n`);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

for (const documentPath of documents) {
  try {
    await renderDocument(documentPath);
  } catch (error) {
    if (error.code === 'ENOENT' && documentPath.startsWith('interview/')) {
      process.stdout.write(`Skipped private document not present in this clone: ${documentPath}\n`);
      continue;
    }

    throw error;
  }
}
