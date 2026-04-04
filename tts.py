import os
os.environ["HF_HOME"] = "D:/hf_cache"

import soundfile as sf
from qwen_tts import Qwen3TTSModel

# Загрузка модели (первый раз скачает ~3 ГБ с HuggingFace)
tts = Qwen3TTSModel.from_pretrained(
    "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice",
    device_map="cpu",
)

# Генерация речи
wavs, sr = tts.generate_custom_voice(
    text="Привет! Это тест голосового синтеза Qwen TTS.",
    speaker="serena",
    language="auto",
)

# Сохранение
sf.write("output.wav", wavs[0], samplerate=sr)

print(f"Готово! Файл сохранён: output.wav (sample rate: {sr})")
