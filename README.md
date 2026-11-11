# Web de Souto Pinturas y Proyectos

Web pública con calculadora de precios, reserva de visitas conectada a Google Calendar y panel privado de solicitudes.
Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Zod · sin librerías de animación.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # rellenar solo lo necesario
npm run dev                  # http://localhost:3000
```

En local todo funciona sin cuentas: las solicitudes se guardan en memoria y el panel (`/panel`, contraseña `souto-local`)
arranca con **datos de ejemplo** marcados como tales.

### Conectar en producción (Netlify → Site configuration → Environment variables)

Nada de esto tiene coste en los planes gratuitos. Todas las cuentas, a nombre de Souto.

1. **APP_SECRET** y **PANEL_PASSWORD**: un secreto aleatorio (`openssl rand -hex 32`) y la contraseña del panel.
2. **Supabase** (base de datos): crear proyecto en región UE → SQL Editor → pegar `supabase/migrations/0001_solicitudes.sql`
   → Run. Copiar `SUPABASE_URL` y la clave `service_role` en `SUPABASE_SERVICE_ROLE_KEY`.
3. **Resend** (emails): verificar el dominio de la web, crear una API key → `RESEND_API_KEY`, `EMAIL_FROM`, `NOTIFY_EMAIL_TO`.
4. **Google Calendar** (opcional, recomendado): en Google Cloud crear un proyecto, activar «Google Calendar API», crear una
   cuenta de servicio y una clave JSON. En Google Calendar, compartir el calendario de la empresa con el email de la cuenta de
   servicio con permiso «Hacer cambios en eventos». Rellenar `GOOGLE_CALENDAR_ID` (Configuración del calendario → ID),
   `GOOGLE_SERVICE_ACCOUNT_EMAIL` y `GOOGLE_PRIVATE_KEY`.
5. Volver a desplegar y hacer una prueba real: calcular un precio, reservar visita, comprobar el email, el panel y el calendario.

Sin base de datos, la calculadora sigue enseñando el precio pero no se puede reservar visita; con `PANEL_DEMO=true` el panel
enseña datos de ejemplo de solo lectura.

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` y `npm start` | Compilación y servidor de producción |
| `npm test` | Tests del motor de precios y de la validación |
| `npm run typecheck` | Comprobación de tipos |
| `npm run screenshots` | Capturas, accesibilidad (axe) y recorridos completos: precio → visita, baño → visita y panel (requiere `npm run dev` y Chrome) |

## Estructura

```text
src/
  app/                 Páginas (inicio, servicios, calculadora, empresa, contacto, reservar, legal, panel) y API
  app/api/solicitudes  Alta de solicitudes (precio con email o contacto)
  app/api/agenda       Huecos libres y reserva de visita
  app/api/panel        Acceso, cambios y exportación del panel
  components/          Web pública (calculadora, reserva, formularios…) y components/panel
  content/             TODO el contenido editable: empresa, catálogo, servicios, preguntas, horario de visitas
  lib/pricing          Motor de precios (puro, con tests)
  lib/agenda           Huecos de visita en hora de Madrid (con tests)
  lib/zones.ts         Zona aproximada por código postal (para agrupar visitas)
  lib/server           Antispam, almacén (Supabase), email (Resend), Google Calendar, sesión del panel
supabase/migrations    Tabla de solicitudes con RLS
docs/decisiones.md     Decisiones técnicas y de diseño
```

## Reglas de contenido

- **Precios:** solo los de `src/content/catalog.ts`, validados por la empresa. No añadir precios sin confirmación escrita.
- **Nada inventado:** proyectos, antes/después, clientes y opiniones viven en `src/content/pending.ts` y se publican solo si
  la lista tiene elementos **y** la bandera de `features` en `src/content/site.ts` está activada.
- **Ajustes comerciales** (rango, mínimo, desplazamiento, recargos por estado): preparados en `lib/pricing/engine.ts`
  (`PricingSettings`) y desactivados hasta que la empresa los valide.

## Solicitudes y visitas

- **Calculadora:** el desglose y el total se ven al dejar email y código postal. El servidor recalcula el importe con el
  catálogo, guarda la solicitud, avisa a la empresa y manda el desglose al cliente con un enlace personal para reservar.
- **Baños, fontanería, albañilería, reformas y muebles:** sin precio; se piden datos de contacto y se reserva la visita.
- **Agenda:** horario en `src/content/agenda.ts` (pendiente de validar con la empresa). Se ofrecen huecos de lunes a viernes,
  sin los ocupados en Google Calendar ni las visitas ya reservadas, y se marcan los días con visita en la misma zona. El hueco
  se vuelve a comprobar al reservar. La visita se crea en Google Calendar con color por zona y el cliente recibe un .ics.
- **Seguridad:** Zod, trampa para bots, tiempo mínimo, límite por IP, Turnstile opcional, comprobación de origen, enlaces de
  reserva firmados (HMAC), panel con contraseña y cookie firmada HttpOnly, RLS sin políticas en la tabla.

## Antes de publicar

Ver la sección «Qué falta para publicar» del documento de dirección creativa. Mientras `SITE_INDEXABLE` no sea `true`,
la web no se indexa (robots y metaetiquetas).
