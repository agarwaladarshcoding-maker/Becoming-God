import sys
import os
from pathlib import Path
from groq import Groq

# Import tools from your tools setup
from utils import read_file, write_file

def load_env_file() -> None:
    """
    Loads simple KEY=VALUE pairs from the nearest .env file without requiring
    an extra dependency.
    """
    search_dirs = [Path.cwd(), *Path(__file__).resolve().parents]

    for directory in search_dirs:
        env_path = directory / ".env"
        if not env_path.exists():
            continue

        with env_path.open("r", encoding="utf-8") as env_file:
            for raw_line in env_file:
                line = raw_line.strip()

                if not line or line.startswith("#") or "=" not in line:
                    continue

                if line.startswith("export "):
                    line = line[len("export "):].strip()

                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")

                if key:
                    os.environ.setdefault(key, value)

        return

def run_documentation_agent(target_file: str):
    """
    Runs the LLM agent to document the specific file passed from VS Code.
    """
    target_path = Path(target_file).resolve()

    if not target_path.exists():
        print(f"Error: Target file '{target_file}' does not exist.")
        sys.exit(1)

    output_doc_path = target_path.with_name(f"DOCS_{target_path.stem}.md")

    load_env_file()
    api_key = os.environ.get("GROQ_API_KEY")

    if not api_key:
        print("Error: GROQ_API_KEY is missing. Add it to AI-ML/.env and try again.")
        sys.exit(1)

    model = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
    client = Groq(api_key=api_key)

    file_content = read_file.run(filepath=str(target_path))

    if str(file_content).startswith("Error:"):
        print(file_content)
        sys.exit(1)

    messages = [
        {
            "role": "system",
            "content": (
                "You are an automated code documentation agent. "
                "Return only the complete Markdown documentation that should be written to disk."
            )
        },
        {
            "role": "user",
            "content": (
                f"Create detailed Markdown documentation for this file.\n\n"
                f"File path: {target_path}\n"
                f"File extension: {target_path.suffix or '(none)'}\n\n"
                "Include:\n"
                "- Purpose and high-level overview\n"
                "- Important functions/classes/cells and their behavior\n"
                "- Inputs, outputs, and side effects\n"
                "- Notable implementation details\n"
                "- Suggested improvements or caveats if relevant\n\n"
                "File contents:\n"
                "```text\n"
                f"{file_content}\n"
                "```"
            )
        }
    ]

    print(f"🚀 Documenting active file: {target_path}")
    print(f"🤖 Using Groq model: {model}")
    print(f"📝 Output file: {output_doc_path}")

    response = client.chat.completions.create(
        model=model,
        messages=messages
    )

    documentation = response.choices[0].message.content or ""

    if not documentation.strip():
        print("Error: The model returned empty documentation.")
        sys.exit(1)

    write_result = write_file.run(filepath=str(output_doc_path), content=documentation)

    if not str(write_result).startswith("Success:"):
        print(write_result)
        sys.exit(1)

    if not output_doc_path.exists() or output_doc_path.stat().st_size == 0:
        print(f"Error: Documentation file was not created: {output_doc_path}")
        sys.exit(1)

    print("\n✅ Documentation Complete!")
    print(f"Documentation written to: {output_doc_path}")

if __name__ == "__main__":
    # Ensure a file path was passed from VS Code
    if len(sys.argv) < 2:
        print("Usage: python interface.py <path_to_file>")
        sys.exit(1)

    active_file = sys.argv[1]
    run_documentation_agent(active_file)
