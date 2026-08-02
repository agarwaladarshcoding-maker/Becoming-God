from tool import tool
import urllib
import os
import re
import json
@tool
def read_file(filepath: str) -> str:
    """
    Reads and returns the contents of a local file. Useful for extracting text from text files.
    """
    if not os.path.exists(filepath):
        return f"Error: File '{filepath}' does not exist."
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {str(e)}"

@tool
def write_file(filepath: str, content: str) -> str:
    """
    Writes text content to a local file. Overwrites the file if it already exists.
    """
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"Success: Content successfully written to '{filepath}'."
    except Exception as e:
        return f"Error writing file: {str(e)}"

@tool
def calculator(a: float, b: float, operator: str) -> float:
    """
    Performs basic mathematical calculations. Allowed operators are '+', '-', '*', and '/'.
    """
    if operator == '+':
        return a + b
    elif operator == '-':
        return a - b
    elif operator == '*':
        return a * b
    elif operator == '/':
        if b == 0:
            raise ValueError("Division by zero is not allowed.")
        return a / b
    else:
        raise ValueError(f"Unsupported operator: {operator}")

@tool
def web_search(query: str) -> str:
    """
    Searches the web for up-to-date factual information. Returns a summary of the top result.
    """
    # Uses Wikipedia API as a robust, built-in library compatible search for LLM usage
    try:
        safe_query = urllib.parse.quote(query)
        url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={safe_query}&utf8=&format=json"
        
        req = urllib.request.Request(url, headers={'User-Agent': 'LLM-Agent/1.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            results = data.get('query', {}).get('search', [])
            
            if results:
                top_result = results[0]
                title = top_result['title']
                # Clean HTML tags from the snippet 
                snippet = re.sub(r'<[^>]+>', '', top_result['snippet'])
                return f"Top Result: {title}\nSummary: {snippet}..."
            
            return "No results found for the given query."
    except Exception as e:
        return f"Web search failed: {str(e)}"