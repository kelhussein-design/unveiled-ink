#!/usr/bin/env node
// Build SPANISH_REVIEW.docx — a side-by-side EN/ES proofreading document for Sulay.
// Landscape US Letter, 3-column table per row: Location | English | Spanish (draft).

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, PageOrientation, HeadingLevel, BorderStyle, WidthType, ShadingType,
  LevelFormat,
} = require("docx");

const DATA_DIR = path.join(__dirname, "data");
function load(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), "utf-8"));
}

const contentEn = load("content.en.json");
const contentEs = load("content.es.json");
const booksEn = load("books.en.json");
const booksEs = load("books.es.json");
const testimonialsEn = load("testimonials.en.json");
const testimonialsEs = load("testimonials.es.json");

// Landscape US Letter: width 15840, height 12240. 1" margins = 1440 DXA each side.
// Content width = 15840 - 2880 = 12960 DXA.
const CONTENT_WIDTH = 12960;
const COL = [2500, 5230, 5230]; // location / EN / ES — sum = 12960
const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const borders = { top: border, bottom: border, left: border, right: border };

// Strip HTML tags from strings — JSON contains some <strong>, <br>, <em>
function stripHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// Paragraph builder. Supports \n in text — splits into multiple paragraphs.
function para(text, opts = {}) {
  const { bold = false, italic = false, size = 20, color = "2A2523" } = opts;
  const lines = String(text ?? "").split("\n");
  return lines.map(line =>
    new Paragraph({
      children: [new TextRun({ text: line, bold, italic, size, color, font: "Calibri" })],
      spacing: { after: 60 },
    })
  );
}

function cell(paragraphs, { shading, width } = {}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: shading ? { fill: shading, type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: paragraphs,
  });
}

function headerRow(labels) {
  return new TableRow({
    tableHeader: true,
    children: labels.map((label, i) =>
      cell(para(label, { bold: true, size: 20, color: "FFFFFF" }), {
        shading: "2A2523",
        width: COL[i],
      })
    ),
  });
}

function dataRow(loc, en, es) {
  return new TableRow({
    children: [
      cell(para(loc, { bold: true, size: 18, color: "3D3835" }), { width: COL[0], shading: "F5F0EB" }),
      cell(para(stripHtml(en)), { width: COL[1] }),
      cell(para(stripHtml(es)), { width: COL[2] }),
    ],
  });
}

// Section heading paragraph
function sectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 28, color: "2A2523", font: "Calibri" })],
    spacing: { before: 360, after: 180 },
  });
}

function buildTable(rows) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: COL,
    rows: [headerRow(["Location", "English", "Spanish (draft)"]), ...rows],
  });
}

const body = [];

// ============================================================
// Title page
// ============================================================
body.push(new Paragraph({
  children: [new TextRun({ text: "Unveiled Ink", bold: true, size: 44, color: "2A2523", font: "Calibri" })],
  alignment: AlignmentType.CENTER,
  spacing: { before: 800, after: 120 },
}));
body.push(new Paragraph({
  children: [new TextRun({ text: "Spanish Translation Review", size: 32, color: "6B6662", italics: true, font: "Calibri" })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 600 },
}));
body.push(new Paragraph({
  children: [new TextRun({ text: "Draft for Sulay's proofreading", size: 22, color: "8A8480", font: "Calibri" })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 800 },
}));
body.push(new Paragraph({
  children: [new TextRun({
    text: "This document shows every English string on the Unveiled Ink site alongside its Spanish draft translation. The translations are AI-generated and need your review before going live. Mark up this document (comments, tracked changes, or redline in any color) and the edits will be applied to the JSON data files. Italic or bold formatting shown in English is preserved in the site rendering; the strip here is just for readability.",
    size: 22, color: "3D3835", font: "Calibri"
  })],
  spacing: { after: 200 },
}));
body.push(new Paragraph({
  children: [new TextRun({
    text: "Style choices worth weighing in on:",
    bold: true, size: 22, color: "3D3835", font: "Calibri"
  })],
  spacing: { before: 200, after: 100 },
}));
body.push(new Paragraph({
  numbering: { reference: "bullets", level: 0 },
  children: [new TextRun({ text: "Uses tú throughout (not usted) — matches the warm, personal voice of the English", size: 22, color: "3D3835", font: "Calibri" })],
}));
body.push(new Paragraph({
  numbering: { reference: "bullets", level: 0 },
  children: [new TextRun({ text: "Neutral Latin American Spanish — no regional idioms", size: 22, color: "3D3835", font: "Calibri" })],
}));
body.push(new Paragraph({
  numbering: { reference: "bullets", level: 0 },
  children: [new TextRun({ text: "Book titles, author names, and publication names stay in their original language", size: 22, color: "3D3835", font: "Calibri" })],
}));
body.push(new Paragraph({
  numbering: { reference: "bullets", level: 0 },
  children: [new TextRun({ text: "Book subtitles like \"A Novel\" → \"Una novela\", \"A Memoir\" → \"Unas memorias\" — full list in the Subtitles section", size: 22, color: "3D3835", font: "Calibri" })],
}));

