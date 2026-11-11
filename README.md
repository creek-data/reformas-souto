# Web de Souto Pinturas y Proyectos

Web pública con calculadora de precios orientativos y API de solicitudes.
Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Zod · sin librerías de animación.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # rellenar solo lo necesario
npm run dev                  # http://localhost:3000
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` y `npm start` | Compilación y servidor de producción |
| `npm test` | Tests del motor de precios y de la validación |
| `npm run typecheck` | Comprobación de tipos |
| `npm run screenshots` | Capturas en móvil, tablet y escritorio + auditoría de accesibilidad (requiere el servidor arrancado y Chrome) |

## Estructura

```text
src/
  app/                 Páginas (inicio, servicios, calculadora, empresa, contacto, legal) y API
  app/api/solicitudes  Recepción segura de solicitudes
  components/          Cabecera, pie, muestrario, calculadora, formulario, bloques
  content/             TODO el contenido editable: datos de empresa, catálogo, servicios, pendientes
  lib/pricing          Motor de precios (puro, con tests)
  lib/validation       Esquema de la solicitud (compartido cliente/servidor)
  lib/server           Antispam, límite de envíos, Supabase y email
supabase/migrations    Tabla de solicitudes con RLS
docs/decisiones.md     Decisiones técnicas y de diseño
```

## Reglas de contenido

- **Precios:** solo los de `src/content/catalog.ts`, validados por la empresa. No añadir precios sin confirmación escrita.
- **Nada inventado:** proyectos, antes/después, clientes y opiniones viven en `src/content/pending.ts` y se publican solo si
  la lista tiene elementos **y** la bandera de `features` en `src/content/site.ts` está activada.
- **Ajustes comerciales** (rango, mínimo, desplazamiento, recargos por estado): preparados en `lib/pricing/engine.ts`
  (`PricingSettings`) y desactivados hasta que la empresa los valide.

## Solicitudes

`POST /api/solicitudes` valida con Zod, aplica trampa para bots, tiempo mínimo, límite de 5 envíos por IP cada 10 minutos
y Turnstile si está configurado. **Recalcula siempre el importe en el servidor**. Guarda en Supabase y avisa por email con
Resend. En producción, si no hay ningún destino configurado, responde 503 para no perder solicitudes sin avisar.

## Antes de publicar

Ver la sección «Qué falta para publicar» del documento de dirección creativa. Mientras `SITE_INDEXABLE` no sea `true`,
la web no se indexa (robots y metaetiquetas).
