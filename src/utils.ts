export function getDataDoBrasilStr(data: Date): string {
  return data.toLocaleDateString("pt-BR");
}

export function converterHorasStringParaDecimal(horas: string): number {
  const partes = horas.split(":");
  if (partes.length !== 2) {
    throw new Error("Formato de horas inválido. Use 'HH:mm'.");
  }
  const horasInt = parseInt(partes[0], 10);
  const minutosInt = parseInt(partes[1], 10);
  return horasInt + minutosInt / 60;
}

export function converterDecimalParaHorasString(decimal: number): string {
  const horas = Math.floor(decimal);
  const minutos = Math.round((decimal - horas) * 60);
  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(
    2,
    "0"
  )}`;
}

export function parseDataDoBrasil(dateStr: string): Date {
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day); // JS usa mês de 0 a 11
}

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
