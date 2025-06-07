"use client";
import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Edit3,
  Save,
  Trash2,
  Plus,
  Play,
  Pause,
  Square,
  AlertCircle,
} from "lucide-react";

export default function Home() {
  const [registros, setRegistros] = useState([]);
  const [pontoAtual, setPontoAtual] = useState(null);
  const [metaMensal, setMetaMensal] = useState(132);
  const [metaSemanal, setMetaSemanal] = useState(30);
  const [editando, setEditando] = useState(null);
  const [mostrarCorrecao, setMostrarCorrecao] = useState(false);
  const [correcaoTipo, setCorrecaoTipo] = useState("");

  // Estados para registro manual
  const [registroManual, setRegistroManual] = useState({
    data: new Date().toISOString().split("T")[0],
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
    const pontoSalvo = JSON.parse(localStorage.getItem("pontoAtual") || "null");
    setRegistros(dadosSalvos);
    setPontoAtual(pontoSalvo);

    const metaMensalSalva = localStorage.getItem("metaMensal");
    const metaSemanalSalva = localStorage.getItem("metaSemanal");
    if (metaMensalSalva) setMetaMensal(Number(metaMensalSalva));
    if (metaSemanalSalva) setMetaSemanal(Number(metaSemanalSalva));
  }, []);

  useEffect(() => {
    localStorage.setItem("horasEstagio", JSON.stringify(registros));
  }, [registros]);

  useEffect(() => {
    localStorage.setItem("pontoAtual", JSON.stringify(pontoAtual));
  }, [pontoAtual]);

  const obterHoraAtual = () => {
    const agora = new Date();
    return agora.toTimeString().slice(0, 5);
  };

  const obterDataAtual = () => {
    return new Date().toISOString().split("T")[0];
  };

  const baterPonto = () => {
    const agora = obterHoraAtual();
    const hoje = obterDataAtual();

    if (!pontoAtual || pontoAtual.data !== hoje) {
      // Primeira batida do dia - Entrada
      setPontoAtual({
        data: hoje,
        entrada: agora,
        status: "trabalhando",
        proximaAcao: "Saída para Almoço",
      });
    } else {
      const novoStatus = { ...pontoAtual };

      switch (pontoAtual.status) {
        case "trabalhando":
          // Segunda batida - Saída para almoço
          novoStatus.saidaAlmoco = agora;
          novoStatus.status = "almoco";
          novoStatus.proximaAcao = "Volta do Almoço";
          break;

        case "almoco":
          // Terceira batida - Volta do almoço
          novoStatus.voltaAlmoco = agora;
          novoStatus.status = "trabalhando";
          novoStatus.proximaAcao = "Saída Final";
          break;

        case "trabalhando":
          if (novoStatus.voltaAlmoco) {
            // Quarta batida - Saída final
            novoStatus.saida = agora;
            novoStatus.status = "finalizado";
            novoStatus.proximaAcao = "Dia Finalizado";

            // Calcular e salvar o registro completo
            const horasCalculadas = calcularHorasCompletas(
              novoStatus.entrada,
              novoStatus.saidaAlmoco,
              novoStatus.voltaAlmoco,
              novoStatus.saida
            );

            const novoRegistro = {
              id: Date.now(),
              data: hoje,
              entrada: novoStatus.entrada,
              saidaAlmoco: novoStatus.saidaAlmoco,
              voltaAlmoco: novoStatus.voltaAlmoco,
              saida: novoStatus.saida,
              horas: horasCalculadas,
              horasManual: false,
            };

            setRegistros((prev) =>
              [novoRegistro, ...prev].sort(
                (a, b) => new Date(b.data) - new Date(a.data)
              )
            );

            // Limpar ponto atual no próximo dia
            setTimeout(() => setPontoAtual(null), 1000);
          }
          break;
      }

      setPontoAtual(novoStatus);
    }
  };

  const calcularHorasCompletas = (entrada, saidaAlmoco, voltaAlmoco, saida) => {
    if (!entrada || !saida) return 0;

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
    return Math.max(0, totalMinutos / 60);
  };

  const corrigirUltimoPonto = (tipo, valor) => {
    if (!pontoAtual) return;

    const pontoCorrigido = { ...pontoAtual };

    switch (tipo) {
      case "duracaoAlmoco":
        if (pontoAtual.saidaAlmoco) {
          const [hSaida, mSaida] = pontoAtual.saidaAlmoco
            .split(":")
            .map(Number);
          const minutosVolta = hSaida * 60 + mSaida + parseInt(valor);
          const hVolta = Math.floor(minutosVolta / 60);
          const mVolta = minutosVolta % 60;
          pontoCorrigido.voltaAlmoco = `${hVolta
            .toString()
            .padStart(2, "0")}:${mVolta.toString().padStart(2, "0")}`;
          pontoCorrigido.status = "trabalhando";
          pontoCorrigido.proximaAcao = "Saída Final";
        }
        break;

      case "horarioSaida":
        pontoCorrigido.saida = valor;
        pontoCorrigido.status = "finalizado";
        pontoCorrigido.proximaAcao = "Dia Finalizado";

        // Salvar registro
        const horasCalculadas = calcularHorasCompletas(
          pontoCorrigido.entrada,
          pontoCorrigido.saidaAlmoco,
          pontoCorrigido.voltaAlmoco,
          pontoCorrigido.saida
        );

        const novoRegistro = {
          id: Date.now(),
          data: pontoCorrigido.data,
          entrada: pontoCorrigido.entrada,
          saidaAlmoco: pontoCorrigido.saidaAlmoco,
          voltaAlmoco: pontoCorrigido.voltaAlmoco,
          saida: pontoCorrigido.saida,
          horas: horasCalculadas,
          horasManual: false,
        };

        setRegistros((prev) =>
          [novoRegistro, ...prev].sort(
            (a, b) => new Date(b.data) - new Date(a.data)
          )
        );
        setPontoAtual(null);
        break;
    }

    setPontoAtual(pontoCorrigido);
    setMostrarCorrecao(false);
  };

  const adicionarRegistroManual = () => {
    const horas = registroManual.horasManual
      ? Number(registroManual.horasManual)
      : calcularHorasCompletas(
          registroManual.entrada,
          registroManual.saidaAlmoco,
          registroManual.voltaAlmoco,
          registroManual.saida
        );

    if (horas <= 0) {
      alert(
        "Por favor, preencha os horários corretamente ou insira as horas manualmente."
      );
      return;
    }

    const registro = {
      id: Date.now(),
      data: registroManual.data,
      entrada: registroManual.entrada,
      saidaAlmoco: registroManual.saidaAlmoco,
      voltaAlmoco: registroManual.voltaAlmoco,
      saida: registroManual.saida,
      horas: horas,
      horasManual: !!registroManual.horasManual,
    };

    setRegistros(
      [registro, ...registros].sort(
        (a, b) => new Date(b.data) - new Date(a.data)
      )
    );
    setRegistroManual({
      data: new Date().toISOString().split("T")[0],
      entrada: "",
      saidaAlmoco: "",
      voltaAlmoco: "",
      saida: "",
      horasManual: "",
    });
  };

  const editarRegistro = (id, dadosEditados) => {
    const horas = dadosEditados.horasManual
      ? Number(dadosEditados.horasManual)
      : calcularHorasCompletas(
          dadosEditados.entrada,
          dadosEditados.saidaAlmoco,
          dadosEditados.voltaAlmoco,
          dadosEditados.saida
        );

    setRegistros(
      registros.map((reg) =>
        reg.id === id
          ? {
              ...dadosEditados,
              horas,
              horasManual: !!dadosEditados.horasManual,
            }
          : reg
      )
    );
    setEditando(null);
  };

  const excluirRegistro = (id) => {
    setRegistros(registros.filter((reg) => reg.id !== id));
  };

  const obterEstatisticas = () => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const inicioSemana = new Date(hoje);
    const diaSemana = hoje.getDay();
    const diasParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
    inicioSemana.setDate(hoje.getDate() + diasParaSegunda);

    const horasMes = registros
      .filter((reg) => {
        const dataReg = new Date(reg.data);
        return (
          dataReg.getMonth() === mesAtual && dataReg.getFullYear() === anoAtual
        );
      })
      .reduce((total, reg) => total + reg.horas, 0);

    const horasSemana = registros
      .filter((reg) => new Date(reg.data) >= inicioSemana)
      .reduce((total, reg) => total + reg.horas, 0);

    return { horasMes, horasSemana };
  };

  const { horasMes, horasSemana } = obterEstatisticas();

  const formatarData = (data) => {
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  };

  const formatarHoras = (horas) => {
    const h = Math.floor(horas);
    const m = Math.round((horas - h) * 60);
    return `${h}h${m > 0 ? ` ${m}min` : ""}`;
  };

  const obterStatusPonto = () => {
    if (!pontoAtual) return { cor: "gray", icone: Clock, texto: "Aguardando" };

    switch (pontoAtual.status) {
      case "trabalhando":
        return { cor: "green", icone: Play, texto: "Trabalhando" };
      case "almoco":
        return { cor: "orange", icone: Pause, texto: "Almoço" };
      case "finalizado":
        return { cor: "blue", icone: Square, texto: "Finalizado" };
      default:
        return { cor: "gray", icone: Clock, texto: "Aguardando" };
    }
  };

  const statusPonto = obterStatusPonto();

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-7xl  mx-auto ">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <Clock className="text-purple-600" />
          Controle de Ponto - Estágio
        </h1>

        {/* Seção de Bater Ponto */}
        <div
          className={`bg-gradient-to-r from-${statusPonto.cor}-500 to-${statusPonto.cor}-600 text-white rounded-2xl p-8 mb-8 shadow-lg`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                <statusPonto.icone size={28} />
                {statusPonto.texto}
              </h2>
              {pontoAtual && (
                <div className="space-y-1 text-lg">
                  <p>📍 Entrada: {pontoAtual.entrada}</p>
                  {pontoAtual.saidaAlmoco && (
                    <p>🍽️ Saída Almoço: {pontoAtual.saidaAlmoco}</p>
                  )}
                  {pontoAtual.voltaAlmoco && (
                    <p>🔄 Volta Almoço: {pontoAtual.voltaAlmoco}</p>
                  )}
                  {pontoAtual.saida && <p>🏠 Saída: {pontoAtual.saida}</p>}
                </div>
              )}
              {pontoAtual && pontoAtual.status !== "finalizado" && (
                <p className="mt-3 text-lg font-medium">
                  Próxima ação: {pontoAtual.proximaAcao}
                </p>
              )}
            </div>

            <div className="text-center">
              <div className="text-4xl font-mono mb-4">
                {new Date().toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>

              {pontoAtual?.status !== "finalizado" && (
                <button
                  onClick={baterPonto}
                  className="bg-white text-gray-800 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-200 shadow-lg transform hover:scale-105"
                >
                  🕐 Bater Ponto
                </button>
              )}

              {pontoAtual && pontoAtual.status !== "finalizado" && (
                <div className="mt-4 space-x-2">
                  <button
                    onClick={() => {
                      setCorrecaoTipo("duracaoAlmoco");
                      setMostrarCorrecao(true);
                    }}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-600 transition-all"
                    disabled={!pontoAtual.saidaAlmoco}
                  >
                    Corrigir Almoço
                  </button>
                  <button
                    onClick={() => {
                      setCorrecaoTipo("horarioSaida");
                      setMostrarCorrecao(true);
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition-all"
                    disabled={!pontoAtual.voltaAlmoco}
                  >
                    Definir Saída
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Correção */}
        {mostrarCorrecao && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="text-orange-500" />
                Correção de Ponto
              </h3>

              {correcaoTipo === "duracaoAlmoco" && (
                <div>
                  <p className="mb-4">
                    Quanto tempo durou seu almoço? (minutos)
                  </p>
                  <input
                    type="number"
                    placeholder="60"
                    className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        corrigirUltimoPonto("duracaoAlmoco", e.target.value);
                      }
                    }}
                    id="duracaoAlmoco"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const valor =
                          document.getElementById("duracaoAlmoco").value;
                        if (valor) corrigirUltimoPonto("duracaoAlmoco", valor);
                      }}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex-1"
                    >
                      Corrigir
                    </button>
                    <button
                      onClick={() => setMostrarCorrecao(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex-1"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {correcaoTipo === "horarioSaida" && (
                <div>
                  <p className="mb-4">Que horas você saiu?</p>
                  <input
                    type="time"
                    className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                    id="horarioSaida"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const valor =
                          document.getElementById("horarioSaida").value;
                        if (valor) corrigirUltimoPonto("horarioSaida", valor);
                      }}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex-1"
                    >
                      Corrigir
                    </button>
                    <button
                      onClick={() => setMostrarCorrecao(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex-1"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
            <h3 className="text-lg font-semibold mb-2">Restante no Mês</h3>
            <p className="text-3xl font-bold">
              {formatarHoras(Math.max(0, metaMensal - horasMes))}
            </p>
            <p className="text-blue-100">
              {horasMes >= metaMensal ? "Meta atingida! 🎉" : "Para completar"}
            </p>
          </div>
        </div>

        {/* Formulário de registro manual */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Plus className="text-gray-600" />
            Registrar Dia Manualmente
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data
              </label>
              <input
                type="date"
                value={registroManual.data}
                onChange={(e) =>
                  setRegistroManual({ ...registroManual, data: e.target.value })
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
                type="number"
                step="0.5"
                value={registroManual.horasManual}
                onChange={(e) =>
                  setRegistroManual({
                    ...registroManual,
                    horasManual: e.target.value,
                  })
                }
                placeholder="6.0"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={adicionarRegistroManual}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} />
            Adicionar Registro
          </button>
        </div>

        {/* Lista de registros */}
        <div className="bg-white rounded-xl border border-gray-200">
          <h2 className="text-xl font-semibold p-6 border-b border-gray-200 flex items-center gap-2">
            <Calendar className="text-gray-600" />
            Histórico de Registros
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Data
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Entrada
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Saída Almoço
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Volta Almoço
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Saída
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Total
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {registros.map((registro) => (
                  <tr
                    key={registro.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    {editando === registro.id ? (
                      <EditarLinha
                        registro={registro}
                        onSave={(dados) => editarRegistro(registro.id, dados)}
                        onCancel={() => setEditando(null)}
                      />
                    ) : (
                      <>
                        <td className="p-4">{formatarData(registro.data)}</td>
                        <td className="p-4">
                          {registro.horasManual ? "-" : registro.entrada}
                        </td>
                        <td className="p-4">
                          {registro.horasManual ? "-" : registro.saidaAlmoco}
                        </td>
                        <td className="p-4">
                          {registro.horasManual ? "-" : registro.voltaAlmoco}
                        </td>
                        <td className="p-4">
                          {registro.horasManual ? "-" : registro.saida}
                        </td>
                        <td className="p-4 font-semibold text-purple-600">
                          {formatarHoras(registro.horas)}
                          {registro.horasManual && (
                            <span className="text-xs text-gray-500 ml-1">
                              (manual)
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditando(registro.id)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => excluirRegistro(registro.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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

// Componente para editar registro
const EditarLinha = ({ registro, onSave, onCancel }) => {
  const [dados, setDados] = useState({
    data: registro.data,
    entrada: registro.entrada,
    saidaAlmoco: registro.saidaAlmoco || "",
    voltaAlmoco: registro.voltaAlmoco || "",
    saida: registro.saida,
    horasManual: registro.horasManual ? registro.horas.toString() : "",
  });

  return (
    <>
      <td className="p-4">
        <input
          type="date"
          value={dados.data}
          onChange={(e) => setDados({ ...dados, data: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded text-sm"
        />
      </td>
      <td className="p-4">
        <input
          type="time"
          value={dados.entrada}
          onChange={(e) => setDados({ ...dados, entrada: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded text-sm"
          disabled={!!dados.horasManual}
        />
      </td>
      <td className="p-4">
        <input
          type="time"
          value={dados.saidaAlmoco}
          onChange={(e) => setDados({ ...dados, saidaAlmoco: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded text-sm"
          disabled={!!dados.horasManual}
        />
      </td>
      <td className="p-4">
        <input
          type="time"
          value={dados.voltaAlmoco}
          onChange={(e) => setDados({ ...dados, voltaAlmoco: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded text-sm"
          disabled={!!dados.horasManual}
        />
      </td>
      <td className="p-4">
        <input
          type="time"
          value={dados.saida}
          onChange={(e) => setDados({ ...dados, saida: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded text-sm"
          disabled={!!dados.horasManual}
        />
      </td>
      <td className="p-4">
        <input
          type="number"
          step="0.5"
          value={dados.horasManual}
          onChange={(e) => setDados({ ...dados, horasManual: e.target.value })}
          placeholder="Horas direto"
          className="w-full p-2 border border-gray-300 rounded text-sm"
        />
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          <button
            onClick={() => onSave(dados)}
            className="text-green-600 hover:text-green-800 p-1"
          >
            <Save size={16} />
          </button>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800 p-1"
          >
            ✕
          </button>
        </div>
      </td>
    </>
  );
};
