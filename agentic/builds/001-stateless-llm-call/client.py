"""
client.py - the raw LLM call. No SDK, no framework.

One function: call(). It is a pure function.
Same messages in -> same shape out. It remembers nothing between calls.
"""

import os
import requests

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
API_KEY = os.environ.get("GROQ_API_KEY")

if not API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY not found. Put it in a .env file next to this script:\n"
        "GROQ_API_KEY=gsk_..."
    )


def call(
    messages,
    system=None,
    model="llama-3.3-70b-versatile",
    max_tokens=512,
    temperature=0.0,
):
    """
    Send one chat completion request to Groq.

    messages : list of {"role": "user"|"assistant", "content": str}
    system   : optional str. Prepended as a role:"system" message.
    returns  : {"text", "input_tokens", "output_tokens", "finish_reason"}
    """
    # Build a NEW list. Never mutate the caller's messages.
    payload_messages = messages
    if system:
        payload_messages = [{"role": "system", "content": system}] + messages

    payload = {
        "model": model,
        "messages": payload_messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    response = requests.post(GROQ_URL, headers=headers, json=payload, timeout=60)

    if response.status_code != 200:
        raise RuntimeError(f"Groq {response.status_code}: {response.text}")

    data = response.json()

    return {
        "text": data["choices"][0]["message"]["content"],
        "input_tokens": data["usage"]["prompt_tokens"],
        "output_tokens": data["usage"]["completion_tokens"],
        "finish_reason": data["choices"][0]["finish_reason"],
    }


if __name__ == "__main__":
    # Smoke test 1 - does it work at all?
    r = call([{"role": "user", "content": "Say exactly: hello"}])
    print("TEXT     :", r["text"])
    print("IN / OUT :", r["input_tokens"], "/", r["output_tokens"])
    print("FINISH   :", r["finish_reason"])

    # Smoke test 2 - proof it is stateless.
    # Tell it a fact, then ask for it back with NO history. It cannot know.
    call([{"role": "user", "content": "My favourite number is 41."}])
    r2 = call([{"role": "user", "content": "What is my favourite number?"}])
    print("\nSTATELESS PROOF:", r2["text"])