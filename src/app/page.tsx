"use client";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Registro } from "../types";
import {
  capitalizeFirstLetter,
  converterDecimalParaHorasString,
  converterHorasStringParaDecimal,
  getDataDoBrasilStr,
  parseDataDoBrasil,
} from "@/utils";

// Tipo auxiliar para edição
export type RegistroEditavel = Partial<Registro> & {
  horasManual?: string;
};

export default function Home() {
  // Estado principal
  const [registros, setRegistros] = useState<Registro[]>([]);

  // Metas
  const [metaMensal, setMetaMensal] = useState<number>(132);
  const [metaSemanal, setMetaSemanal] = useState<number>(30);

  // Calendário
  const [mesAtual, setMesAtual] = useState(new Date());

  // Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [diaModal, setDiaModal] = useState<string>("");
  const [registroModal, setRegistroModal] = useState<RegistroEditavel>({
    dataDoBrasil: "",
    entrada: "",
    saidaAlmoco: "",
    voltaAlmoco: "",
    saida: "",
    horasManual: "",
  });

  // Registro manual
  const [registroManual, setRegistroManual] = useState<RegistroEditavel>({
    dataDoBrasil: getDataDoBrasilStr(new Date()),
    entrada: "",
    saidaAlmoco: "",
    voltaAlmoco: "",
    saida: "",
    horasManual: "",
  });

  useEffect(() => {
    const dadosSalvos = JSON.parse(
      localStorage.getItem("horasEstagio") || "[]"
    );
    setRegistros(dadosSalvos);

    const metaMensalSalva = localStorage.getItem("metaMensal");
    const metaSemanalSalva = localStorage.getItem("metaSemanal");
    if (metaMensalSalva) setMetaMensal(Number(metaMensalSalva));
    if (metaSemanalSalva) setMetaSemanal(Number(metaSemanalSalva));
  }, []);

  useEffect(() => {
    localStorage.setItem("horasEstagio", JSON.stringify(registros));
  }, [registros]);

  const calcularHorasCompletas = (
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

  const adicionarRegistroManual = () => {
    const horasTrabalhadas: string =
      registroManual.horasManual ||
      calcularHorasCompletas(
        registroManual.entrada,
        registroManual.saidaAlmoco,
        registroManual.voltaAlmoco,
        registroManual.saida
      );

    const horasNumber = converterHorasStringParaDecimal(horasTrabalhadas);

    if (horasNumber <= 0) {
      alert(
        "Por favor, preencha os horários corretamente ou insira as horas manualmente."
      );
      return;
    }

    if (!registroManual.dataDoBrasil) {
      alert("Por favor, preencha a data do registro.");
      return;
    }

    const registro: Registro = {
      dataDoBrasil: registroManual.dataDoBrasil,
      entrada: registroManual.entrada,
      saidaAlmoco: registroManual.saidaAlmoco,
      voltaAlmoco: registroManual.voltaAlmoco,
      saida: registroManual.saida,
      horasTrabalhadas: horasTrabalhadas,
    };

    setRegistros(
      [
        registro,
        ...registros.filter((r) => r.dataDoBrasil !== registro.dataDoBrasil),
      ].sort(
        (a, b) =>
          parseDataDoBrasil(b.dataDoBrasil).getTime() -
          parseDataDoBrasil(a.dataDoBrasil).getTime()
      )
    );

    setRegistroManual({
      dataDoBrasil: getDataDoBrasilStr(new Date()),
      entrada: "",
      saidaAlmoco: "",
      voltaAlmoco: "",
      saida: "",
      horasManual: "",
    });
  };

  const salvarRegistroModal = () => {
    const horasTrabalhadas =
      registroModal.horasManual ||
      calcularHorasCompletas(
        registroModal.entrada,
        registroModal.saidaAlmoco,
        registroModal.voltaAlmoco,
        registroModal.saida
      );

    if (converterHorasStringParaDecimal(horasTrabalhadas) <= 0) {
      alert(
        "Por favor, preencha os horários corretamente ou insira as horas manualmente."
      );
      return;
    }

    const registroAtualizado: Registro = {
      dataDoBrasil: diaModal,
      entrada: registroModal.entrada || "",
      saidaAlmoco: registroModal.saidaAlmoco || "",
      voltaAlmoco: registroModal.voltaAlmoco || "",
      saida: registroModal.saida || "",
      horasTrabalhadas: horasTrabalhadas,
    };

    const registroExistente = registros.find(
      (r) => r.dataDoBrasil === diaModal
    );

    let registrosAtualizados: Registro[];

    if (registroExistente) {
      registrosAtualizados = registros.map((reg) =>
        reg.dataDoBrasil === diaModal ? registroAtualizado : reg
      );
    } else {
      registrosAtualizados = [registroAtualizado, ...registros];
    }

    setRegistros(
      registrosAtualizados.sort(
        (a, b) =>
          parseDataDoBrasil(b.dataDoBrasil).getTime() -
          parseDataDoBrasil(a.dataDoBrasil).getTime()
      )
    );

    fecharModal();
  };

  const excluirRegistro = (data: string) => {
    setRegistros(registros.filter((reg) => reg.dataDoBrasil !== data));
    fecharModal();
  };

  const abrirModal = (data: string) => {
    const registroExistente = registros.find((r) => r.dataDoBrasil === data);

    setDiaModal(data);
    setRegistroModal({
      dataDoBrasil: data,
      entrada: registroExistente?.entrada || "",
      saidaAlmoco: registroExistente?.saidaAlmoco || "",
      voltaAlmoco: registroExistente?.voltaAlmoco || "",
      saida: registroExistente?.saida || "",
      horasManual:
        registroExistente && !registroExistente.entrada
          ? registroExistente.horasTrabalhadas
          : "",
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setDiaModal("");
    setRegistroModal({
      dataDoBrasil: "",
      entrada: "",
      saidaAlmoco: "",
      voltaAlmoco: "",
      saida: "",
      horasManual: "",
    });
  };

  const obterEstatisticas = () => {
    const hoje = new Date();
    const mesAtualNum = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const inicioSemana = new Date(hoje);
    const diaSemana = hoje.getDay();
    const diasParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
    inicioSemana.setDate(hoje.getDate() + diasParaSegunda);

    const horasMes = registros
      .filter((reg) => {
        const dataReg = parseDataDoBrasil(reg.dataDoBrasil);
        return (
          dataReg.getMonth() === mesAtualNum &&
          dataReg.getFullYear() === anoAtual
        );
      })
      .reduce(
        (total, reg) =>
          total + converterHorasStringParaDecimal(reg.horasTrabalhadas),
        0
      );

    const horasSemana = registros
      .filter((reg) => parseDataDoBrasil(reg.dataDoBrasil) >= inicioSemana)
      .reduce(
        (total, reg) =>
          total + converterHorasStringParaDecimal(reg.horasTrabalhadas),
        0
      );

    return { horasMes, horasSemana };
  };

  const formatarHoras = (horas: number): string => {
    const h = Math.floor(horas);
    const m = Math.round((horas - h) * 60);
    return `${h}:${m > 0 && m < 10 ? `0${m}` : m === 0 ? "00" : m}h`;
  };

  const formatarData = (data: string): string => {
    return data;
  };

  // Funções do calendário
  const obterDiasDoMes = () => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();

    const primeiroDiaDoMes = new Date(Date.UTC(ano, mes, 1));
    const dias = [];

    // Dias do mês anterior para preencher a primeira semana
    const diaDaSemanaPrimeiroDia = primeiroDiaDoMes.getUTCDay(); // 0 = Dom, 1 = Seg...
    for (let i = diaDaSemanaPrimeiroDia - 1; i >= 0; i--) {
      const dia = new Date(Date.UTC(ano, mes, -i));
      const diaDaSemana = dia.getUTCDay();
      dias.push({
        dia: dia.getUTCDate(),
        data: `${String(dia.getUTCDate()).padStart(2, "0")}/${String(
          dia.getUTCMonth() + 1
        ).padStart(2, "0")}/${dia.getUTCFullYear()}`,
        mesAtual: false,
        isFinalDeSemana: diaDaSemana === 0 || diaDaSemana === 6,
      });
    }

    // Dias do mês atual
    const ultimoDiaDoMes = new Date(Date.UTC(ano, mes + 1, 0));
    for (let i = 1; i <= ultimoDiaDoMes.getUTCDate(); i++) {
      const dia = new Date(Date.UTC(ano, mes, i));
      const diaDaSemana = dia.getUTCDay();
      dias.push({
        dia: i,
        data: `${String(i).padStart(2, "0")}/${String(mes + 1).padStart(
          2,
          "0"
        )}/${ano}`,
        mesAtual: true,
        isFinalDeSemana: diaDaSemana === 0 || diaDaSemana === 6,
      });
    }

    // Dias do próximo mês para preencher a última semana
    const totalDiasMostrados = dias.length;
    const diasRestantes =
      totalDiasMostrados % 7 === 0 ? 0 : 7 - (totalDiasMostrados % 7);

    for (let i = 1; i <= diasRestantes; i++) {
      const dia = new Date(Date.UTC(ano, mes + 1, i));
      const diaDaSemana = dia.getUTCDay();
      dias.push({
        dia: i,
        data: `${String(dia.getUTCDate()).padStart(2, "0")}/${String(
          dia.getUTCMonth() + 1
        ).padStart(2, "0")}/${dia.getUTCFullYear()}`,
        mesAtual: false,
        isFinalDeSemana: diaDaSemana === 0 || diaDaSemana === 6,
      });
    }

    return dias;
  };

  const obterHorasTrabalhadasDoDia = (data: string): number => {
    const registro = registros.find((r) => r.dataDoBrasil === data);
    return registro
      ? converterHorasStringParaDecimal(registro.horasTrabalhadas)
      : 0;
  };

  const navegarMes = (direcao: number) => {
    setMesAtual(
      new Date(mesAtual.getFullYear(), mesAtual.getMonth() + direcao, 1)
    );
  };

  const { horasMes, horasSemana } = obterEstatisticas();
  const dias = obterDiasDoMes();

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-7xl  mx-auto ">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <Clock className="text-purple-600" />
          Controle de Ponto - Estágio
        </h1>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-2">Horas este Mês</h3>
            <p className="text-3xl font-bold">{formatarHoras(horasMes)}</p>
            <p className="text-purple-100">Meta: {formatarHoras(metaMensal)}</p>
            <div className="w-full bg-purple-400 rounded-full h-2 mt-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (horasMes / metaMensal) * 100)}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-2">Horas esta Semana</h3>
            <p className="text-3xl font-bold">{formatarHoras(horasSemana)}</p>
            <p className="text-pink-100">Meta: {formatarHoras(metaSemanal)}</p>
            <div className="w-full bg-pink-400 rounded-full h-2 mt-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (horasSemana / metaSemanal) * 100)}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-2">Restante esta Semana</h3>
            <p className="text-3xl font-bold">
              {formatarHoras(Math.max(0, metaSemanal - horasSemana))}
            </p>
            <p className="text-blue-100">
              {horasSemana >= metaSemanal
                ? "Meta atingida! 🎉"
                : "Para completar"}
            </p>
          </div>
        </div>

        {/* Formulário de registro manual */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Plus className="text-gray-600" />
            Registrar Dia de Trabalho
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data
              </label>
              <input
                type="date"
                value={
                  registroManual.dataDoBrasil
                    ? registroManual.dataDoBrasil.split("/").reverse().join("-")
                    : ""
                }
                onChange={(e) =>
                  setRegistroManual({
                    ...registroManual,
                    dataDoBrasil: e.target.value
                      ? e.target.value.split("-").reverse().join("/")
                      : "",
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entrada
              </label>
              <input
                type="time"
                value={registroManual.entrada}
                onChange={(e) =>
                  setRegistroManual({
                    ...registroManual,
                    entrada: e.target.value,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saída Almoço
              </label>
              <input
                type="time"
                value={registroManual.saidaAlmoco}
                onChange={(e) =>
                  setRegistroManual({
                    ...registroManual,
                    saidaAlmoco: e.target.value,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volta Almoço
              </label>
              <input
                type="time"
                value={registroManual.voltaAlmoco}
                onChange={(e) =>
                  setRegistroManual({
                    ...registroManual,
                    voltaAlmoco: e.target.value,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saída Final
              </label>
              <input
                type="time"
                value={registroManual.saida}
                onChange={(e) =>
                  setRegistroManual({
                    ...registroManual,
                    saida: e.target.value,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ou Horas Direto
              </label>
              <input
                type="time"
                value={registroManual.horasManual}
                onChange={(e) =>
                  setRegistroManual({
                    ...registroManual,
                    horasManual: e.target.value,
                  })
                }
                placeholder="00:00"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={adicionarRegistroManual}
            disabled={
              (!registroManual.entrada || !registroManual.saida) &&
              !registroManual.horasManual
            }
            className="disabled:opacity-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} />
            Adicionar Registro
          </button>
        </div>

        {/* Calendário */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <button
              onClick={() => navegarMes(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {capitalizeFirstLetter(
                mesAtual.toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })
              )}
            </h2>
            <button
              onClick={() => navegarMes(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="p-6">
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
                <div
                  key={dia}
                  className="text-center text-sm font-semibold text-gray-500 p-2"
                >
                  {dia}
                </div>
              ))}
            </div>

            {/* Dias do calendário */}
            <div className="grid grid-cols-7 gap-2">
              {dias.map((dia) => {
                const horasTrabalhadas = obterHorasTrabalhadasDoDia(dia.data);
                const temRegistro = horasTrabalhadas > 0;
                const isHoje = dia.data === getDataDoBrasilStr(new Date());
                const { isFinalDeSemana } = dia;

                return (
                  <div
                    key={dia.data}
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
                       ${isFinalDeSemana ? "bg-gray-100" : ""}
                    `}
                  >
                    <div className="h-full flex flex-col justify-between items-center">
                      <span
                        className={`text-lg font-bold ${
                          dia.mesAtual ? "text-gray-800" : "text-gray-400"
                        }`}
                      >
                        {dia.dia}
                      </span>
                      {temRegistro ? (
                        <div className="text-md text-purple-600 font-semibold">
                          {formatarHoras(horasTrabalhadas)}
                        </div>
                      ) : (
                        <div className="text-md text-gray-400 font-semibold">
                          -
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal */}
        {modalAberto && (
          <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  Registrar - {formatarData(diaModal)}
                </h3>
                <button
                  onClick={fecharModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entrada
                    </label>
                    <input
                      type="time"
                      value={registroModal.entrada}
                      onChange={(e) =>
                        setRegistroModal({
                          ...registroModal,
                          entrada: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={!!registroModal.horasManual}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Saída Final
                    </label>
                    <input
                      type="time"
                      value={registroModal.saida}
                      onChange={(e) =>
                        setRegistroModal({
                          ...registroModal,
                          saida: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={!!registroModal.horasManual}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Saída Almoço
                    </label>
                    <input
                      type="time"
                      value={registroModal.saidaAlmoco}
                      onChange={(e) =>
                        setRegistroModal({
                          ...registroModal,
                          saidaAlmoco: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={!!registroModal.horasManual}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Volta Almoço
                    </label>
                    <input
                      type="time"
                      value={registroModal.voltaAlmoco}
                      onChange={(e) =>
                        setRegistroModal({
                          ...registroModal,
                          voltaAlmoco: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={!!registroModal.horasManual}
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ou informar horas trabalhadas diretamente
                  </label>
                  <input
                    type="time"
                    value={registroModal.horasManual}
                    onChange={(e) =>
                      setRegistroModal({
                        ...registroModal,
                        horasManual: e.target.value,
                      })
                    }
                    placeholder="00:00"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 justify-between">
                  {registros.find((r) => r.dataDoBrasil === diaModal) && (
                    <button
                      onClick={() => excluirRegistro(diaModal)}
                      className="self-start px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  )}
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={fecharModal}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={salvarRegistroModal}
                      disabled={
                        (!registroModal.entrada || !registroModal.saida) &&
                        !registroModal.horasManual
                      }
                      className="disabled:opacity-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold flex items-center gap-2"
                    >
                      <Save size={16} />
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configurações de metas */}
        <div className="mt-8 bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Configurar Metas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Mensal (horas)
              </label>
              <input
                type="number"
                value={metaMensal}
                onChange={(e) => {
                  setMetaMensal(Number(e.target.value));
                  localStorage.setItem("metaMensal", e.target.value);
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Semanal (horas)
              </label>
              <input
                type="number"
                value={metaSemanal}
                onChange={(e) => {
                  setMetaSemanal(Number(e.target.value));
                  localStorage.setItem("metaSemanal", e.target.value);
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
