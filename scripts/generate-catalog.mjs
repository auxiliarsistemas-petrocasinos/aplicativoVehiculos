import { readFile, writeFile } from 'node:fs/promises';
const catalog = JSON.parse(
  await readFile(new URL('../features/inspections/catalog.json', import.meta.url), 'utf8'),
);
const quote = (s) => "'" + String(s).replaceAll("'", "''") + "'";
const id = '10000000-0000-4000-8000-000000000001';
let sql = `-- Catálogo saneado de demostración. Nunca habilita uso operativo real.\ninsert into public.form_templates(id,version,status) values('${id}',${quote(catalog.version)},'demo_only');\n`;
for (const [i, item] of catalog.inspection.entries())
  sql += `insert into public.form_items(template_id,id,label,category,vehicle_type,sources,position) values('${id}',${quote(item.id)},${quote(item.label)},${quote(item.category)},${quote(item.vehicleType)},${quote(JSON.stringify(item.sources))}::jsonb,${i});\n`;
await writeFile(new URL('../supabase/migrations/202610110004_catalog.sql', import.meta.url), sql);
console.log(`Generados ${catalog.inspection.length} controles de demostración.`);
