
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
  id: "sao-cristovao-2026",
  pergunta: "Qual atração você mais espera na Festa de São Cristóvão 2026?",
  opcoes: [
    { id: "procissao", texto: "Procissão automotiva", votos: 51 },
    { id: "bingo", texto: "Bingo tradicional", votos: 34 },
    { id: "almoco", texto: "Almoço festivo", votos: 27 },
    { id: "musica", texto: "Tarde dançante", votos: 19 },
  ],
  total: 131,
  ativo: true,
  encerraEm: "2026-07-19T23:59:59Z"
};
