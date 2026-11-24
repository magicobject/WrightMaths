"""Make Listen recordings with Piper, many sentences in one go.

Reads the reading script written by `npm run book:audio -- todo` (audio-work/script.json: a list of
{"hash", "text"}), speaks each sentence with one Piper voice and writes small Ogg Vorbis files named by
hash into public/audio/book/. Sentences that already have a file are skipped, so it can be stopped and
restarted. Finish with `npm run book:audio -- manifest`.

Needs: pip install piper-tts soundfile, and a Piper voice (python -m piper.download_voices <voice>).

    python scripts/piper-batch.py --voice path/to/en_GB-alba-medium.onnx [--script audio-work/script.json]
                                  [--out public/audio/book] [--quality 0.85] [--limit 50]

The words are spoken exactly as written in the script: they are already the "what the voice reads" text.
"""
import argparse
import json
import os
import sys
import time

import numpy as np
import soundfile as sf
from piper import PiperVoice


def is_good(path):
    """A finished clip has some audio in it (an interrupted run can leave an empty file)."""
    try:
        return sf.info(path).frames > 0
    except Exception:
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--voice', required=True, help='path to the Piper .onnx voice')
    ap.add_argument('--script', default='audio-work/script.json')
    ap.add_argument('--out', default='public/audio/book')
    ap.add_argument('--quality', type=float, default=0.85, help='Ogg compression 0 to 1: 0.85 is about 40 kbps')
    ap.add_argument('--limit', type=int, default=0, help='stop after this many new clips (0 = all)')
    args = ap.parse_args()

    with open(args.script, encoding='utf8') as f:
        rows = json.load(f)
    os.makedirs(args.out, exist_ok=True)
    voice = PiperVoice.load(args.voice)
    started = time.time()
    made = skipped = 0
    seconds = 0.0
    for row in rows:
        path = os.path.join(args.out, f"{row['hash']}.ogg")
        if os.path.exists(path) and is_good(path):
            skipped += 1
            continue
        pieces = [chunk.audio_int16_array for chunk in voice.synthesize(row['text'])]
        if not pieces:
            print('no audio for', row['hash'], file=sys.stderr)
            continue
        samples = np.concatenate(pieces)
        # Write beside the real name and rename, so stopping the script never leaves a half-written clip.
        partial = path + '.part'
        # Written in small blocks: encoding a whole long clip in one call overflows the stack inside libsndfile on Windows.
        with sf.SoundFile(partial, 'w', samplerate=voice.config.sample_rate, channels=1, format='OGG', subtype='VORBIS', compression_level=args.quality) as out:
            for start in range(0, len(samples), 8192):
                out.write(samples[start:start + 8192])
        os.replace(partial, path)
        made += 1
        seconds += len(samples) / voice.config.sample_rate
        if made % 25 == 0:
            print(f'{made} made, {skipped} skipped, {seconds / 60:.1f} min of speech, {time.time() - started:.0f}s elapsed', flush=True)
        if args.limit and made >= args.limit:
            break
    print(f'done: {made} new clips ({seconds / 60:.1f} minutes of speech), {skipped} already existed, {time.time() - started:.0f}s')


if __name__ == '__main__':
    main()
