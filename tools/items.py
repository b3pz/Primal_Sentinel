"""Pixel-art items, props and weapons for the stages."""
import math
from PIL import Image
from pixel import Canvas, hexc, shade, trim

K = 2  # upscale factor (chunky arcade pixels)
OUTL = (18, 12, 22, 255)


def done(c, k=K, light=True):
    if light:
        c.light(0.18)
    c.outline(OUTL)
    im = c.scaled(k)
    im, _, _ = trim(im, 0)
    return im


def pizza():
    c = Canvas(30, 24)
    crust, crust_d = hexc('c9853b'), hexc('8d5424')
    cheese, cheese_d = hexc('ffd35a'), hexc('e8a93a')
    c.poly([(2, 4), (27, 2), (15, 22)], cheese_d)
    c.poly([(3, 5), (25, 3), (15, 19)], cheese)
    c.limb((2, 4), (27, 2), 2.2, crust)
    c.line([(3, 6), (26, 4)], crust_d)
    for x, y in [(11, 8), (19, 7), (15, 13)]:
        c.ell(x - 2, y - 2, x + 2, y + 2, hexc('d8322b'))
        c.px(x - 1, y - 1, hexc('ff7a5e'))
    for x, y in [(8, 7), (22, 5), (14, 17)]:
        c.px(x, y, hexc('3f9b3a')); c.px(x + 1, y, hexc('3f9b3a'))
    c.line([(16, 19), (15, 23)], cheese)  # a drip of cheese
    return done(c)


def chicken():
    c = Canvas(40, 26)
    c.ell(1, 15, 38, 25, hexc('dfe6ee'))           # plate
    c.ell(4, 16, 35, 23, hexc('f7fbff'))
    c.ell(5, 5, 31, 21, hexc('8a4a1e'))            # roast
    c.ell(7, 6, 29, 18, hexc('c0702e'))
    c.ell(10, 7, 22, 13, hexc('e6a152'))
    c.px(13, 8, hexc('fff0c0')); c.px(14, 8, hexc('fff0c0'))
    for (a, b) in [((28, 10), (35, 4)), ((27, 15), (36, 12))]:  # drumstick bones
        c.limb(a, b, 1.3, hexc('f4ecd8'))
        c.ell(b[0] - 2, b[1] - 2, b[0] + 2, b[1] + 1, hexc('fffaf0'))
    for x in (8, 17, 24):
        c.px(x, 17, hexc('3f9b3a')); c.px(x + 1, 18, hexc('58c24a'))
    return done(c)


def can():
    c = Canvas(12, 18)
    c.rect(1, 2, 10, 16, hexc('d42f2f'))
    c.rect(1, 7, 10, 10, hexc('f4f4f4'))
    c.rect(1, 1, 10, 2, hexc('c3cdd6'))
    c.rect(1, 16, 10, 17, hexc('9aa6b1'))
    c.rect(2, 2, 3, 15, hexc('ff7a6a'))
    c.line([(4, 8), (8, 9)], hexc('d42f2f'))
    return done(c)


def energy():
    c = Canvas(16, 26)
    c.rect(3, 4, 12, 21, hexc('1d62c9'))
    c.rect(4, 5, 11, 20, hexc('4fb3ff'))
    c.rect(5, 6, 6, 19, hexc('c9f0ff'))
    c.poly([(9, 6), (6, 13), (9, 13), (7, 19), (11, 11), (8, 11), (10, 6)], hexc('ffffff'))
    c.rect(2, 1, 13, 4, hexc('9aa6b1')); c.rect(2, 21, 13, 24, hexc('9aa6b1'))
    c.rect(3, 1, 12, 1, hexc('dde5ec')); c.rect(3, 21, 12, 21, hexc('dde5ec'))
    return done(c)


def coin():
    c = Canvas(18, 18)
    c.ell(1, 1, 16, 16, hexc('b0741a'))
    c.ell(2, 2, 15, 15, hexc('ffc73b'))
    c.ell(4, 4, 13, 13, hexc('e59e22'))
    c.poly([(8, 5), (10, 9), (13, 9), (10, 11), (11, 14), (8, 12), (6, 14), (7, 11), (4, 9), (7, 9)], hexc('fff1a8'))
    return done(c)


def gem():
    c = Canvas(18, 20)
    c.poly([(9, 1), (16, 7), (9, 19), (2, 7)], hexc('7b2fd0'))
    c.poly([(9, 1), (16, 7), (9, 8)], hexc('b67dff'))
    c.poly([(9, 1), (2, 7), (9, 8)], hexc('dcc0ff'))
    c.poly([(2, 7), (9, 8), (9, 19)], hexc('9b52ea'))
    c.px(7, 4, hexc('ffffff')); c.px(6, 5, hexc('ffffff'))
    return done(c, light=False)


def pipe():
    c = Canvas(52, 8)
    c.rect(2, 2, 49, 5, hexc('8793a0'))
    c.rect(2, 2, 49, 2, hexc('d7e0e8'))
    c.rect(2, 5, 49, 5, hexc('55606c'))
    c.rect(0, 1, 5, 6, hexc('6c7782')); c.rect(46, 1, 51, 6, hexc('6c7782'))
    c.rect(0, 1, 5, 1, hexc('b8c2cc')); c.rect(46, 1, 51, 1, hexc('b8c2cc'))
    return done(c, light=False)


