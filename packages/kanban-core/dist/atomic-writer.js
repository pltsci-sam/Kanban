import { open, rename, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
export async function writeFileAtomic(filePath, content) {
    const dir = dirname(filePath);
    const tmpName = join(dir, `.tmp-${randomBytes(6).toString('hex')}`);
    await mkdir(dir, { recursive: true });
    const handle = await open(tmpName, 'w');
    try {
        await handle.writeFile(content, 'utf-8');
        await handle.datasync();
    }
    finally {
        await handle.close();
    }
    await rename(tmpName, filePath);
}
//# sourceMappingURL=atomic-writer.js.map