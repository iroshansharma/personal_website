import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    const stmt = db.prepare('SELECT * FROM messages ORDER BY timestamp ASC');
    const messages = stmt.all();
    return NextResponse.json(messages);
}
