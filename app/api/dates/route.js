import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    const stmt = db.prepare('SELECT * FROM dates ORDER BY date ASC');
    const dates = stmt.all();
    return NextResponse.json(dates);
}

export async function POST(request) {
    const { title, date } = await request.json();
    const stmt = db.prepare('INSERT INTO dates (title, date) VALUES (?, ?)');
    const info = stmt.run(title, date);
    return NextResponse.json({ id: info.lastInsertRowid, title, date });
}

export async function DELETE(request) {
    const { id } = await request.json();
    const stmt = db.prepare('DELETE FROM dates WHERE id = ?');
    stmt.run(id);
    return NextResponse.json({ success: true });
}
