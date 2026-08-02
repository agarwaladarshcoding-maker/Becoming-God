from openai import OpenAI
import os

class ReflectionPattern:
    def __init__(self, query, max_steps=10000):
        self.query = query
        self.max_steps = max_steps
        self.reflect_todo = ""
        self.current_output = ""

    def _create_client(self):
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError("Set GROQ_API_KEY in the environment.")
        return OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")

    def generate(self):
        client = self._create_client()
        prompt = self.query
        if self.current_output:
            prompt += "\n\nPrevious output:\n" + self.current_output
        if self.reflect_todo:
            prompt += "\n\nReflection todo:\n" + self.reflect_todo

        response = client.responses.create(
            model="openai/gpt-oss-20b",
            input=prompt,
        )
        return response.output_text

    def reflect(self):
        client = self._create_client()
        prompt = (
            "I want you to act as a critique and check the essay below. "
            "If it is good enough, reply with STOP exactly. "
            "Otherwise, create a todo list of how to improve it.\n\n"
            + self.current_output
        )

        response = client.responses.create(
            model="openai/gpt-oss-20b",
            input=prompt,
        )
        return response.output_text.strip()

    def loop(self):
        current_steps = 0
        while current_steps < self.max_steps:
            self.current_output = self.generate()
            self.reflect_todo = self.reflect()
            current_steps += 1
            print("working", current_steps)

            if self.reflect_todo.strip().upper() == "STOP":
                break

        print(self.current_output)
      


if __name__ == "__main__":
    query = input("Enter your query: ")
    rfp = ReflectionPattern(query,2)
    rfp.loop()

