#!/usr/bin/env python3
"""
whisper-align.py — alinha palavras ao áudio com timestamps exatos.
Uso: python3 whisper-align.py <audio.mp3> [texto_original]
Saída: JSON para stdout com [{word, start, end}, ...]
"""
import sys
import json
import warnings
warnings.filterwarnings('ignore')

import whisper

audio_path     = sys.argv[1]
initial_prompt = sys.argv[2] if len(sys.argv) > 2 else None

# small = mais preciso que base, ainda rápido o suficiente (~15s em CPU)
model  = whisper.load_model('small')
result = model.transcribe(
    audio_path,
    language='pt',
    word_timestamps=True,
    condition_on_previous_text=False,
    fp16=False,
    verbose=False,
    initial_prompt=initial_prompt,  # guia o modelo para o texto esperado → menos erros
)

words = []
for seg in result.get('segments', []):
    for w in seg.get('words', []):
        word = w['word'].strip().lstrip('​')  # remove zero-width spaces
        if word:
            words.append({
                'word':  word,
                'start': round(float(w['start']), 3),
                'end':   round(float(w['end']),   3),
            })

print(json.dumps(words, ensure_ascii=False))
