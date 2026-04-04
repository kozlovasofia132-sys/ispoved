import os
os.environ["HF_HOME"] = "D:/hf_cache"

import soundfile as sf
from qwen_tts import Qwen3TTSModel

voices = ["aiden", "dylan", "eric", "ono_anna", "ryan", "serena", "sohee", "uncle_fu", "vivian"]

print("Загрузка модели...")
tts = Qwen3TTSModel.from_pretrained(
    "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice",
    device_map="cpu",
)

for voice in voices:
    text = f"Привет! Меня зовут {voice}. Это тест голосового синтеза."
    print(f"Генерация: {voice}...")
    wavs, sr = tts.generate_custom_voice(
        text=text,
        speaker=voice,
        language="auto",
    )
    filename = f"voice_{voice}.wav"
    sf.write(filename, wavs[0], samplerate=sr)
    print(f"  -> {filename} ({len(wavs[0])/sr:.2f} сек)")

print("\nГотово! Все файлы сгенерированы.")
