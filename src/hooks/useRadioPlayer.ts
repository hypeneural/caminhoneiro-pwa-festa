import { useState, useEffect, useRef } from 'react';
import { radioService, RadioMetadata } from '@/services/api/radioService';

export const useRadioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [metadata, setMetadata] = useState<RadioMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(radioService.getStreamUrl());
    audioRef.current.preload = 'none';

    const audio = audioRef.current;

    const handlePlay = () => {
      setIsPlaying(true);
      setError(null);
    };

    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleError = () => {
      setError('Erro ao carregar a rádio. Tente novamente.');
      setIsPlaying(false);
    };

    audio.addEventListener('playing', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('playing', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
      audio.load();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchMetadata = async () => {
      try {
        const data = await radioService.getMetadata();
        setMetadata(data);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar metadados:', err);
        // Não definimos o erro aqui para não interromper a reprodução
      }
    };

    if (isPlaying) {
      fetchMetadata();
      interval = setInterval(fetchMetadata, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        setIsBuffering(true);
        await audioRef.current.play();
      }
    } catch (err) {
      console.error('Erro ao controlar reprodução:', err);
      setError('Erro ao iniciar a reprodução. Tente novamente.');
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = value;
    setVolume(value);
  };

  return {
    isPlaying,
    isMuted,
    volume,
    isBuffering,
    metadata,
    error,
    togglePlay,
    toggleMute,
    handleVolumeChange,
  };
}; 