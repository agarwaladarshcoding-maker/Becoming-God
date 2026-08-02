"""
break_test.py - the same 8 turns, three history policies.

A: full history      (user + assistant, everything resent)
B: no history        (only the latest user message)
C: user turns only   (assistant replies stripped out)

The model is identical in all three. Only what YOU resend changes.
Whatever "memory" the system appears to have is made entirely out of mode A.
"""

from client import call

FACT = "My project is called Becoming-God. It runs on Postgres."
NEEDLE = "postgres"
PROBE_TURN = 6

TURNS = [
    FACT,                                                    # 1 - plant
    "I'm working on it most evenings this month.",           # 2
    "The hardest part so far has been staying consistent.",  # 3
    "I try to finish one small piece each session.",         # 4
    "Tomorrow I want to write up what I learned.",           # 5
    "What database does my project use?",                    # 6 - probe
    "Thanks. Anything I should watch out for there?",        # 7
    "Good. I'll note that down.",                            # 8
]


def build_payload(mode, history, user_text):
    """Return the message list actually sent on this turn."""
    turn = [{"role": "user", "content": user_text}]

    if mode == "A":
        return history + turn
    if mode == "B":
        return turn
    if mode == "C":
        users_only = [m for m in history if m["role"] == "user"]
        return users_only + turn

    raise ValueError(f"unknown mode: {mode}")


def run_mode(mode):
    history = []   # full transcript, always kept locally, in every mode
    rows = []

    print("\n" + "=" * 70)
    print(f"MODE {mode}")
    print("=" * 70)

    for turn_no, user_text in enumerate(TURNS, start=1):
        payload = build_payload(mode, history, user_text)
        result = call(payload)
        reply = result["text"].strip()

        # Record in full regardless of mode. The mode only gates what is SENT.
        history.append({"role": "user", "content": user_text})
        history.append({"role": "assistant", "content": reply})

        rows.append({
            "turn": turn_no,
            "msgs_sent": len(payload),
            "input_tokens": result["input_tokens"],
            "output_tokens": result["output_tokens"],
            "reply": reply,
        })

        print(f"\n--- turn {turn_no} | msgs sent: {len(payload):>2}"
              f" | input_tokens: {result['input_tokens']:>5}")
        print(f"USER: {user_text}")
        print(f"ASST: {reply[:300]}")

    return rows


def verdict(mode, rows):
    probe = rows[PROBE_TURN - 1]
    recalled = NEEDLE in probe["reply"].lower()

    print(f"\n>>> MODE {mode} - turn {PROBE_TURN} probe: "
          f"{'RECALLED' if recalled else 'LOST'} the needle")

    return {
        "mode": mode,
        "recalled": recalled,
        "probe_reply": probe["reply"],
        "input_tokens_t1": rows[0]["input_tokens"],
        "input_tokens_t8": rows[-1]["input_tokens"],
    }


if __name__ == "__main__":
    summary = []
    for mode in ("A", "B", "C"):
        summary.append(verdict(mode, run_mode(mode)))

    print("\n" + "=" * 70)
    print("TABLE 2 - BREAK TEST")
    print("=" * 70)
    header = f"{'mode':<6}{'needle @ t6':<14}{'in_tok t1':<12}{'in_tok t8':<12}"
    print(header)
    print("-" * len(header))
    for s in summary:
        print(f"{s['mode']:<6}"
              f"{('RECALLED' if s['recalled'] else 'LOST'):<14}"
              f"{s['input_tokens_t1']:<12}"
              f"{s['input_tokens_t8']:<12}")

    print("\nProbe replies - classify the failure style by hand:")
    for s in summary:
        print(f"\n[{s['mode']}] {s['probe_reply'][:400]}")