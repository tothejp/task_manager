import tkinter as tk
import random
import math
from PIL import Image, ImageDraw, ImageFilter, ImageTk

W, H = 780, 860

# ── 게임 로직 ────────────────────────────────────────────────────────────────

def generate_number():
    digits = random.sample(range(10), 4)
    if digits[0] == 0:
        digits[0], digits[1] = digits[1], digits[0]
    return digits

def check_guess(secret, guess):
    strikes = sum(s == g for s, g in zip(secret, guess))
    balls = sum(g in secret for g in guess) - strikes
    return strikes, balls

# ── Oracle Park 배경 생성 (PIL) ───────────────────────────────────────────────

def create_oracle_park(w, h):
    img = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(img)

    # ── 하늘: SF 황혼 그라데이션 (위=짙은 남색 → 아래=따뜻한 주황/분홍) ──
    for y in range(int(h * 0.52)):
        t = y / (h * 0.52)
        if t < 0.5:
            s = t / 0.5
            r = int(10  + s * 60)
            g = int(15  + s * 50)
            b = int(90  + s * 70)
        else:
            s = (t - 0.5) / 0.5
            r = int(70  + s * 160)
            g = int(65  + s * 80)
            b = int(160 - s * 80)
        d.line([(0, y), (w, y)], fill=(r, g, b))

    # ── 샌프란시스코 만 (McCovey Cove - 오라클 파크 오른쪽 특징) ──
    bay = [(int(w*0.60), int(h*0.28)), (w, int(h*0.22)),
           (w, int(h*0.50)), (int(w*0.70), int(h*0.52))]
    d.polygon(bay, fill=(18, 55, 115))
    for i in range(7):
        wy = int(h * (0.30 + i * 0.028))
        d.arc([int(w*0.62), wy, int(w*0.96), wy + 9],
              0, 180, fill=(38, 90, 165), width=1)

    # ── 좌측 관중석 ──
    d.polygon([(0, int(h*0.01)), (int(w*0.48), int(h*0.01)),
               (int(w*0.48), int(h*0.40)), (0, int(h*0.44))],
              fill=(32, 30, 26))
    # ── 우측 관중석 ──
    d.polygon([(int(w*0.60), int(h*0.01)), (w, int(h*0.01)),
               (w, int(h*0.28)), (int(w*0.60), int(h*0.32))],
              fill=(32, 30, 26))

    # ── 관중석 좌석 줄 ──
    seat_cols = [(160,25,25),(25,90,25),(25,25,140),
                 (140,90,25),(90,25,110),(25,110,110)]
    for i in range(11):
        ty  = int(h * (0.05 + i * 0.030))
        ty2 = ty + int(h * 0.022)
        # 왼쪽
        d.rectangle([int(w*0.01), ty, int(w*(0.12 + i*0.034)), ty2],
                    fill=seat_cols[i % len(seat_cols)])
        d.line([(0, ty), (int(w*0.48), ty)], fill=(15,15,15), width=1)
    for i in range(9):
        ty  = int(h * (0.05 + i * 0.027))
        ty2 = ty + int(h * 0.020)
        # 오른쪽
        d.rectangle([int(w*(0.78 - i*0.012)), ty, int(w*0.99), ty2],
                    fill=seat_cols[(i+3) % len(seat_cols)])
        d.line([(int(w*0.60), ty), (w, ty)], fill=(15,15,15), width=1)

    # ── 조명탑 4개 ──
    for lxr in [0.05, 0.34, 0.66, 0.95]:
        lx = int(w * lxr)
        d.line([(lx, int(h*0.01)), (lx, int(h*0.38))],
               fill=(80, 80, 70), width=5)
        d.rectangle([lx-20, int(h*0.01), lx+20, int(h*0.022)],
                    fill=(230, 225, 175))
        for gx in range(lx-16, lx+16, 7):
            d.ellipse([gx-2, int(h*0.012), gx+2, int(h*0.020)],
                      fill=(255, 255, 200))

    # ── 오라클 파크 벽돌 아치 (좌측 파사드) ──
    for i in range(4):
        ax = int(w * (0.01 + i * 0.055))
        d.arc([ax, int(h*0.30), ax+int(w*0.06), int(h*0.44)],
              180, 360, fill=(115, 65, 35), width=5)
        d.arc([ax+4, int(h*0.31), ax+int(w*0.06)-4, int(h*0.43)],
              180, 360, fill=(95, 50, 25), width=2)

    # ── 외야 잔디 (원근감 있는 사다리꼴) ──
    d.polygon([(0, int(h*0.42)), (w, int(h*0.39)),
               (w, h), (0, h)], fill=(25, 80, 25))

    # 잔디 줄무늬 (라이트/다크 교차)
    for i in range(22):
        sy = int(h * (0.42 + i * 0.032))
        ey = sy + int(h * 0.016)
        color = (25, 78, 25) if i % 2 == 0 else (34, 100, 34)
        d.rectangle([0, sy, w, ey], fill=color)

    # ── 내야 흙 (다이아몬드, 원근감) ──
    cx  = int(w * 0.50)
    cy  = int(h * 0.70)
    drx = int(w * 0.23)
    dry = int(h * 0.16)
    d.polygon([(cx, cy - dry),
               (cx + drx, cy),
               (cx, cy + int(dry*0.65)),
               (cx - drx, cy)],
              fill=(148, 100, 55))

    # 내야 잔디 원
    d.ellipse([cx - int(drx*0.52), cy - int(dry*0.52),
               cx + int(drx*0.52), cy + int(dry*0.52)],
              fill=(25, 80, 25))

    # 경고트랙
    d.arc([int(w*0.04), int(h*0.44), int(w*0.96), int(h*0.90)],
          200, 340, fill=(118, 82, 45), width=20)

    # 파울 라인 (점선 없이 실선)
    home_x, home_y = cx, cy + int(dry * 0.62)
    d.line([(home_x, home_y), (int(w*0.02), int(h*0.43))],
           fill=(210, 205, 190), width=3)
    d.line([(home_x, home_y), (int(w*0.98), int(h*0.41))],
           fill=(210, 205, 190), width=3)

    # 베이스
    bs = 11
    for bx, by in [
        (cx,        home_y),
        (cx + drx,  cy),
        (cx,        cy - dry),
        (cx - drx,  cy),
    ]:
        d.rectangle([bx-bs, by-bs, bx+bs, by+bs], fill=(238, 232, 215))

    # 투수판
    d.ellipse([cx-18, cy-int(dry*0.1)-9,
               cx+18, cy-int(dry*0.1)+9], fill=(142, 96, 52))
    d.rectangle([cx-10, cy-int(dry*0.1)-4,
                 cx+10, cy-int(dry*0.1)+4], fill=(220, 215, 200))

    # ── 전체 가우시안 블러 ──
    img = img.filter(ImageFilter.GaussianBlur(radius=11))

    # ── 전체 어둡게 (게임 UI 가독성) ──
    dark = Image.new("RGB", (w, h), (0, 0, 0))
    img  = Image.blend(img, dark, 0.45)

    # ── 패널 영역만 더 어둡게 + 파란 틴트 ──
    pad  = 28
    ph   = 500
    py0  = h - ph - pad
    region = img.crop((pad, py0, w - pad, py0 + ph))
    panel  = Image.new("RGB", (w - 2*pad, ph), (5, 12, 36))
    blended = Image.blend(region, panel, 0.80)
    img.paste(blended, (pad, py0))

    return img, (pad, py0, w - 2*pad, ph)

