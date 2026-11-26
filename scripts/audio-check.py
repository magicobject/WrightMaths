"""Check the Listen recordings by transcribing each one and comparing it with the sentence it should say.

Needs: pip install "onnx-asr[hub]" soundfile (the whisper-base model downloads on first run). faster-whisper is
not used: its native libraries are blocked by Windows Application Control on this machine. Run
`npm run book:audio -- all` first, which writes audio-work/all.json (every sentence).

    python scripts/audio-check.py [--limit 50] [--only HASH,HASH] [--model whisper-base]

Results are appended to audio-work/check.jsonl (one line per clip) so it can be stopped and restarted;
audio-work/check-report.txt lists the clips to listen to, worst first. The speech model is another listener, not
a judge: it catches extra, missing or garbled words (such as "dot" where a full stop should be a pause),
not odd stress or tone.
"""
import argparse
import difflib
import json
import os
import re
import sys
import time

ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS = 'x x twenty thirty forty fifty sixty seventy eighty ninety'.split()


def n2w(n):
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ('' if n % 10 == 0 else ' ' + ONES[n % 10])
    if n < 1000:
        return ONES[n // 100] + ' hundred' + ('' if n % 100 == 0 else ' ' + n2w(n % 100))
    for size, name in ((10**9, 'billion'), (10**6, 'million'), (1000, 'thousand')):
        if n >= size:
            return n2w(n // size) + ' ' + name + ('' if n % size == 0 else ' ' + n2w(n % size))


def words(text):
    t = text.lower().replace('£', ' pounds ').replace('%', ' percent ').replace('°', ' degrees ')
    t = re.sub(r'(\d),(\d{3})', r'\1\2', t)
    t = re.sub(r'(\d+)\.(\d+)', lambda m: m.group(1) + ' point ' + ' '.join(m.group(2)), t)
    t = re.sub(r'\d+', lambda m: n2w(int(m.group())), t)
    t = t.replace('-', ' ').replace("'", '')
    toks = re.findall(r'[a-z]+', t)
    return [w for w in toks if w != 'and']  # "and" in numbers is noise on both sides


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', default='whisper-base')
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--only', default='')
    ap.add_argument('--sheet', default='audio-work/all.json')
    ap.add_argument('--clips', default='public/audio/book')
    ap.add_argument('--out', default='audio-work/check.jsonl')
    args = ap.parse_args()
    import numpy as np
    import onnx_asr
    import soundfile as sf
    model = onnx_asr.load_model(args.model)
    rows = json.load(open(args.sheet, encoding='utf8'))
    only = set(filter(None, args.only.split(',')))
    done = set()
    if os.path.exists(args.out) and not only:
        done = {json.loads(l)['hash'] for l in open(args.out, encoding='utf8') if l.strip()}
    started, n = time.time(), 0
    with open(args.out, 'a', encoding='utf8') as out:
        for r in rows:
            if only and r['hash'] not in only:
                continue
            if r['hash'] in done:
                continue
            path = os.path.join(args.clips, r['hash'] + '.ogg')
            if not os.path.exists(path):
                continue
            audio, rate = sf.read(path, dtype='float32')
            if audio.ndim > 1:
                audio = audio.mean(axis=1)
            audio = np.interp(np.linspace(0, len(audio), int(len(audio) * 16000 / rate), endpoint=False), np.arange(len(audio)), audio).astype('float32')
            heard = str(model.recognize(audio, sample_rate=16000)).strip()
            want, got = words(r['text']), words(heard)
            sm = difflib.SequenceMatcher(None, want, got, autojunk=False)
            extra = [' '.join(got[j1:j2]) for op, i1, i2, j1, j2 in sm.get_opcodes() if op in ('insert', 'replace')]
            missing = [' '.join(want[i1:i2]) for op, i1, i2, j1, j2 in sm.get_opcodes() if op in ('delete', 'replace')]
            rec = {'hash': r['hash'], 'number': r['number'], 'ratio': round(sm.ratio(), 3), 'seconds': round(len(audio) / 16000, 2),
                   'extra': extra, 'missing': missing, 'text': r['text'], 'heard': heard}
            out.write(json.dumps(rec, ensure_ascii=False) + '\n')
            out.flush()
            n += 1
            if n % 50 == 0:
                print(f'{n} checked, {time.time() - started:.0f}s', flush=True)
            if args.limit and n >= args.limit:
                break
    print(f'done: {n} checked in {time.time() - started:.0f}s')


if __name__ == '__main__':
    main()
