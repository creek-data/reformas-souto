/**
 * Zona aproximada a partir del código postal. Sirve para agrupar visitas y
 * ver qué días ya hay obra cerca. Es una aproximación por prefijos, no un
 * mapa oficial de distritos.
 */

export type ZoneDir = "centro" | "norte" | "este" | "sur" | "oeste" | "fuera";

export interface Zone {
  id: string;
  name: string;
  dir: ZoneDir;
  capital: boolean;
}

const capital: Record<Exclude<ZoneDir, "fuera">, number[]> = {
  centro: [3, 4, 5, 10, 12, 13, 14, 15],
  norte: [2, 16, 20, 29, 33, 34, 35, 36, 39, 43, 46, 48, 49, 50, 55],
  este: [1, 6, 7, 9, 17, 22, 27, 28, 30, 32, 37, 42, 51, 52],
  sur: [11, 18, 19, 21, 24, 25, 26, 31, 38, 41, 44, 45, 47, 53, 54],
  oeste: [8, 23, 40],
};

/** Tercera cifra del CP en la Comunidad de Madrid (28X..) → orientación aproximada. */
const area: Record<string, Exclude<ZoneDir, "fuera" | "centro">> = {
  "1": "norte",
  "2": "oeste",
  "3": "sur",
  "4": "oeste",
  "5": "este",
  "6": "oeste",
  "7": "norte",
  "8": "este",
  "9": "sur",
};

const provinces: Record<string, string> = {
  "01": "Álava", "02": "Albacete", "03": "Alicante", "04": "Almería", "05": "Ávila", "06": "Badajoz", "07": "Baleares",
  "08": "Barcelona", "09": "Burgos", "10": "Cáceres", "11": "Cádiz", "12": "Castellón", "13": "Ciudad Real", "14": "Córdoba",
  "15": "A Coruña", "16": "Cuenca", "17": "Girona", "18": "Granada", "19": "Guadalajara", "20": "Gipuzkoa", "21": "Huelva",
  "22": "Huesca", "23": "Jaén", "24": "León", "25": "Lleida", "26": "La Rioja", "27": "Lugo", "29": "Málaga", "30": "Murcia",
  "31": "Navarra", "32": "Ourense", "33": "Asturias", "34": "Palencia", "35": "Las Palmas", "36": "Pontevedra", "37": "Salamanca",
  "38": "Santa Cruz de Tenerife", "39": "Cantabria", "40": "Segovia", "41": "Sevilla", "42": "Soria", "43": "Tarragona",
  "44": "Teruel", "45": "Toledo", "46": "Valencia", "47": "Valladolid", "48": "Bizkaia", "49": "Zamora", "50": "Zaragoza",
  "51": "Ceuta", "52": "Melilla",
};

const dirName: Record<ZoneDir, string> = {
  centro: "centro",
  norte: "norte",
  este: "este",
  sur: "sur",
  oeste: "oeste",
  fuera: "fuera",
};

export const isValidCp = (cp: string) => /^\d{5}$/.test(cp) && Number(cp.slice(0, 2)) >= 1 && Number(cp.slice(0, 2)) <= 52;

/** Madrid capital: 28001–28055 (y apartados 28070+). */
export const isMadridCapital = (cp: string) => {
  if (!/^28\d{3}$/.test(cp)) return false;
  const n = Number(cp.slice(2));
  return (n >= 1 && n <= 55) || (n >= 70 && n <= 99);
};

export function zoneForCp(cp: string): Zone {
  if (isMadridCapital(cp)) {
    const n = Number(cp.slice(2));
    const dir = (Object.keys(capital) as (keyof typeof capital)[]).find((d) => capital[d].includes(n)) ?? "centro";
    return { id: `madrid-${dir}`, name: `Madrid ${dirName[dir]}`, dir, capital: true };
  }
  if (/^28\d{3}$/.test(cp)) {
    const dir = area[cp[2]!] ?? "sur";
    return { id: `area-${dir}`, name: `Comunidad, zona ${dirName[dir]}`, dir, capital: false };
  }
  const prov = provinces[cp.slice(0, 2)];
  return { id: `fuera-${cp.slice(0, 2)}`, name: prov ? `Fuera: ${prov}` : "Fuera de Madrid", dir: "fuera", capital: false };
}

/** Lista de zonas para filtros y leyendas del panel. */
export const zoneDirs: ZoneDir[] = ["centro", "norte", "este", "sur", "oeste", "fuera"];
export const zoneDirLabel: Record<ZoneDir, string> = {
  centro: "Centro",
  norte: "Norte",
  este: "Este",
  sur: "Sur",
  oeste: "Oeste",
  fuera: "Fuera de Madrid",
};

/** Nombre legible a partir del id guardado en la solicitud («madrid-norte»). */
export function zoneLabel(id: string | null | undefined): string {
  if (!id) return "Sin zona";
  const [kind, rest] = id.split("-") as [string, string];
  if (kind === "madrid") return `Madrid ${rest}`;
  if (kind === "area") return `Comunidad ${rest}`;
  if (kind === "fuera") return provinces[rest] ? `Fuera: ${provinces[rest]}` : "Fuera de Madrid";
  return id;
}

export function zoneDir(id: string | null | undefined): ZoneDir | null {
  if (!id) return null;
  const [kind, rest] = id.split("-") as [string, string];
  if (kind === "fuera") return "fuera";
  return (zoneDirs as string[]).includes(rest) ? (rest as ZoneDir) : null;
}
