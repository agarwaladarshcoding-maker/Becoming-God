# 001-stateless-llm-call

A small agentic build that shows how a raw LLM chat-completions call works when the application, not the model, owns the conversation state.

The main idea is simple: the model does not remember earlier turns unless the caller sends that history again. Any "memory" you see in this build is created by the harness.

## Files

- `client.py` - a thin wrapper around the Groq chat-completions API. It sends one request, returns the assistant reply, and exposes token usage.
- `token_budget.py` - a `Conversation` helper that keeps a local transcript and tracks prompt and completion tokens per turn.
- `break_test.py` - a comparison script that runs the same 8-turn conversation under three history policies:
  - full history
  - no history
  - user turns only

## Takeaway

Stateless calls are the default. If you want conversational memory, you have to store the messages yourself and resend the context you care about.
