import os
import json
from groq import Groq

# Import the tools directly from your existing tool.py file
# (This assumes tool.py contains the @tool framework and the 4 implemented tools)
from tool import read_file, write_file, calculator, web_search

def main():
    # 1. Initialize the Groq Client
    # It automatically picks up the GROQ_API_KEY from your environment variables
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    
    # 2. Map tool names to their instances for easy execution
    tools_map = {
        "read_file": read_file,
        "write_file": write_file,
        "calculator": calculator,
        "web_search": web_search
    }

    # 3. Format schemas for Groq API
    # Groq requires a specific nested JSON structure for tools.
    groq_tools = []
    for name, t in tools_map.items():
        # Load the auto-generated JSON string from your decorator
        schema = json.loads(t.fn_signature)
        
        # Groq strictly requires "type": "object" inside the parameters dict 
        if "type" not in schema["parameters"]:
            schema["parameters"]["type"] = "object"
            
        groq_tools.append({
            "type": "function",
            "function": schema
        })

    # 4. Set up the initial instructions
    messages = [
        {
            "role": "system",
            "content": (
                "You are an autonomous documentation agent. "
                "You have access to tools to read files, write files, search the web, and calculate math. "
                "Always use tools if needed to answer the query."
            )
        },
        {
            "role": "user",
            "content": (
                "Please perform the following steps in order:\n"
                "1. Read the contents of 'tool.py'.\n"
                "2. Do a web search for 'Python PEP 257 docstring conventions summary' to get documentation tips.\n"
                "3. Use the calculator to multiply 12 by 4 (just to verify the tool works).\n"
                "4. Using the file contents and the web search context, write comprehensive Markdown documentation "
                "for the entire 'tool.py' file and save it as 'tool_documentation.md'.\n"
                "Let me know once you have finished writing the file!"
            )
        }
    ]

    print("Starting LLM Agent Loop...\n")

    # 5. The Agentic Loop (Local Orchestration)
    while True:
        # Call the model with the current conversation history and tools
        response = client.chat.completions.create(
            model="llama3-70b-8192", # Recommended model for tool calling
            messages=messages,
            tools=groq_tools,
            tool_choice="auto"
        )
        
        response_message = response.choices[0].message
        
        # Append the assistant's message to the conversation history
        messages.append(response_message)
        
        # Check if the model decided to call any tools
        if not response_message.tool_calls:
            # If no tools were called, the model is providing its final response
            print("\nFinal Response from LLM:\n")
            print(response_message.content)
            break
            
        # Execute each tool call requested by the LLM
        for tool_call in response_message.tool_calls:
            tool_name = tool_call.function.name
            
            # Parse the JSON string of arguments provided by the LLM
            try:
                tool_args = json.loads(tool_call.function.arguments)
            except json.JSONDecodeError:
                tool_args = {}
                
            print(f"LLM called tool: '{tool_name}' with arguments: {tool_args}")
            
            # Run the actual Python function locally
            if tool_name in tools_map:
                try:
                    # Execute the `.run()` method from your Tool class
                    result = tools_map[tool_name].run(**tool_args)
                except Exception as e:
                    result = f"Error executing tool: {str(e)}"
            else:
                result = f"Error: Tool '{tool_name}' is not recognized."
                
            # Append the tool's output back into the conversation history
            # The tool_call_id MUST match the ID from the assistant's request
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": tool_name,
                "content": str(result)
            })

if __name__ == "__main__":
    # Ensure you have set your GROQ_API_KEY environment variable before running
    if not os.environ.get("GROQ_API_KEY"):
        print("Error: Please set the GROQ_API_KEY environment variable.")
    else:
        main()