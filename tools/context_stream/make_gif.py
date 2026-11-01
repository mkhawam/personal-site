"""Render the context-momentum animation for posts/agentic_momentum.md.

Usage:  python3 tools/context_stream/make_gif.py [out.gif]

Left panel: a context stream. Lines type in at the bottom and the whole stack
glides upward, older lines fading out at the top. One "doubt" line appears
partway through. Right panel: what the model is most likely to output next.
The doubt nudges "stop" up briefly, then more tool calls land and it fades.

Tweak the CONFIG block and re-run. Pure Pillow, no other deps.
"""
import sys
from PIL import Image, ImageDraw, ImageFont

# ---------------- CONFIG ----------------
W, H = 800, 450
FPS = 12
OUT = sys.argv[1] if len(sys.argv) > 1 else "public/img/context_momentum.gif"
FONT = "/usr/share/fonts/liberation-mono-fonts/LiberationMono-Regular.ttf"
FONT_BOLD = "/usr/share/fonts/liberation-mono-fonts/LiberationMono-Bold.ttf"

BG       = (15, 23, 42)
PANEL    = (30, 41, 59)
BORDER   = (71, 85, 105)
TEXT     = (226, 232, 240)
MUTED    = (148, 163, 184)
CALL     = (96, 165, 250)
RESULT   = (100, 116, 139)
DOUBT    = (251, 191, 36)
STOP     = (248, 113, 113)

CALLS_BEFORE_DOUBT = 7
CALLS_AFTER_DOUBT = 6
TYPE_FRAMES = 3        # frames to type one line in
DOUBT_HOLD = 14        # extra frames the doubt lingers before the stream resumes
END_HOLD = 12
LINE_H = 25
SCROLL_EASE = 0.35     # 0..1, higher = snappier scroll
FADE_ROWS = 2.5        # how many rows at the top fade out
# ----------------------------------------

TOOLS = [
    'search("config loader")', 'read_file("app/config.py")', 'edit_file("app/config.py")',
    'run_tests()', 'read_file("tests/test_config.py")', 'search("env override")',
    'edit_file("app/env.py")', 'run_tests()', 'read_file("docs/setup.md")',
    'search("legacy loader")', 'edit_file("app/legacy.py")', 'run_tests()',
    'read_file("app/main.py")', 'edit_file("app/main.py")', 'run_tests()',
]
RESULTS = ["3 matches", "ok (212 lines)", "ok", "41 passed, 2 failed", "ok (88 lines)",
           "1 match", "ok", "43 passed", "ok (40 lines)", "2 matches", "ok",
           "43 passed", "ok (310 lines)", "ok", "44 passed"]

font = ImageFont.truetype(FONT, 15)
font_small = ImageFont.truetype(FONT, 13)
font_bold = ImageFont.truetype(FONT_BOLD, 15)
font_title = ImageFont.truetype(FONT_BOLD, 17)

LX0, LY0, LX1, LY1 = 24, 24, 512, H - 64
RX0, RY0, RX1, RY1 = 536, 24, W - 24, H - 64
STREAM_TOP, STREAM_BOT = LY0 + 48, LY1 - 14


def build_script():
    """Per frame: (lines, typed_chars_of_last_line, p_stop)."""
    lines = [("task", "task: make the config loader read env overrides")]
    frames = []
    n_calls = 0

    def p_stop(bump):
        return min(0.9, max(0.04, 0.30 - 0.035 * n_calls) + bump)

    def type_line(kind, text, bump=0.0):
        lines.append((kind, text))
        for f in range(1, TYPE_FRAMES + 1):
            chars = int(len(text) * f / TYPE_FRAMES)
            frames.append((list(lines), chars, p_stop(bump)))

    frames.append((list(lines), len(lines[-1][1]), p_stop(0)))
    for i in range(CALLS_BEFORE_DOUBT):
        type_line("call", f"call   {TOOLS[i]}"); n_calls += 1
        type_line("result", f"result {RESULTS[i]}")

    type_line("doubt", "doubt  this might be out of scope for the task", bump=0.33)
    for _ in range(DOUBT_HOLD):
        frames.append((list(lines), len(lines[-1][1]), p_stop(0.33)))

    bump = 0.33
    for i in range(CALLS_AFTER_DOUBT):
        j = CALLS_BEFORE_DOUBT + i
        bump *= 0.55
        type_line("call", f"call   {TOOLS[j]}", bump); n_calls += 1
        type_line("result", f"result {RESULTS[j]}", bump)
    for _ in range(END_HOLD):
        frames.append((list(lines), len(lines[-1][1]), p_stop(bump)))
    return frames


