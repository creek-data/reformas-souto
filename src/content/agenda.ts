/**
 * Horario de visitas que se ofrece en la web.
 * PENDIENTE DE VALIDAR con la empresa: días, horas y duración de cada visita.
 * Si Google Calendar está conectado, los huecos ocupados allí se descartan solos.
 */
export const agenda = {
  timezone: "Europe/Madrid",
  /** 1 = lunes … 5 = viernes */
  weekdays: [1, 2, 3, 4, 5],
  /** Horas de inicio de visita (hora de Madrid). */
  times: ["09:00", "10:30", "12:00", "16:30", "18:00"],
  /** Duración que se bloquea en el calendario por visita. */
  durationMin: 60,
  /** Antelación mínima para reservar. */
  minNoticeHours: 18,
  /** Días laborables que se ofrecen. */
  workdaysAhead: 10,
  /** Festivos fijos (AAAA-MM-DD). Revisar cada año con el calendario laboral de Madrid. */
  holidays: [
    "2026-12-08", "2026-12-25",
    "2027-01-01", "2027-01-06", "2027-03-25", "2027-03-26", "2027-05-01",
    "2027-10-12", "2027-11-01", "2027-12-06", "2027-12-08", "2027-12-25",
  ],
} as const;
