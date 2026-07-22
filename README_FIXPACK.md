# Paquete Ranking dinámico

Este paquete agrega un flujo real para actualizar el ranking desde el panel superadmin.

## Archivos incluidos

- `package.json`
- `src/App.jsx`
- `src/pages/AdminDashboard.jsx`
- `src/pages/AdminRanking.jsx`
- `src/pages/Ranking.jsx`
- `src/utils/rankingParser.js`
- `src/utils/rankingStorage.js`
- `supabase/ranking_tables.sql`

## Qué agrega

- Ruta `/admin/ranking` protegida para superadmin.
- Botón `Actualizar ranking` en `/superadmin`.
- Importador de Excel para archivos `.xlsx` y `.xls`.
- Vista previa antes de publicar.
- Publicación en Supabase usando `ranking_imports` y `ranking_entries`.
- `/ranking` ahora lee primero el último ranking publicado desde Supabase.
- Si no hay ranking publicado o falla la conexión, `/ranking` usa el ranking base de `src/data/rankings.js`.

## Pasos para aplicar

1. Extraer el ZIP sobre la raíz del proyecto.
2. Instalar la dependencia para leer Excel:

```powershell
npm i xlsx
```

3. Ir a Supabase → SQL Editor y correr completo:

```text
supabase/ranking_tables.sql
```

4. Compilar:

```powershell
npm run build
npm run dev
```

5. Entrar como superadmin y abrir:

```text
/admin/ranking
```

6. Subir el Excel oficial del ranking, revisar la vista previa y tocar `Publicar ranking`.

## Formato esperado del Excel

El parser busca hojas como `ILCA 4`, `ILCA 6`, `ILCA 7` y una fila de encabezados con columnas similares a:

- `Pos`
- `Apellido`
- `Nombre`
- `CLUB`
- `Categoria` / `Categoría`
- `Net`
- `Totales`

Las columnas de campeonatos ubicadas después de `Totales` se cuentan como campeonatos cargados para cada timonel.