# ── 앱 ──────────────────────────────────────────────────────────────────────

class BaseballGame(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("⚾ 숫자 야구 — Oracle Park")
        self.resizable(False, False)
        self.geometry(f"{W}x{H}")

        self.secret      = []
        self.attempts    = 0
        self.game_over   = False
        self.cur_digits  = []   # 현재 입력 중인 숫자 리스트 (최대 4개)

        self._build_ui()
        self._new_game()

    # ── UI 구성 ──────────────────────────────────────────────────────────────

    def _build_ui(self):
        self.canvas = tk.Canvas(self, width=W, height=H,
                                highlightthickness=0, bg="black")
        self.canvas.pack()

        # 배경 이미지 생성
        bg_img, (px, py, pw, ph) = create_oracle_park(W, H)
        self.bg_photo = ImageTk.PhotoImage(bg_img)
        self.canvas.create_image(0, 0, anchor="nw", image=self.bg_photo)

        # 패널 테두리
        self.canvas.create_rectangle(px, py, px+pw, py+ph,
                                     outline="#ffdd44", width=2)

        self.panel_x, self.panel_y = px, py
        self.panel_w, self.panel_h = pw, ph

        # 타이틀
        self.canvas.create_text(W//2, py + 30,
                                text="⚾  숫자 야구  ⚾",
                                fill="#ffdd44", font=("Arial", 22, "bold"))
        self.canvas.create_text(W//2, py + 58,
                                text="중복 없는 4자리 숫자를 맞춰보세요!",
                                fill="#aaccff", font=("Arial", 12))

        # 시도 횟수
        self.attempt_var = tk.StringVar(value="0번 시도")
        self.canvas.create_window(
            W//2, py + 85,
            window=tk.Label(self, textvariable=self.attempt_var,
                            bg="#050c24", fg="#6bcb77",
                            font=("Arial", 12, "bold")))

        # ── 야구공 4개 ──
        self.ball_y = py + 175
        gap = 140
        self.ball_xs = [W//2 - gap*1.5, W//2 - gap*0.5,
                        W//2 + gap*0.5, W//2 + gap*1.5]
        self.ball_r  = 52

        # 키보드 캡처용 숨긴 Entry
        self.hidden = tk.Entry(self, width=1,
                               bg="#050c24", fg="#050c24",
                               insertbackground="#050c24",
                               highlightthickness=0, relief="flat",
                               font=("Arial", 1))
        self.canvas.create_window(W//2, self.ball_y, window=self.hidden)
        self.hidden.bind("<Key>",       self._on_key)
        self.hidden.bind("<Return>",    lambda e: self._submit())
        self.hidden.bind("<BackSpace>", self._on_backspace)
        # 캔버스 클릭 시에도 포커스
        self.canvas.bind("<Button-1>",  lambda e: self.hidden.focus_set())

        # 결과 메시지
        self.result_var = tk.StringVar(value="")
        self.canvas.create_window(
            W//2, py + 255,
            window=tk.Label(self, textvariable=self.result_var,
                            bg="#050c24", fg="#ff8888",
                            font=("Arial", 14, "bold"), width=34))

        # 투구 / 새 게임 버튼
        self.canvas.create_window(
            W//2 - 75, py + 292,
            window=tk.Button(self, text="⚾ 투구!",
                             width=9, font=("Arial", 13, "bold"),
                             bg="#ffdd44", fg="#050c24",
                             activebackground="#ffe87a",
                             relief="flat", cursor="hand2",
                             command=self._submit))
        self.canvas.create_window(
            W//2 + 75, py + 292,
            window=tk.Button(self, text="🔄 새 게임",
                             width=9, font=("Arial", 13, "bold"),
                             bg="#1e4a8a", fg="white",
                             activebackground="#2a5eb0",
                             relief="flat", cursor="hand2",
                             command=self._new_game))

        # 히스토리 리스트
        frame = tk.Frame(self, bg="#030a1a")
        self.canvas.create_window(W//2, py + 420,
                                  window=frame,
                                  width=pw - 44, height=188)
        sb = tk.Scrollbar(frame, orient="vertical", bg="#1a3a6e")
        self.hist = tk.Listbox(frame,
                               font=("Consolas", 12),
                               bg="#020810", fg="#99bbee",
                               selectbackground="#1e3a5f",
                               relief="flat", highlightthickness=0,
                               yscrollcommand=sb.set)
        sb.config(command=self.hist.yview)
        sb.pack(side="right", fill="y")
        self.hist.pack(side="left", fill="both", expand=True)

    # ── 야구공 그리기 ────────────────────────────────────────────────────────

    def _draw_balls(self):
        self.canvas.delete("ball")
        for i, bx in enumerate(self.ball_xs):
            digit  = self.cur_digits[i] if i < len(self.cur_digits) else None
            active = (i == len(self.cur_digits)) and not self.game_over
            self._draw_one_ball(int(bx), self.ball_y, self.ball_r, digit, active)

    def _draw_one_ball(self, cx, cy, r, digit=None, active=False):
        # 활성 공 외곽 글로우
        if active:
            self.canvas.create_oval(cx-r-7, cy-r-7, cx+r+7, cy+r+7,
                                    fill="", outline="#ffdd44",
                                    width=2, tags="ball")

        # 공 몸체
        if digit is not None:
            body = "#f5ede0"
        elif active:
            body = "#fdf5e8"
        else:
            body = "#c8c0b0"

        self.canvas.create_oval(cx-r, cy-r, cx+r, cy+r,
                                fill=body, outline="#b0a090",
                                width=2, tags="ball")

        # 실밥 왼쪽 (C자 곡선)
        self.canvas.create_arc(cx - int(r*0.85), cy - int(r*0.48),
                               cx + int(r*0.08), cy + int(r*0.48),
                               start=210, extent=120,
                               style="arc", outline="#cc2222",
                               width=2, tags="ball")
        # 실밥 오른쪽 (역C자 곡선)
        self.canvas.create_arc(cx - int(r*0.08), cy - int(r*0.48),
                               cx + int(r*0.85), cy + int(r*0.48),
                               start=30, extent=120,
                               style="arc", outline="#cc2222",
                               width=2, tags="ball")

        # 실밥 틱 마크
        for side, base_angle, cx_off in [(-1, 210, -0.38), (1, 30, 0.38)]:
            for k in range(4):
                ang = math.radians(base_angle + k * 30 + 15)
                ox  = cx + r * cx_off
                rx  = r * 0.48
                ry  = r * 0.48
                px  = ox + rx * math.cos(ang)
                py  = cy + ry * math.sin(ang)
                tx  = px + 5 * math.cos(ang + math.pi/2)
                ty  = py + 5 * math.sin(ang + math.pi/2)
                bx2 = px - 5 * math.cos(ang + math.pi/2)
                by2 = py - 5 * math.sin(ang + math.pi/2)
                self.canvas.create_line(int(bx2), int(by2),
                                        int(tx), int(ty),
                                        fill="#cc2222", width=1, tags="ball")

        # 숫자 표시
        if digit is not None:
            self.canvas.create_text(cx, cy,
                                    text=str(digit),
                                    fill="#1a1a1a",
                                    font=("Arial", 34, "bold"),
                                    tags="ball")
        elif active:
            # 커서 점
            self.canvas.create_oval(cx-5, cy-5, cx+5, cy+5,
                                    fill="#ffdd44", outline="", tags="ball")

    # ── 입력 이벤트 ──────────────────────────────────────────────────────────

    def _on_key(self, event):
        if self.game_over or not event.char.isdigit():
            return
        if len(self.cur_digits) < 4:
            self.cur_digits.append(int(event.char))
            self.result_var.set("")
            self._draw_balls()
            if len(self.cur_digits) == 4 and len(set(self.cur_digits)) != 4:
                self.result_var.set("❌ 중복된 숫자 — 백스페이스로 수정하세요")

    def _on_backspace(self, event):
        if self.cur_digits:
            self.cur_digits.pop()
            self.result_var.set("")
            self._draw_balls()

    # ── 제출 ─────────────────────────────────────────────────────────────────

    def _submit(self):
        if self.game_over:
            return
        if len(self.cur_digits) != 4:
            self.result_var.set("❌ 숫자 4개를 모두 입력해 주세요")
            return
        if len(set(self.cur_digits)) != 4:
            self.result_var.set("❌ 중복된 숫자가 있습니다")
            return

        guess = self.cur_digits[:]
        self.attempts += 1
        self.attempt_var.set(f"{self.attempts}번 시도")

        strikes, balls = check_guess(self.secret, guess)
        gs = "".join(map(str, guess))

        if strikes == 4:
            res_str = "홈런! 🎉"
            self.result_var.set(f"🎊  정답!  {self.attempts}번 만에 성공했습니다!")
            self.game_over = True
        elif strikes == 0 and balls == 0:
            res_str = "아웃 💨"
            self.result_var.set("💨  아웃!  해당하는 숫자가 없습니다")
        else:
            res_str = f"{strikes}S  {balls}B"
            self.result_var.set(
                f"⚾   {strikes} 스트라이크     {balls} 볼")

        self.hist.insert(tk.END, f"  {self.attempts:>2}회   {gs}   →  {res_str}")
        self.hist.yview_moveto(1.0)

        self.cur_digits = []
        self._draw_balls()
        self.hidden.focus_set()

    # ── 새 게임 ──────────────────────────────────────────────────────────────

    def _new_game(self):
        self.secret     = generate_number()
        self.attempts   = 0
        self.game_over  = False
        self.cur_digits = []
        self.attempt_var.set("0번 시도")
        self.result_var.set("")
        self.hist.delete(0, tk.END)
        self.hist.insert(tk.END, "   회수   입력     결과")
        self.hist.insert(tk.END, "  " + "─" * 28)
        self._draw_balls()
        self.hidden.focus_set()

# ── 실행 ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app = BaseballGame()
    app.mainloop()
