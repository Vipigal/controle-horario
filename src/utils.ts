export function getDataDoBrasilStr(data: Date): string {
  return data.toLocaleDateString("pt-BR");
}

export function converterHorasStringParaDecimal(horas: string): number {
  if (!horas) return 0;
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

export const calcularHorasCompletas = (
  entrada?: string,
  saidaAlmoco?: string,
  voltaAlmoco?: string,
  saida?: string
): string => {
  if (!entrada || !saida) return "00:00";

  const [hEntrada, mEntrada] = entrada.split(":").map(Number);
  const [hSaida, mSaida] = saida.split(":").map(Number);

  let minutosAlmoco = 0;
  if (saidaAlmoco && voltaAlmoco) {
    const [hSaidaAlmoco, mSaidaAlmoco] = saidaAlmoco.split(":").map(Number);
    const [hVoltaAlmoco, mVoltaAlmoco] = voltaAlmoco.split(":").map(Number);
    minutosAlmoco =
      hVoltaAlmoco * 60 + mVoltaAlmoco - (hSaidaAlmoco * 60 + mSaidaAlmoco);
  }

  const totalMinutos =
    hSaida * 60 + mSaida - (hEntrada * 60 + mEntrada) - minutosAlmoco;
  return converterDecimalParaHorasString(Math.max(0, totalMinutos / 60));
};
