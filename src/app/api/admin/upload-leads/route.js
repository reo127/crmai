import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Source from '@/models/Source';
import { authenticateUser } from '@/lib/auth';

// Robust CSV row parser — handles quoted fields with embedded commas/newlines
function parseCSVRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// Column aliases — flexible header matching
const COLUMN_ALIASES = {
  name:            ['name', 'full name', 'fullname', 'customer name', 'lead name'],
  phone:           ['phone', 'phone number', 'mobile', 'mobile number', 'contact', 'contact number'],
  email:           ['email', 'email address', 'e-mail', 'mail'],
  companyName:     ['company', 'company name', 'companyname', 'organization', 'org'],
  productInterest: ['product', 'product interest', 'productinterest', 'service', 'product/service', 'interest'],
  source:          ['source', 'lead source', 'leadsource', 'referral', 'channel'],
  leadValue:       ['value', 'lead value', 'leadvalue', 'amount', 'price', 'deal value', 'deal size'],
  priority:        ['priority', 'importance', 'level'],
  notes:           ['notes', 'comments', 'description', 'remarks', 'note'],
};

function buildColumnIndex(headers) {
  const index = {};
  headers.forEach((h, i) => {
    const lower = h.toLowerCase().replace(/['"]/g, '').trim();
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.includes(lower)) {
        if (index[field] === undefined) index[field] = i; // first match wins
      }
    }
  });
  return index;
}

