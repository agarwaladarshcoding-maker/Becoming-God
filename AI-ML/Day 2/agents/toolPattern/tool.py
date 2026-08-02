import json
from typing import Callable

PYTHON_TO_JSON_SCHEMA_TYPES = {
    str: "string",
    int: "integer",
    float: "number",
    bool: "boolean",
    list: "array",
    dict: "object",
}

def get_fn_signature(fn:Callable) -> dict:
    '''
    Generates the signature for a given function

    Args:
        fn(Callable) : The function whose signature need to be extracted
    
    Returns:
        dict: A dictinoary containing thr fnuction's name, description  and parameters type
    '''
    fn_signature : dict = {
        "name" : fn.__name__,
        "description" : fn.__doc__,
        "parameters" :{"properties" : {}}
    }
    schema = {}
    required = []

    for arg_name, arg_type in fn.__annotations__.items():
        if arg_name == "return":
            continue

        schema[arg_name] = {
            "type": PYTHON_TO_JSON_SCHEMA_TYPES.get(arg_type, "string")
        }
        required.append(arg_name)

    fn_signature["parameters"]["properties"] = schema
    fn_signature["parameters"]["required"] = required
    return fn_signature

def validate_arguments(tool_call:dict, tool_signature:dict) -> dict:
    '''
    Validates and converts arguments in the input dictionary to match the expected types of the funnction 

    Args:
        tool_call (dict): A dinctionary containing the arguments passed to the tool>
        tool_signature (dict): The expected function signature and parameter types.
    
    Returns:
        dict: the tool call dictionary with the arugments converted to the coreewct types

    '''

    properties = tool_signature["parameters"]["properties"]

    type_maaping ={
        "integer": int,
        "string": str,
        "boolean": bool,
        "number": float,
    }
    for arg_name, arg_value in tool_call["arguments"].items():
        expected_type = properties[arg_name].get("type")
        if not isinstance(arg_value, type_maaping[expected_type]):
            tool_call["arguments"][arg_name] = type_maaping[expected_type](arg_value)
    return tool_call

class Tool:
    '''
    A class represeting a tool that wrpas a callable and its signature

    Attributes:
        name (str): The name of the tool(function).
        fn(Callable) : The functiuo that the tool represents
        fn_signature(str): JSON string representation of the function's signature

    '''

    def __init__(self, name:str, fn:Callable, fn_signature: str):
        self.name = name
        self.fn = fn
        self.fn_signature = fn_signature

    def __str__(self):
        return self.fn_signature

    def run(self, **kwargs):
        """
        Executes the tool (function) with provided arguments

        Args:
            **kwargs: Keyword arguments passed to the function
        
        Returns:
            The result of the function call
        """
        return self.fn(**kwargs)


def tool(fn: Callable):
    """
    A decorator that wraps a function into a Tool object.

    Args:
        fn (Callable): The function to be wrapped.

    Returns:
        Tool: A Tool object containing the function, its name, and its signature.
    """

    def wrapper():
        fn_signature = get_fn_signature(fn)
        return Tool(
            name=fn_signature.get("name"), fn=fn, fn_signature=json.dumps(fn_signature)
        )

    return wrapper()
