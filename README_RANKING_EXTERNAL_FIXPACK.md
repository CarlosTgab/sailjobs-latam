# Fixpack: Ranking desde fuente externa

## Objetivo

Permite que el superadmin actualice el ranking desde una URL pública, además de mantener la carga manual por Excel como respaldo.

## Archivos incluidos

- `src/pages/AdminRanking.jsx`
- `src/pages/Ranking.jsx`
- `src/utils/rankingParser.js`
- `src/utils/rankingStorage.js`
- `supabase/ranking_tables.sql`

## Qué cambia

- `/admin/ranking` ahora tiene dos caminos:
  - Leer ranking desde URL pública.
  - Importar archivo Excel manualmente.
- Se puede guardar una fuente externa para reutilizarla.
- La importación publicada guarda si vino de archivo o de URL.
- `/ranking` muestra que la última actualización vino de una fuente externa cuando corresponde.

## URLs compatibles

Funciona mejor con fuentes públicas que permitan lectura desde navegador:

- CSV público.
- XLSX público directo.
- Google Sheets publicado o compartido públicamente.

Si Google Drive bloquea la descarga por permisos o CORS, usar una URL CSV publicada o la carga manual por Excel.

## Supabase

Luego de copiar los archivos, correr el SQL actualizado:

```powershell
Get-Content .\supabase\ranking_tables.sql -Raw | Set-Clipboard
```

Después pegarlo y ejecutarlo en:

```text
Supabase → SQL Editor → New query → Run
```

Verificación:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
and table_name in ('ranking_imports', 'ranking_entries', 'ranking_sources');
```

## Prueba

1. Entrar como superadmin.
2. Abrir `/admin/ranking`.
3. Pegar URL pública del ranking.
4. Tocar `Leer ranking desde URL`.
5. Revisar la preview.
6. Tocar `Publicar ranking`.
7. Abrir `/ranking`.

## Build

```powershell
npm run build
npm run dev
```
