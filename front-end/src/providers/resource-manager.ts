class ResourceManager {
  private images: Map<string, HTMLImageElement>;
  private videos: Map<string, HTMLVideoElement>;
  private audios: Map<string, HTMLAudioElement>;

  constructor() {
    this.images = new Map(); // name -> HTMLImageElement
    this.videos = new Map(); // name -> HTMLVideoElement
    this.audios = new Map(); // name -> HTMLAudioElement
  }

  loadImage(name: string, src: string) {
    if (this.images.has(name)) return Promise.resolve(this.images.get(name));

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(name, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  loadVideo(name: string, src: string, opts?: { loop: boolean }) {
    if (this.videos.has(name)) return Promise.resolve(this.videos.get(name));

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.autoplay = true;
      video.loop = opts?.loop ?? true;
      video.muted = true;
      video.preload = 'auto';
      video.playsInline = true;
      video.src = src;
      video.onloadeddata = () => {
        this.videos.set(name, video);
        resolve(video);
      };
      video.onerror = reject;
    });
  }

  loadAudio(name: string, src: string, opts?: { loop?: boolean; volume?: number }): Promise<HTMLAudioElement> {
    if (this.audios.has(name)) return Promise.resolve(this.audios.get(name)!);

    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.src = src;
      audio.preload = 'auto';
      audio.loop = opts?.loop ?? false;
      audio.volume = opts?.volume ?? 1;

      audio.oncanplaythrough = () => {
        this.audios.set(name, audio);
        resolve(audio);
      };
      audio.onerror = reject;
    });
  }

  getImage(name: string) {
    return this.images.get(name) || null;
  }

  getVideo(name: string) {
    return this.videos.get(name) || null;
  }

  getAudio(name: string): HTMLAudioElement | null {
    return this.audios.get(name) || null;
  }

  playAudio(name: string, opts: { volume?: number; currentTime?: number; clone?: boolean; loop?: boolean } = {}) {
    const audio = this.audios.get(name);
    if (!audio) return;

    const { volume = 100, currentTime, clone, loop = false } = opts;
    const targetAudio = clone ? (audio.cloneNode(true) as HTMLAudioElement) : audio;

    targetAudio.volume = volume / 100;

    if (currentTime !== undefined) {
      targetAudio.currentTime = 0;
    }

    targetAudio.loop = loop;

    targetAudio.play().catch((e) => console.error(e));

    return targetAudio;
  }
}

// Export a shared instance
export const resourceManager = new ResourceManager();
