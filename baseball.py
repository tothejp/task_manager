import random

def generate_number():
    digits = random.sample(range(10), 4)
    if digits[0] == 0:
        digits[0], digits[1] = digits[1], digits[0]
    return digits

def check_guess(secret, guess):
    strikes = sum(s == g for s, g in zip(secret, guess))
    balls = sum(g in secret for g in guess) - strikes
    return strikes, balls

def parse_input(text):
    text = text.strip()
    if len(text) != 4 or not text.isdigit():
        return None
    digits = [int(c) for c in text]
    if len(set(digits)) != 4:
        return None
    return digits

def main():
    print("=" * 40)
    print("     숫자 야구 게임 (4자리)")
    print("=" * 40)
    print("규칙: 중복 없는 4자리 숫자를 맞춰보세요!")
    print("  스트라이크 = 숫자와 위치 모두 정확")
    print("  볼         = 숫자는 맞지만 위치 틀림")
    print("  아웃       = 해당하는 숫자 없음")
    print("  (힌트 보기: 'hint' 입력, 종료: 'quit')")
    print("=" * 40)

    secret = generate_number()
    attempts = 0
    hint_used = False

    while True:
        user_input = input(f"\n[{attempts + 1}번째 시도] 숫자 입력: ").strip().lower()

        if user_input == "quit":
            print(f"\n게임 종료! 정답은 {''.join(map(str, secret))} 였습니다.")
            break

        if user_input == "hint":
            if not hint_used:
                hint_used = True
                pos = random.randint(0, 3)
                print(f"  힌트: {pos + 1}번째 자리 숫자는 {secret[pos]} 입니다.")
            else:
                print("  힌트는 한 번만 사용할 수 있습니다.")
            continue

        guess = parse_input(user_input)
        if guess is None:
            print("  올바르지 않은 입력입니다. 중복 없는 4자리 숫자를 입력하세요.")
            continue

        attempts += 1
        strikes, balls = check_guess(secret, guess)

        if strikes == 0 and balls == 0:
            print(f"  결과: 아웃! (해당하는 숫자가 없습니다)")
        else:
            print(f"  결과: {strikes} 스트라이크, {balls} 볼")

        if strikes == 4:
            print(f"\n정답입니다! {''.join(map(str, secret))} — {attempts}번 만에 성공했습니다!")
            if hint_used:
                print("(힌트 사용함)")
            break

if __name__ == "__main__":
    main()
