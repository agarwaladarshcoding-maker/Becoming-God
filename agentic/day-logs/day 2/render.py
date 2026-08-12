messages_1 = [
    {"role": "system", "content": "You are a helpful AI."},
    {"role": "user", "content": "Hello."}
]

def render_messages(messages):
    rendered_message = "<|begin_of_text|>"
    for item in messages:
        if isinstance(item, dict):
            role = item.get("role", "")
            content = item.get("content", "")
        else:
            try:
                role, content = item
            except Exception:
                role = ""
                content = str(item)
                
        # FIX 1 & 2: Removed spaces around {role} and {content}
        temp = f"<|start_header_id|>{role}<|end_header_id|>\n\n{content}<|eot_id|>"
        rendered_message += temp
        
    # FIX 3: Removed the leading \n before the assistant token
    rendered_message += "<|start_header_id|>assistant<|end_header_id|>\n\n"
    
    return rendered_message

print(render_messages(messages_1))