def blend(c, towards, a):
    return tuple(int(c[i] * (1 - a) + towards[i] * a) for i in range(3))


def rounded(d, box, fill, outline=None, r=8):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline)


def render(lines, typed, p_stop, offset):
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)

    # ---- left: context stream ----
    rounded(d, (LX0, LY0, LX1, LY1), PANEL, BORDER, r=12)
    d.text((LX0 + 16, LY0 + 12), "context", font=font_title, fill=TEXT)
    d.text((LX1 - 16, LY0 + 14), f"{len(lines)} lines", font=font_small, fill=MUTED, anchor="ra")

    # draw the stream on its own layer so it can be clipped to the panel
    layer = Image.new("RGB", (LX1 - LX0 - 2, STREAM_BOT - STREAM_TOP), PANEL)
    ld = ImageDraw.Draw(layer)
    fade_px = FADE_ROWS * LINE_H
    for i, (kind, text) in enumerate(lines):
        y = i * LINE_H - offset
        if y < -LINE_H or y > layer.height:
            continue
        color = {"task": MUTED, "call": CALL, "result": RESULT, "doubt": DOUBT}[kind]
        a = max(0.0, min(1.0, 1 - (y - 6) / fade_px)) if y < fade_px + 6 else 0.0
        color = blend(color, PANEL, a)
        shown = text[:typed] if i == len(lines) - 1 else text
        if kind == "doubt":
            rounded(ld, (8, y - 3, layer.width - 8, y + 20), blend((69, 52, 20), PANEL, a), None, r=6)
            ld.text((16, y), shown, font=font_bold, fill=color)
        else:
            ld.text((16, y), shown, font=font, fill=color)
        if i == len(lines) - 1 and typed < len(text):
            cx = 16 + ld.textlength(shown, font=font)
            ld.rectangle((cx + 1, y + 2, cx + 9, y + 18), fill=blend(TEXT, PANEL, 0.3))
    im.paste(layer, (LX0 + 1, STREAM_TOP))

    # ---- right: next output ----
    rounded(d, (RX0, RY0, RX1, RY1), PANEL, BORDER, r=12)
    d.text((RX0 + 16, RY0 + 12), "next output", font=font_title, fill=TEXT)
    bx0, bx1 = RX0 + 16, RX1 - 16

    def bar(y, label, p, color):
        d.text((bx0, y), label, font=font, fill=TEXT)
        d.text((bx1, y), f"{int(p * 100):>3d}%", font=font, fill=color, anchor="ra")
        rounded(d, (bx0, y + 24, bx1, y + 44), (51, 65, 85), None, r=6)
        if p > 0.02:
            rounded(d, (bx0, y + 24, bx0 + int((bx1 - bx0) * p), y + 44), color, None, r=6)

    bar(RY0 + 60, "tool call", 1 - p_stop, CALL)
    bar(RY0 + 130, "stop", p_stop, STOP)

    d.text((W // 2, H - 34), "context momentum", font=font_title, fill=TEXT, anchor="mm")
    return im


def main():
    script = build_script()
    visible_h = STREAM_BOT - STREAM_TOP
    frames, offset = [], 0.0
    for lines, typed, p in script:
        target = max(0.0, (len(lines) + 1) * LINE_H - visible_h)
        offset += (target - offset) * SCROLL_EASE
        im = render(lines, typed, p, offset)
        frames.append(im.quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE))
    frames[0].save(OUT, save_all=True, append_images=frames[1:],
                   duration=int(1000 / FPS), loop=0, optimize=True, disposal=1)
    print(f"wrote {OUT}: {len(frames)} frames, {len(frames)/FPS:.1f}s")


if __name__ == "__main__":
    main()