// ============================================================
// UI chrome
// ============================================================
body.push(sectionHeading("UI chrome"));
{
  const rows = [];
  const uiEn = contentEn.ui;
  const uiEs = contentEs.ui;
  rows.push(dataRow("Skip link", uiEn.skip_to_content, uiEs.skip_to_content));
  rows.push(dataRow("Nav: Portfolio", uiEn.nav.portfolio, uiEs.nav.portfolio));
  rows.push(dataRow("Nav: Testimonials", uiEn.nav.testimonials, uiEs.nav.testimonials));
  rows.push(dataRow("Nav: Philosophy", uiEn.nav.philosophy, uiEs.nav.philosophy));
  rows.push(dataRow("Nav: About", uiEn.nav.about, uiEs.nav.about));
  rows.push(dataRow("Nav: Services", uiEn.nav.services, uiEs.nav.services));
  rows.push(dataRow("Nav: Contact", uiEn.nav.contact, uiEs.nav.contact));
  rows.push(dataRow("Hero: scroll", uiEn.hero.scroll, uiEs.hero.scroll));
  rows.push(dataRow("Portfolio: label", uiEn.portfolio.section_label, uiEs.portfolio.section_label));
  rows.push(dataRow("Portfolio: title", uiEn.portfolio.title, uiEs.portfolio.title));
  rows.push(dataRow("Portfolio: subtitle", uiEn.portfolio.subtitle, uiEs.portfolio.subtitle));
  rows.push(dataRow("Filter: all", uiEn.portfolio.filters.all, uiEs.portfolio.filters.all));
  rows.push(dataRow("Filter: recent", uiEn.portfolio.filters.recent, uiEs.portfolio.filters.recent));
  rows.push(dataRow("Filter: literary", uiEn.portfolio.filters.literary, uiEs.portfolio.filters.literary));
  rows.push(dataRow("Filter: popular", uiEn.portfolio.filters.popular, uiEs.portfolio.filters.popular));
  rows.push(dataRow("Filter: nonfiction", uiEn.portfolio.filters.nonfiction, uiEs.portfolio.filters.nonfiction));
  rows.push(dataRow("Forthcoming label", uiEn.portfolio.forthcoming_label, uiEs.portfolio.forthcoming_label));
  rows.push(dataRow("Testimonials label", uiEn.testimonials.section_label, uiEs.testimonials.section_label));
  rows.push(dataRow("About: education label", uiEn.about_labels.education, uiEs.about_labels.education));
  rows.push(dataRow("About: languages label", uiEn.about_labels.languages, uiEs.about_labels.languages));
  rows.push(dataRow("About: location label", uiEn.about_labels.location, uiEs.about_labels.location));
  rows.push(dataRow("Contact: email label", uiEn.contact_labels.email, uiEs.contact_labels.email));
  rows.push(dataRow("Contact: location label", uiEn.contact_labels.location, uiEs.contact_labels.location));
  rows.push(dataRow("Form: first name", uiEn.form.first_name, uiEs.form.first_name));
  rows.push(dataRow("Form: last name", uiEn.form.last_name, uiEs.form.last_name));
  rows.push(dataRow("Form: email", uiEn.form.email, uiEs.form.email));
  rows.push(dataRow("Form: subject", uiEn.form.subject, uiEs.form.subject));
  rows.push(dataRow("Form: message", uiEn.form.message, uiEs.form.message));
  rows.push(dataRow("Form: referral question", uiEn.form.referral, uiEs.form.referral));
  rows.push(dataRow("Referral: placeholder", uiEn.form.referral_placeholder, uiEs.form.referral_placeholder));
  rows.push(dataRow("Referral: Web Search", uiEn.form.referral_search, uiEs.form.referral_search));
  rows.push(dataRow("Referral: Referral", uiEn.form.referral_referral, uiEs.form.referral_referral));
  rows.push(dataRow("Referral: Social Media", uiEn.form.referral_social, uiEs.form.referral_social));
  rows.push(dataRow("Referral: Other", uiEn.form.referral_other, uiEs.form.referral_other));
  rows.push(dataRow("Form: submit", uiEn.form.submit, uiEs.form.submit));
  rows.push(dataRow("Footer: tagline", uiEn.footer.tagline, uiEs.footer.tagline));
  rows.push(dataRow("Footer: copyright", uiEn.footer.copyright, uiEs.footer.copyright));
  body.push(buildTable(rows));
}

