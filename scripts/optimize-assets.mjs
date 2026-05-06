/**
 * optimize-assets.mjs
 *
 * Compresse tous les GLB du dossier public/ avec Draco (géométrie) et WebP (textures internes),
 * convertit les PNG en WebP, et garde une copie des originaux dans public/_originals/.
 *
 * Usage : node scripts/optimize-assets.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { draco, textureCompress, dedup, prune, weld } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const BACKUP_DIR = path.join(PUBLIC_DIR, '_originals');

const TEXTURE_QUALITY = 80;        // qualité WebP (0-100)
const TEXTURE_MAX_SIZE = 1024;      // limite max d'une texture interne (px)

const fmt = (n) => (n / 1e6).toFixed(2) + ' MB';

async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}

async function backup(file) {
    const dest = path.join(BACKUP_DIR, path.basename(file));
    try {
        await fs.access(dest);
        return; // déjà sauvegardé : ne pas écraser
    } catch {
        await fs.copyFile(file, dest);
    }
}

async function optimizeGlb(io, file) {
    const before = (await fs.stat(file)).size;
    await backup(file);

    const doc = await io.read(file);

    await doc.transform(
        dedup(),
        prune(),
        weld({ tolerance: 0.0001 }),
        textureCompress({
            encoder: sharp,
            targetFormat: 'webp',
            quality: TEXTURE_QUALITY,
            resize: [TEXTURE_MAX_SIZE, TEXTURE_MAX_SIZE]
        }),
        draco({
            method: 'edgebreaker',
            encodeSpeed: 5,
            decodeSpeed: 5,
            quantizePosition: 14,
            quantizeNormal: 10,
            quantizeTexcoord: 12,
            quantizeColor: 8,
            quantizeGeneric: 12
        })
    );

    await io.write(file, doc);
    const after = (await fs.stat(file)).size;
    const saved = ((1 - after / before) * 100).toFixed(1);
    console.log(`  ✓ ${path.basename(file).padEnd(40)} ${fmt(before)} → ${fmt(after)}  (−${saved}%)`);
    return { before, after };
}

async function optimizePng(file) {
    const before = (await fs.stat(file)).size;
    await backup(file);

    const webpPath = file.replace(/\.png$/i, '.webp');
    await sharp(file)
        .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(webpPath);

    await fs.unlink(file); // supprime le PNG d'origine (déjà sauvegardé)

    const after = (await fs.stat(webpPath)).size;
    const saved = ((1 - after / before) * 100).toFixed(1);
    console.log(`  ✓ ${path.basename(file).padEnd(40)} ${fmt(before)} → ${path.basename(webpPath)} ${fmt(after)}  (−${saved}%)`);
    return { before, after };
}

async function main() {
    console.log('🛠  Optimisation des assets de public/\n');
    await ensureDir(BACKUP_DIR);

    const io = new NodeIO()
        .registerExtensions(ALL_EXTENSIONS)
        .registerDependencies({
            'draco3d.decoder': await draco3d.createDecoderModule(),
            'draco3d.encoder': await draco3d.createEncoderModule()
        });

    const entries = await fs.readdir(PUBLIC_DIR, { withFileTypes: true });
    let totalBefore = 0;
    let totalAfter = 0;

    console.log('— Modèles GLB —');
    for (const ent of entries) {
        if (!ent.isFile()) continue;
        if (!ent.name.toLowerCase().endsWith('.glb')) continue;
        const file = path.join(PUBLIC_DIR, ent.name);
        try {
            const { before, after } = await optimizeGlb(io, file);
            totalBefore += before;
            totalAfter += after;
        } catch (err) {
            console.error(`  ✗ ${ent.name} — ${err.message}`);
        }
    }

    console.log('\n— Textures PNG —');
    for (const ent of entries) {
        if (!ent.isFile()) continue;
        if (!ent.name.toLowerCase().endsWith('.png')) continue;
        const file = path.join(PUBLIC_DIR, ent.name);
        try {
            const { before, after } = await optimizePng(file);
            totalBefore += before;
            totalAfter += after;
        } catch (err) {
            console.error(`  ✗ ${ent.name} — ${err.message}`);
        }
    }

    const saved = ((1 - totalAfter / totalBefore) * 100).toFixed(1);
    console.log(`\n📊 Total : ${fmt(totalBefore)} → ${fmt(totalAfter)}  (−${saved}%)`);
    console.log(`📂 Originaux conservés dans : ${path.relative(ROOT, BACKUP_DIR)}`);
}

main().catch((err) => {
    console.error('Erreur fatale :', err);
    process.exit(1);
});
