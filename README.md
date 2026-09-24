[README.md](https://github.com/user-attachments/files/32606631/README.md)
# DASHGPL — Tawssil COD Dashboard

## Architecture
- `public/index.html` — dashboard HTML/CSS/JS.
- `netlify/functions/data.mjs` — API serverless Netlify.
- Netlify Blobs — persistent shared storage.
- `/api/data?action=load|chunk|finalize|reset` — dashboard data API.

## Weekly Excel workflow
1. Open the dashboard.
2. Import `.xlsx`, `.xls` or `.csv`.
3. Enter the existing PIN `CMGPL`.
4. Validate the column mapping.
5. The dashboard sends the parsed records to Netlify in chunks and finalizes the latest dataset.
6. Any browser opening the site can restore the latest dataset from Netlify.

## Netlify
Publish directory: `public`
Functions directory: `netlify/functions`
No frontend build is required.

For stronger server-side protection, set the Netlify environment variable `DASHGPL_PIN` and use the same PIN in the dashboard before deployment.
