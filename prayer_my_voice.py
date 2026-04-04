import os
os.environ["HF_HOME"] = "D:/hf_cache"

import soundfile as sf
from qwen_tts import Qwen3TTSModel

PRAYER = (
    "Царю Небесный, Утешителю, Душе истины, "
    "Иже везде сый и вся исполняяй, "
    "Сокровище благих и жизни Подателю, "
    "прииди и вселися в ны, и очисти ны от всякия скверны, "
    "и спаси, Блаже, души наша."
)

print("Загрузка Base-модели (клонирование голоса)...")
tts = Qwen3TTSModel.from_pretrained(
    "Qwen/Qwen3-TTS-12Hz-1.7B-Base",
    device_map="cpu",
)

print("Генерация молитвы с клонированным голосом...")
wavs, sr = tts.generate_voice_clone(
    text=PRAYER,
    language="auto",
    ref_audio="D:/Ispoved/audio/my_voice.mp3",
    x_vector_only_mode=True,
)

out_file = "D:/Ispoved/prayer_царю_небесный.wav"
sf.write(out_file, wavs[0], samplerate=sr)
print(f"Готово! Файл сохранён: {out_file} ({len(wavs[0])/sr:.2f} сек)")
