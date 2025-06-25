
export interface PollOption {
  id: string;
  texto: string;
  votos: number;
}

export interface Poll {
  id: string;
  pergunta: string;
  opcoes: PollOption[];
  total: number;
  ativo: boolean;
  encerraEm?: string;
}

export const pollMock: Poll = {
  id: "truck-fest-2025",
  pergunta: "Qual atração você mais espera na Festa do Caminhoneiro?",
  opcoes: [
    { id: "show", texto: "Show Nacional", votos: 51 },
    { id: "food", texto: "Festival Gastronômico", votos: 34 },
    { id: "desfile", texto: "Desfile de Caminhões", votos: 27 },
    { id: "brindes", texto: "Sorteio de Brindes", votos: 19 },
  ],
  total: 131,
  ativo: true,
  encerraEm: "2025-07-20T23:59:59Z"
};
