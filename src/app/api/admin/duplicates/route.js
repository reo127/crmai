import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import { authenticateUser } from '@/lib/auth';

// ── Normalise phone: strip all non-digits, then keep only the LAST 10 digits.
// This handles country code prefixes like +91, 0, 091, 1, etc.
// Examples:
//   +917980225159  →  917980225159  → last 10 → 7980225159
//    7980225159    →  7980225159    → exactly 10 → 7980225159   ✓ MATCH
//   +1-555-123-4567 → 15551234567  → last 10 → 5551234567
function normalisePhone(p) {
  if (!p) return '';
  const digits = p.replace(/\D/g, ''); // strip everything except 0-9
  return digits.length > 10 ? digits.slice(-10) : digits;
}

// ── GET /api/admin/duplicates ─────────────────────────────────────────────────
// Returns groups of leads that share the same normalised phone number.
export async function GET(request) {
  try {
    const user = await authenticateUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch every lead's _id + phone (lightweight)
    const allLeads = await Lead.find({}, { _id: 1, phone: 1 }).lean();

    // Group by normalised phone in JavaScript
    const phoneGroups = {}; // normPhone → [_id, ...]
    allLeads.forEach((lead) => {
      const norm = normalisePhone(lead.phone);
      if (!norm) return;
      if (!phoneGroups[norm]) phoneGroups[norm] = [];
      phoneGroups[norm].push(lead._id);
    });

    // Keep only groups with 2+ leads (true duplicates)
    const duplicateEntries = Object.entries(phoneGroups)
      .filter(([, ids]) => ids.length > 1)
      .sort((a, b) => b[1].length - a[1].length); // most duplicates first

    if (duplicateEntries.length === 0) {
      return NextResponse.json({ groups: [], total: 0 });
    }

    // Fetch full lead details for all duplicate IDs in one query
    const allIds = duplicateEntries.flatMap(([, ids]) => ids);
    const leads = await Lead.find({ _id: { $in: allIds } })
      .populate('source', 'name')
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name')
      .lean();

    const leadMap = {};
    leads.forEach((l) => { leadMap[l._id.toString()] = l; });

    const groups = duplicateEntries.map(([normPhone, ids]) => ({
      phone: normPhone,
      count: ids.length,
      leads: ids
        .map((id) => leadMap[id.toString()])
        .filter(Boolean)
        // Always sort oldest first so index-0 is always the oldest entry
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    }));

    return NextResponse.json({ groups, total: groups.length });
  } catch (error) {
    console.error('Duplicate scan error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ── POST /api/admin/duplicates ────────────────────────────────────────────────
// Body: { action: 'delete' | 'update_status', ids: string[], status?: string }
export async function POST(request) {
  try {
    const user = await authenticateUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { action, ids, status } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No lead IDs provided' }, { status: 400 });
    }

    if (action === 'delete') {
      const result = await Lead.deleteMany({ _id: { $in: ids } });
      return NextResponse.json({ success: true, deleted: result.deletedCount });
    }

    if (action === 'update_status') {
      const VALID = ['New', 'Contacted', 'In Progress', 'Converted', 'Lost', 'Follow-up'];
      if (!status || !VALID.includes(status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
      const result = await Lead.updateMany({ _id: { $in: ids } }, { $set: { status } });
      return NextResponse.json({ success: true, updated: result.modifiedCount });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Duplicate action error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
