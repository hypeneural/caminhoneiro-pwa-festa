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
  encerraEm: string;
}

export interface PollResponse {
  status: string;
  message: string | null;
  meta: any[];
  data: Poll;
}

export interface PollVoteRequest {
  optionId: string;
  deviceHash: string;
}

export interface PollVoteResponse {
  status: string;
  message: string | null;
  data: {
    success: boolean;
    poll: Poll;
  };
}

export interface PollState {
  currentPoll: Poll | null;
  hasVoted: boolean;
  votedOptionId: string | null;
  loading: boolean;
  error: string | null;
} 