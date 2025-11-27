import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';
import db from '@/lib/db';

export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(request) {
    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
        return NextResponse.json({ success: false });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads dir exists
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${file.name}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    // Save to DB
    const stmt = db.prepare('INSERT INTO photos (filename, caption) VALUES (?, ?)');
    const info = stmt.run(filename, '');

    return NextResponse.json({ success: true, filename, id: info.lastInsertRowid });
}

export async function GET() {
    const stmt = db.prepare('SELECT * FROM photos ORDER BY created_at DESC');
    const photos = stmt.all();
    return NextResponse.json(photos);
}

export async function DELETE(request) {
    const { id, filename } = await request.json();

    if (!id || !filename) {
        return NextResponse.json({ success: false, error: 'Missing id or filename' }, { status: 400 });
    }

    // Delete from DB
    const stmt = db.prepare('DELETE FROM photos WHERE id = ?');
    stmt.run(id);

    // Delete file
    const filepath = path.join(process.cwd(), 'public/uploads', filename);
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
    }

    return NextResponse.json({ success: true });
}
