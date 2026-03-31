import userConfig from "../../minimax.config.json";

type VoiceOption = {
  id: string;
  label: string;
};

type AppConfig = {
  apiBaseUrl: string;
  models: {
    chatDefault: string;
    chatOptions: string[];
    voiceModel: string;
    voiceDefault: string;
    voiceOptions: VoiceOption[];
    videoDefault: string;
    videoOptions: string[];
    imageDefault: string;
    imageOptions: string[];
    musicDefault: string;
    musicOptions: string[];
  };
  audio: {
    voice: {
      sampleRate: number;
      bitrate: number;
      format: string;
      channel: number;
    };
    music: {
      sampleRate: number;
      bitrate: number;
      format: string;
    };
  };
};

const defaultConfig: AppConfig = {
  apiBaseUrl: "https://api.minimaxi.com/v1",
  models: {
    chatDefault: "MiniMax-M2.7-highspeed",
    chatOptions: ["MiniMax-M2.7-highspeed"],
    voiceModel: "speech-2.8-hd",
    voiceDefault: "audiobook_male_1",
    voiceOptions: [
      { id: "audiobook_male_1", label: "男声 (青叔音)" },
      { id: "audiobook_male_2", label: "男声 (沉稳)" },
      { id: "audiobook_female_1", label: "女声 (温柔)" },
      { id: "audiobook_female_2", label: "女声 (甜美)" },
      { id: "male-qn-qingse", label: "青年男声" },
      { id: "female-shaonv", label: "少女音" }
    ],
    videoDefault: "Hailuo-2.3-Fast-768P 6s",
    videoOptions: ["Hailuo-2.3-Fast-768P 6s", "Hailuo-2.3-768P 6s"],
    imageDefault: "image-01",
    imageOptions: ["1:1", "16:9", "9:16", "4:3", "3:4"],
    musicDefault: "music-2.5",
    musicOptions: ["music-2.5"]
  },
  audio: {
    voice: {
      sampleRate: 32000,
      bitrate: 128000,
      format: "mp3",
      channel: 1
    },
    music: {
      sampleRate: 44100,
      bitrate: 256000,
      format: "mp3"
    }
  }
};

const mergedConfig: AppConfig = {
  ...defaultConfig,
  ...userConfig,
  models: {
    ...defaultConfig.models,
    ...userConfig.models,
    chatOptions: userConfig.models?.chatOptions?.length ? userConfig.models.chatOptions : defaultConfig.models.chatOptions,
    voiceOptions: userConfig.models?.voiceOptions?.length ? userConfig.models.voiceOptions : defaultConfig.models.voiceOptions,
    videoOptions: userConfig.models?.videoOptions?.length ? userConfig.models.videoOptions : defaultConfig.models.videoOptions,
    imageOptions: userConfig.models?.imageOptions?.length ? userConfig.models.imageOptions : defaultConfig.models.imageOptions,
    musicOptions: userConfig.models?.musicOptions?.length ? userConfig.models.musicOptions : defaultConfig.models.musicOptions
  },
  audio: {
    voice: {
      ...defaultConfig.audio.voice,
      ...userConfig.audio?.voice
    },
    music: {
      ...defaultConfig.audio.music,
      ...userConfig.audio?.music
    }
  }
};

export const appConfig = mergedConfig;
export type { AppConfig, VoiceOption };