def oar():
    c = Canvas(60, 12)
    c.rect(1, 5, 40, 7, hexc('b77b3e'))
    c.rect(1, 5, 40, 5, hexc('e0a866'))
    c.rect(1, 4, 7, 8, hexc('8a5a2b'))
    c.poly([(38, 3), (58, 1), (59, 10), (38, 9)], hexc('c8894a'))
    c.poly([(40, 4), (57, 2), (57, 5), (40, 6)], hexc('e8b273'))
    c.rect(44, 3, 46, 9, hexc('2f7fb8'))   # painted band
    return done(c, light=False)


def crate(broken=False):
    c = Canvas(34, 32)
    wood, dark, light = hexc('9a6536'), hexc('5d3a1c'), hexc('c98d4f')
    c.rect(1, 1, 32, 30, dark)
    for y in (2, 11, 20):
        c.rect(2, y, 31, y + 7, wood)
        c.rect(2, y, 31, y, light)
    c.rect(1, 1, 4, 30, hexc('7a4c24')); c.rect(29, 1, 32, 30, hexc('7a4c24'))
    c.line([(4, 28), (29, 3)], hexc('7a4c24'), 3)
    c.line([(5, 28), (29, 4)], light, 1)
    for x, y in [(2, 3), (30, 3), (2, 27), (30, 27)]:
        c.px(x, y, hexc('e7dccb'))
    c.rect(11, 12, 22, 17, hexc('3a2412'))    # stencil
    c.rect(12, 13, 21, 16, hexc('c98d4f'))
    return done(c)


def plank(i):
    c = Canvas(18, 8)
    pts = [[(1, 2), (16, 1), (17, 5), (2, 6)], [(1, 1), (12, 2), (11, 6), (2, 5)],
           [(2, 2), (15, 3), (13, 6), (1, 5)], [(1, 2), (9, 1), (10, 5), (1, 6)]][i]
    c.poly(pts, hexc('9a6536'))
    c.line([pts[0], pts[1]], hexc('c98d4f'))
    return done(c)


def barrel():
    c = Canvas(28, 36)
    red, dred = hexc('c9302c'), hexc('7b1616')
    c.ell(1, 1, 26, 8, dred)
    c.rect(1, 4, 26, 31, red)
    c.ell(1, 28, 26, 35, dred)
    c.ell(3, 2, 24, 6, hexc('3a0c0c'))
    c.ell(5, 3, 9, 5, hexc('9aa6b1'))
    for y in (11, 22):
        c.rect(1, y, 26, y + 2, hexc('8d1e1e'))
        c.rect(1, y, 26, y, hexc('ff6a5a'))
    c.rect(4, 5, 6, 30, hexc('ff7a66'))
    c.poly([(13, 13), (18, 21), (8, 21)], hexc('ffd23b'))   # hazard sign
    c.rect(12, 16, 13, 18, hexc('1a1a1a')); c.px(12, 20, hexc('1a1a1a')); c.px(13, 20, hexc('1a1a1a'))
    return done(c)


def bin_():
    c = Canvas(28, 36)
    g, dg = hexc('3d7a4a'), hexc('1f4428')
    c.poly([(3, 8), (24, 8), (22, 34), (5, 34)], g)
    for x in (7, 11, 15, 19):
        c.line([(x, 10), (x + (1 if x > 13 else 0), 32)], dg)
    c.rect(1, 4, 26, 8, hexc('5c9a66'))
    c.rect(1, 4, 26, 4, hexc('9bd2a0'))
    c.rect(10, 1, 17, 3, hexc('2c5a36'))
    c.rect(5, 12, 7, 30, hexc('74b27e'))
    return done(c)


def bollard():
    c = Canvas(20, 22)
    c.rect(4, 6, 15, 20, hexc('2b3440'))
    c.ell(2, 2, 17, 9, hexc('3a4655'))
    c.ell(4, 3, 15, 7, hexc('56657a'))
    c.rect(2, 18, 17, 21, hexc('1d242d'))
    c.rect(5, 8, 6, 18, hexc('6d7f96'))
    return done(c)


ITEMS = {
    'pizza': pizza, 'chicken': chicken, 'can': can, 'energy': energy, 'coin': coin, 'gem': gem,
    'pipe': pipe, 'oar': oar, 'crate': crate, 'barrel': barrel, 'bin': bin_,
    'plank0': lambda: plank(0), 'plank1': lambda: plank(1), 'plank2': lambda: plank(2), 'plank3': lambda: plank(3),
}


def build():
    frames = []
    for k, fn in ITEMS.items():
        im = fn()
        frames.append((k, im, im.width / 2, im.height))  # anchor: bottom centre
    return frames


if __name__ == '__main__':
    fr = build()
    W = sum(f[1].width + 8 for f in fr)
    H = max(f[1].height for f in fr) + 8
    sheet = Image.new('RGBA', (W, H), (40, 44, 60, 255))
    x = 4
    for k, im, _, _ in fr:
        sheet.alpha_composite(im, (x, H - 4 - im.height)); x += im.width + 8
    sheet.resize((W * 2, H * 2), Image.NEAREST).save('/tmp/claude-0/-home-claude/3434d8e8-e296-554c-ac5f-070a00e2bd55/scratchpad/items.png')