export async function POST(request) {
  try {
    const user = await authenticateUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const formData = await request.formData();
    const csvFile = formData.get('csvFile');
    const assignedTo = formData.get('assignedTo') || null;

    if (!csvFile) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Validate file type
    const fileName = csvFile.name || '';
    if (!fileName.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only .csv files are accepted. Please upload a CSV file.' },
        { status: 400 }
      );
    }

    const csvContent = await csvFile.text();
    // Normalise line endings
    const lines = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      .split('\n').filter(l => l.trim() !== '');

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'The CSV file must have a header row and at least one data row.' },
        { status: 400 }
      );
    }

    const headers = parseCSVRow(lines[0]);
    const colIdx = buildColumnIndex(headers);

    // Must have at least name and phone columns
    if (colIdx.name === undefined) {
      return NextResponse.json(
        { error: 'Missing required column: "Name". Please check the CSV template and add a Name column.' },
        { status: 400 }
      );
    }
    if (colIdx.phone === undefined) {
      return NextResponse.json(
        { error: 'Missing required column: "Phone". Please check the CSV template and add a Phone column.' },
        { status: 400 }
      );
    }

    // Build source lookup cache
    const allSources = await Source.find({ isActive: true });
    const sourceCache = {};
    allSources.forEach(s => { sourceCache[s.name.toLowerCase()] = s._id; });

    // Get or create a default source for rows that don't specify one
    let defaultSourceId = allSources[0]?._id || null;
    if (!defaultSourceId) {
      const created = await Source.create({
        name: 'CSV Upload',
        description: 'Auto-created as default source for CSV imports',
        createdBy: user.userId,
        isActive: true,
      });
      defaultSourceId = created._id;
      sourceCache['csv upload'] = defaultSourceId;
    }

    const leadData = [];
    const rowErrors = [];
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const rowNum = i + 1; // 1-based, header is row 1
      const values = parseCSVRow(lines[i]);

      const get = (field) => {
        const idx = colIdx[field];
        return idx !== undefined && values[idx] ? values[idx].trim() : '';
      };

      const nameVal  = get('name');
      const phoneVal = get('phone');

      if (!nameVal) {
        rowErrors.push({ row: rowNum, field: 'Name', message: 'Name is empty — this field is required.' });
        skipped++;
        continue;
      }
      if (!phoneVal) {
        rowErrors.push({ row: rowNum, field: 'Phone', message: `Name "${nameVal}" has no phone number — required.` });
        skipped++;
        continue;
      }

      // Resolve source
      const sourceText = get('source').toLowerCase();
      let sourceId = defaultSourceId;
      if (sourceText) {
        if (sourceCache[sourceText]) {
          sourceId = sourceCache[sourceText];
        } else {
          // Auto-create new source
          try {
            const newSource = await Source.create({
              name: get('source'),
              description: `Auto-created from CSV import`,
              createdBy: user.userId,
              isActive: true,
            });
            sourceCache[sourceText] = newSource._id;
            sourceId = newSource._id;
          } catch {
            sourceId = defaultSourceId;
          }
        }
      }

      // Parse lead value
      const rawValue = get('leadValue').replace(/[₹$,\s]/g, '');
      const leadValue = rawValue ? (parseFloat(rawValue) || undefined) : undefined;

      // Validate lead value if present
      if (leadValue !== undefined && (isNaN(leadValue) || leadValue < 0)) {
        rowErrors.push({ row: rowNum, field: 'Lead Value', message: `"${get('leadValue')}" is not a valid number for Lead Value. Use numeric values like 50000.` });
        skipped++;
        continue;
      }

      // Priority
      const priorityRaw = get('priority').toLowerCase();
      const VALID_PRIORITIES = { low: 'Low', medium: 'Medium', high: 'High' };
      const priority = VALID_PRIORITIES[priorityRaw] || 'Medium';

      leadData.push({
        name: nameVal,
        phone: phoneVal,
        email: get('email'),
        companyName: get('companyName'),
        productInterest: get('productInterest') || 'General',
        source: sourceId,
        leadValue,
        assignedTo,
        priority,
        notes: get('notes'),
        createdBy: user.userId,
      });
    }

    // ── Phone-based duplicate detection ──────────────────────────────
    // Normalise all phones in the batch for lookup
    // Normalise phone: strip all non-digits, keep last 10 digits.
    // Handles +91, 0, 091 prefixes — e.g. +917980225159 and 7980225159 both → 7980225159
    const normalisePhone = (p) => {
      if (!p) return '';
      const digits = p.replace(/\D/g, '');
      return digits.length > 10 ? digits.slice(-10) : digits;
    };

    // 1. Detect duplicates within the CSV itself (same phone appears twice)
    const phonesSeen = new Map(); // normalised phone → first rowNum
    const intraduplicates = new Set(); // indices into leadData to skip
    leadData.forEach((ld, idx) => {
      const norm = normalisePhone(ld.phone);
      if (phonesSeen.has(norm)) {
        // This row is a duplicate of an earlier row in the same CSV
        const firstRow = phonesSeen.get(norm);
        rowErrors.push({
          row: idx + 2, // +2: header is row 1, leadData is 0-indexed
          field: 'Phone',
          message: `Duplicate phone "${ld.phone}" in this CSV — same number already appears in row ${firstRow}. Skipping.`,
        });
        intraduplicates.add(idx);
        skipped++;
      } else {
        phonesSeen.set(norm, idx + 2);
      }
    });

    // 2. Detect duplicates against the existing database
    const uniquePhones = [...phonesSeen.keys()]; // only non-intra-duplicate phones
    let existingPhoneMap = {}; // normalised phone → existing lead name
    if (uniquePhones.length > 0) {
      // Build regex patterns that match normalised forms
      const existingLeads = await Lead.find(
        { phone: { $in: leadData.filter((_, i) => !intraduplicates.has(i)).map(ld => ld.phone) } },
        { phone: 1, name: 1 }
      ).lean();
      existingLeads.forEach(el => {
        existingPhoneMap[normalisePhone(el.phone)] = el.name;
      });
    }

    // 3. Build the final insert list, skipping both kinds of duplicates
    const dbduplicateIndices = new Set();
    leadData.forEach((ld, idx) => {
      if (intraduplicates.has(idx)) return; // already flagged
      const norm = normalisePhone(ld.phone);
      if (existingPhoneMap[norm]) {
        rowErrors.push({
          row: idx + 2,
          field: 'Phone',
          message: `Phone "${ld.phone}" already exists in the CRM (lead: "${existingPhoneMap[norm]}"). Skipping duplicate.`,
        });
        dbduplicateIndices.add(idx);
        skipped++;
      }
    });

    const finalLeads = leadData.filter((_, idx) =>
      !intraduplicates.has(idx) && !dbduplicateIndices.has(idx)
    );
    // ── End duplicate detection ────────────────────────────────────────

    let inserted = 0;
    let duplicates = intraduplicates.size + dbduplicateIndices.size;
    if (finalLeads.length > 0) {
      const result = await Lead.insertMany(finalLeads, { ordered: false });
      inserted = result.length;
    }

    return NextResponse.json({
      success: true,
      inserted,
      skipped,
      duplicates,
      rowErrors,          // array of { row, field, message }
      total: lines.length - 1,
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json({ error: 'Server error during upload. Please try again.' }, { status: 500 });
  }
}
