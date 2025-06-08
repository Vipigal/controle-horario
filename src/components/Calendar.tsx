import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function Calendario() {
  const [dataCalendario, setDataCalendario] = useState<Date>(new Date());

  const navegarMes = (direcao: number) => {
    setDataCalendario(
      new Date(
        dataCalendario.getFullYear(),
        dataCalendario.getMonth() + direcao,
        1
      )
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="text-gray-600" />
          {dataCalendario.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => navegarMes(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => navegarMes(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
            <div
              key={dia}
              className="text-center text-md font-semibold text-gray-500 p-2"
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Dias do calendário */}
        <div className="grid grid-cols-7 gap-2">
          {dias.map((dia, index) => {
            const horas = obterHorasDoDia(dia.data);
            const temRegistro = horas > 0;
            const isHoje = dia.data === new Date().toISOString().split("T")[0];

            return (
              <div
                key={index}
                onClick={() => dia.mesAtual && abrirModal(dia.data)}
                className={`
                      aspect-square border rounded-lg p-2 cursor-pointer transition-all duration-200
                      ${
                        dia.mesAtual
                          ? "hover:bg-gray-50"
                          : "text-gray-300 cursor-default"
                      }
                      ${isHoje ? "ring-2 ring-blue-500" : ""}
                      ${
                        temRegistro
                          ? "bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200"
                          : "border-gray-200"
                      }
                    `}
              >
                <div className="h-full flex flex-col justify-between">
                  <span
                    className={`text-sm font-medium ${
                      dia.mesAtual ? "text-gray-800" : "text-gray-400"
                    }`}
                  >
                    {dia.dia}
                  </span>
                  {temRegistro && (
                    <div className="text-xs text-purple-600 font-semibold">
                      {formatarHoras(horas)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
