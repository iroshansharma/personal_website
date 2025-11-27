import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    const stmt = db.prepare('SELECT * FROM mood');
    const moods = stmt.all();
    return NextResponse.json(moods);
}

export async function POST(request) {
    const { user, status } = await request.json();

    const stmt = db.prepare('INSERT OR REPLACE INTO mood (user, status) VALUES (?, ?)');
    stmt.run(user, status);

    return NextResponse.json({ success: true });
}