// ============================================================
// Head meta
// ============================================================
body.push(sectionHeading("Browser tab + social media preview"));
{
  const rows = [];
  rows.push(dataRow("Page title", contentEn.meta.page_title, contentEs.meta.page_title));
  rows.push(dataRow("Meta description", contentEn.meta.page_description, contentEs.meta.page_description));
  rows.push(dataRow("OG title", contentEn.meta.og_title, contentEs.meta.og_title));
  rows.push(dataRow("OG description", contentEn.meta.og_description, contentEs.meta.og_description));
  rows.push(dataRow("Twitter title", contentEn.meta.twitter_title, contentEs.meta.twitter_title));
  rows.push(dataRow("Twitter description", contentEn.meta.twitter_description, contentEs.meta.twitter_description));
  body.push(buildTable(rows));
}

// ============================================================
// Hero
// ============================================================
body.push(sectionHeading("Hero section"));
{
  const rows = [];
  rows.push(dataRow("Eyebrow", contentEn.hero.eyebrow, contentEs.hero.eyebrow));
  rows.push(dataRow("Headline 1", contentEn.hero.headline_1, contentEs.hero.headline_1));
  rows.push(dataRow("Headline 2 (italic, blue)", contentEn.hero.headline_2, contentEs.hero.headline_2));
  body.push(buildTable(rows));
}

// ============================================================
// About
// ============================================================
body.push(sectionHeading("About Sulay"));
{
  const rows = [];
  rows.push(dataRow("Section label", contentEn.about.section_label, contentEs.about.section_label));
  rows.push(dataRow("Section title", contentEn.about.title, contentEs.about.title));
  contentEn.about.paragraphs.forEach((p, i) => {
    rows.push(dataRow(`Paragraph ${i + 1}`, p, contentEs.about.paragraphs[i]));
  });
  rows.push(dataRow("Photo credit", contentEn.about.photo_credit, contentEs.about.photo_credit));
  rows.push(dataRow("Education", contentEn.about.details.education, contentEs.about.details.education));
  rows.push(dataRow("Languages", contentEn.about.details.languages, contentEs.about.details.languages));
  rows.push(dataRow("Location", contentEn.about.details.location, contentEs.about.details.location));
  body.push(buildTable(rows));
}

// ============================================================
// Philosophy
// ============================================================
body.push(sectionHeading("Editorial Philosophy"));
{
  const rows = [];
  rows.push(dataRow("Section label", contentEn.philosophy.section_label, contentEs.philosophy.section_label));
  rows.push(dataRow("Section title", contentEn.philosophy.title, contentEs.philosophy.title));
  rows.push(dataRow("Pull quote", contentEn.philosophy.quote, contentEs.philosophy.quote));
  contentEn.philosophy.paragraphs.forEach((p, i) => {
    rows.push(dataRow(`Paragraph ${i + 1}`, p, contentEs.philosophy.paragraphs[i]));
  });
  body.push(buildTable(rows));
}

// ============================================================
// Key Skills
// ============================================================
body.push(sectionHeading("Key Skills"));
{
  const rows = [];
  rows.push(dataRow("Section label", contentEn.skills.section_label, contentEs.skills.section_label));
  rows.push(dataRow("Section title", contentEn.skills.title, contentEs.skills.title));
  contentEn.skills.items.forEach((s, i) => {
    const ses = contentEs.skills.items[i];
    rows.push(dataRow(`Skill ${i + 1}: name`, s.name, ses.name));
    rows.push(dataRow(`Skill ${i + 1}: description`, s.description, ses.description));
  });
  body.push(buildTable(rows));
}

