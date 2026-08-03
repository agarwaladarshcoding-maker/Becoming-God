import requests
import csv
import sys

def fetch_solved_problems(handle):
    """Fetches all uniquely solved problems for a given Codeforces handle."""
    print(f"Fetching data from Codeforces for user: {handle}...")
    url = f"https://codeforces.com/api/user.status?handle={handle}"
    
    try:
        response = requests.get(url)
        response.raise_for_status() # Raise an exception for bad status codes
        data = response.json()
    except requests.exceptions.RequestException as e:
        print(f"Network or API Error: {e}")
        return []

    if data.get('status') != 'OK':
        print(f"API Error: {data.get('comment', 'Unknown error')}")
        return []

    submissions = data['result']
    solved_problems = {}

    for sub in submissions:
        # We only care about accepted solutions
        if sub.get('verdict') == 'OK':
            problem = sub['problem']
            
            # Create a unique ID using contestId and index (e.g., "1500A")
            contest_id = problem.get('contestId')
            index = problem.get('index')
            
            # Skip problems without a contest ID (like gym problems) if you only want standard track
            if not contest_id:
                continue 
                
            prob_id = f"{contest_id}{index}"
            
            # Add to dictionary if not already present to avoid duplicates
            if prob_id not in solved_problems:
                solved_problems[prob_id] = {
                    'ID': prob_id,
                    'Name': problem.get('name', 'Unknown'),
                    'Tags': ", ".join(problem.get('tags', [])),
                    'Link': f"https://codeforces.com/contest/{contest_id}/problem/{index}"
                }

    return list(solved_problems.values())

def export_to_csv(problems, handle):
    """Exports the parsed data to a CSV file."""
    if not problems:
        print("No solved problems found or an error occurred.")
        return

    filename = f"{handle}_solved_problems.csv"
    headers = ['ID', 'Name', 'Tags', 'Link']

    try:
        with open(filename, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=headers)
            writer.writeheader()
            writer.writerows(problems)
        print(f"Successfully saved {len(problems)} unique solved problems to {filename}.")
    except Exception as e:
        print(f"Error writing to file: {e}")

if __name__ == "__main__":
    # You can hardcode your handle here or pass it via terminal argument
    if len(sys.argv) > 1:
        target_handle = sys.argv[1]
    else:
        target_handle = input("Enter Codeforces User ID (Handle): ").strip()
    
    if target_handle:
        solved_data = fetch_solved_problems(target_handle)
        export_to_csv(solved_data, target_handle)
    else:
        print("Invalid handle provided.")