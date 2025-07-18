import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceSearchState } from '@/types/menu';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new() => SpeechRecognition;
    webkitSpeechRecognition: new() => SpeechRecognition;
  }
}

const initialState: VoiceSearchState = {
  isListening: false,
  isSupported: false,
  transcript: '',
  confidence: 0,
  error: null
};

export function useVoiceSearch(onTranscript?: (transcript: string) => void) {
  const [state, setState] = useState<VoiceSearchState>(initialState);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if speech recognition is supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setState(prev => ({ ...prev, isSupported: true }));
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';
      
      recognitionRef.current = recognition;

      // Event handlers
      recognition.onstart = () => {
        setState(prev => ({ 
          ...prev, 
          isListening: true, 
          error: null,
          transcript: ''
        }));
      };

      recognition.onend = () => {
        setState(prev => ({ ...prev, isListening: false }));
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;

          if (result.isFinal) {
            finalTranscript += transcript;
            setState(prev => ({
              ...prev,
              transcript: finalTranscript.trim(),
              confidence,
              error: null
            }));

            // Call callback with final transcript
            if (finalTranscript.trim() && onTranscript) {
              onTranscript(finalTranscript.trim());
            }
          } else {
            interimTranscript += transcript;
            setState(prev => ({
              ...prev,
              transcript: interimTranscript.trim(),
              confidence: confidence || 0
            }));
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let errorMessage = 'Erro no reconhecimento de voz';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'Nenhuma fala detectada. Tente novamente.';
            break;
          case 'audio-capture':
            errorMessage = 'Microfone não encontrado ou sem permissão.';
            break;
          case 'not-allowed':
            errorMessage = 'Permissão para usar o microfone negada.';
            break;
          case 'network':
            errorMessage = 'Erro de rede. Verifique sua conexão.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Serviço de reconhecimento de voz não permitido.';
            break;
          default:
            errorMessage = `Erro: ${event.error}`;
        }

        setState(prev => ({
          ...prev,
          error: errorMessage,
          isListening: false
        }));
      };
    } else {
      setState(prev => ({ ...prev, isSupported: false }));
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onTranscript]);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current || state.isListening) return;

    try {
      setState(prev => ({ ...prev, error: null, transcript: '' }));
      recognitionRef.current.start();
      
      // Auto-stop after 10 seconds
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current && state.isListening) {
          recognitionRef.current.stop();
        }
      }, 10000);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Erro ao iniciar reconhecimento de voz',
        isListening: false
      }));
    }
  }, [state.isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !state.isListening) return;

    try {
      recognitionRef.current.stop();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Erro ao parar reconhecimento de voz',
        isListening: false
      }));
    }
  }, [state.isListening]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    if (state.isListening) {
      stopListening();
    }
    setState(prev => ({ 
      ...prev, 
      transcript: '', 
      confidence: 0, 
      error: null 
    }));
  }, [state.isListening, stopListening]);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    clearError,
    reset
  };
}