// ============================================================
// Services
// ============================================================
body.push(sectionHeading("Services"));
{
  const rows = [];
  rows.push(dataRow("Section label", contentEn.services.section_label, contentEs.services.section_label));
  rows.push(dataRow("Section title", contentEn.services.title, contentEs.services.title));
  rows.push(dataRow("Subtitle", contentEn.services.subtitle, contentEs.services.subtitle));
  contentEn.services.items.forEach((svc, i) => {
    const ses = contentEs.services.items[i];
    rows.push(dataRow(`Service ${svc.number}: name`, svc.name, ses.name));
    rows.push(dataRow(`Service ${svc.number}: description`, svc.description, ses.description));
    svc.features.forEach((feat, j) => {
      rows.push(dataRow(`Service ${svc.number}: feature ${j + 1}`, feat, ses.features[j]));
    });
  });
  rows.push(dataRow("Services note", contentEn.services.note, contentEs.services.note));
  body.push(buildTable(rows));
}

// ============================================================
// Contact
// ============================================================
body.push(sectionHeading("Contact"));
{
  const rows = [];
  rows.push(dataRow("Section label", contentEn.contact.section_label, contentEs.contact.section_label));
  rows.push(dataRow("Section title", contentEn.contact.title, contentEs.contact.title));
  rows.push(dataRow("Description", contentEn.contact.description, contentEs.contact.description));
  body.push(buildTable(rows));
}

// ============================================================
// Testimonials
// ============================================================
body.push(sectionHeading("Testimonials"));
{
  const rows = [];
  testimonialsEn.testimonials.forEach((t, i) => {
    const tes = testimonialsEs.testimonials[i];
    rows.push(dataRow(`Testimonial ${i + 1}: ${t.author} — quote`, t.quote, tes.quote));
    rows.push(dataRow(`Testimonial ${i + 1}: ${t.author} — work line`, t.work, tes.work));
  });
  body.push(buildTable(rows));
}

// ============================================================
// Subtitles
// ============================================================
body.push(sectionHeading("Book subtitles"));
body.push(new Paragraph({
  children: [new TextRun({ text: "Each book in the portfolio has a subtitle (e.g., \"A Novel\", \"A Memoir\"). These are shown in the book detail modal under the title, in italic. Below is every unique subtitle used across the 44 books and its Spanish translation.", size: 22, color: "3D3835", italics: true, font: "Calibri" })],
  spacing: { after: 160 },
}));
{
  const seen = new Map(); // en subtitle -> es subtitle
  const slugsByEn = new Map();
  for (const slug of Object.keys(booksEn.books)) {
    const en = booksEn.books[slug].subtitle || "";
    const es = booksEs.books[slug].subtitle || "";
    if (!en) continue;
    if (!seen.has(en)) {
      seen.set(en, es);
      slugsByEn.set(en, []);
    }
    slugsByEn.get(en).push(slug);
  }
  const rows = [];
  for (const [en, es] of seen) {
    const slugs = slugsByEn.get(en);
    const appliedTo = slugs.length > 3 ? `${slugs.length} books` : slugs.join(", ");
    rows.push(dataRow(`Used in: ${appliedTo}`, en, es));
  }
  body.push(buildTable(rows));
}

// ============================================================
// Book descriptions
// ============================================================
body.push(sectionHeading("Book descriptions"));
body.push(new Paragraph({
  children: [new TextRun({ text: "Book titles, author names, and categories remain in English. Only descriptions and quote text are translated. Books appear in priority order first (as they appear on the site), then the rest.", size: 22, color: "3D3835", italics: true, font: "Calibri" })],
  spacing: { after: 160 },
}));
{
  const rows = [];
  const ordered = [...booksEn.priority, ...Object.keys(booksEn.books).filter(s => !booksEn.priority.includes(s))];
  ordered.forEach(slug => {
    const en = booksEn.books[slug];
    const es = booksEs.books[slug];
    if (!en || !es) return;
    const loc = `${en.title}\n(${en.author})`;
    rows.push(dataRow(loc + "\n— description", en.description, es.description));
    if (en.quotes && en.quotes.length) {
      en.quotes.forEach((q, i) => {
        rows.push(dataRow(`${en.title}\n— quote ${i + 1}`, `"${q.text}"\n— ${q.source}`, `"${es.quotes[i].text}"\n— ${es.quotes[i].source}`));
      });
    }
  });
  body.push(buildTable(rows));
}

// ============================================================
// Assemble document
// ============================================================
const doc = new Document({
  creator: "Unveiled Ink build",
  title: "Spanish Translation Review",
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Calibri" },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
    }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840, orientation: PageOrientation.LANDSCAPE },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    children: body,
  }],
});

Packer.toBuffer(doc).then(buf => {
  const out = path.join(__dirname, "SPANISH_REVIEW.docx");
  fs.writeFileSync(out, buf);
  const size = (fs.statSync(out).size / 1024).toFixed(1);
  console.log(`Wrote ${out} (${size} KB)`);
});
