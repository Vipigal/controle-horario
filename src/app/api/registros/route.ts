import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Registro } from "@/types";
import { calcularHorasCompletas, capitalizeFirstLetter } from "@/utils";

export async function GET(request: NextRequest) {
  const credentialsFile = fs.readFileSync(
    path.join(process.cwd(), "secret.json"),
    "utf8"
  );
  const auth = await google.auth.getClient({
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    credentials: JSON.parse(credentialsFile),
  });

  const sheets = google.sheets({ version: "v4", auth });

  const month =
    request.nextUrl.searchParams.get("month") ||
    capitalizeFirstLetter(
      new Date().toLocaleString("pt-BR", { month: "long" })
    );
  const year =
    request.nextUrl.searchParams.get("year") || new Date().getFullYear();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: `${month}/${year}!A1:F`,
  });

  console.log(response.data.values);

  // const headerArray = response.data.values?.[0] || [];
  const dataArray = response.data.values?.slice(1) || [];

  const registros: Registro[] = dataArray.map((row) => {
    const registro: Registro = {
      dataDoBrasil: row?.[0] || "",
      entrada: row?.[1] || "",
      saidaAlmoco: row?.[2] || "",
      voltaAlmoco: row?.[3] || "",
      saida: row?.[4] || "",
      horasTrabalhadas: row?.[5] || "",
    };
    if (!registro.horasTrabalhadas) {
      registro.horasTrabalhadas = calcularHorasCompletas(
        registro.entrada,
        registro.saidaAlmoco,
        registro.voltaAlmoco,
        registro.saida
      );
    }
    return registro;
  });

  return NextResponse.json({ registros });
}

//todo: conferir se o registro já existe, se existir, atualizar, se não existir, criar
export async function POST(request: NextRequest) {
  const { registros } = await request.json();
  console.log(registros);

  const credentialsFile = fs.readFileSync(
    path.join(process.cwd(), "secret.json"),
    "utf8"
  );
  const auth = await google.auth.getClient({
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    credentials: JSON.parse(credentialsFile),
  });

  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SHEET_ID,
    range: "A1:F",
    valueInputOption: "RAW",
    requestBody: { values: registros },
  });

  console.log(response);

  return NextResponse.json({ message: "Registros salvos com sucesso" });
}
