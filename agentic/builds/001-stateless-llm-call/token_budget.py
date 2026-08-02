from client import call
class Conversation:
    def __init__(self, system=None):
        self.messages = []   # the ONLY memory in this system
        self.system = system
        self.turns = []      # (turn_no, prompt_tokens, completion_tokens)

    def say(self, text):
        # 1. append {"role": "user", "content": text} to self.messages
        self.messages.append({"role": "user", "content": text})
        # 2. call(self.messages, system=self.system)  <- the WHOLE list, every time
        call_result = call(self.messages, system=self.system)
        # 3. append {"role": "assistant", "content": result["response"]}
        self.messages.append({"role": "assistant", "content": call_result["text"]})
        # 4. record (len(self.turns)+1, prompt_tokens, completion_tokens)
        self.turns.append((len(self.turns)+1, call_result["input_tokens"], call_result["output_tokens"]))
        # 5. return the reply text
        return call_result["text"]

    def table(self):
        # turn | prompt_tokens | completion_tokens | cumulative | % of free-tier TPM
        cumulative = 0
        for turn_no, prompt_tokens, completion_tokens in self.turns:
            cumulative += prompt_tokens + completion_tokens
            print(f"{turn_no:4d} | {prompt_tokens:13d} | {completion_tokens:17d} | {cumulative:10d} | {cumulative/1000000:.3%}")
