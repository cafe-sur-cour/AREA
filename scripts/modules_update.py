#!/usr/bin/env python3
import os
import requests
import re
from dotenv import load_dotenv

load_dotenv()

REPO_OWNER = "cafe-sur-cour"
REPO_NAME = "AREA"
REPO = f"{REPO_OWNER}/{REPO_NAME}"

ISSUES_URL = f"https://api.github.com/repos/{REPO}/issues"

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
if not GITHUB_TOKEN:
    raise ValueError("GITHUB_TOKEN environment variable not set")

HEADERS = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

def fetch_issues():
    print("Fetching all issues from GitHub repository...")
    all_issues = []
    issues_dict = {}
    page = 1
    per_page = 100
    while True:
        params = {'state': 'all', 'page': page, 'per_page': per_page}
        response = requests.get(ISSUES_URL, headers=HEADERS, params=params)
        if response.status_code != 200:
            print(f"Error: Failed to fetch issues on page {page}. Status code: {response.status_code}")
            break
        issues = response.json()
        if not issues:
            break
        all_issues.extend(issues)
        for issue in issues:
            issues_dict[issue['number']] = issue
        page += 1
    print(f"Total issues fetched: {len(all_issues)}")
    return all_issues, issues_dict

def filter_module_issues(issues):
    print("Filtering issues with '[MODULE]' in title...")
    module_issues = [issue for issue in issues if "[MODULE]" in issue.get("title", "")]
    print(f"Found {len(module_issues)} issues with '[MODULE]' in title.")
    return module_issues

def parse_sub_issues(body):
    """Extract sub-issue numbers from the body."""
    pattern = r'- \[.\] #(\d+)'
    matches = re.findall(pattern, body)
    return [int(num) for num in matches]

def update_checkboxes(body, issues_dict):
    """Update checkboxes in Related Sub-Issues based on issue status."""
    lines = body.split('\n')
    updated_lines = []
    in_related_section = False
    for line in lines:
        if line.strip().startswith('## Related Sub-Issues'):
            in_related_section = True
        elif line.strip().startswith('##') and in_related_section:
            in_related_section = False
        if in_related_section and '- [ ] #' in line:
            match = re.search(r'#(\d+)', line)
            if match:
                num = int(match.group(1))
                if num in issues_dict and issues_dict[num]['state'] == 'closed':
                    line = line.replace('- [ ]', '- [x]')
        updated_lines.append(line)
    return '\n'.join(updated_lines)

def calculate_progress(sub_issue_numbers, issues_dict):
    """Calculate progress based on sub-issue statuses and GitHub relations."""
    total = len(sub_issue_numbers)
    completed = 0
    in_progress = 0
    blocked = 0
    for num in sub_issue_numbers:
        if num not in issues_dict:
            print(f"Warning: Sub-issue #{num} not found.")
            continue
        issue = issues_dict[num]
        state = issue.get('state')
        if state == 'closed':
            completed += 1
        else:
            # Check if blocked by relations: if body references open issues
            body = issue.get('body', '')
            referenced_nums = re.findall(r'#(\d+)', body)
            is_blocked = False
            for ref_num in referenced_nums:
                ref_num = int(ref_num)
                if ref_num in issues_dict and issues_dict[ref_num].get('state') == 'open':
                    is_blocked = True
                    break
            if is_blocked:
                blocked += 1
            else:
                in_progress += 1
    return total, completed, in_progress, blocked

def update_progress_tracking(issue_number, body, total, completed, in_progress, blocked, issues_dict):
    """Update the Progress Tracking section in the body."""
    progress_section = f"""## Progress Tracking

- **Total Sub-Issues**: {total}
- **Completed**: {completed}
- **In Progress**: {in_progress}
- **Blocked**: {blocked}

"""

    old_total = 0
    old_completed = 0
    old_in_progress = 0
    old_blocked = 0
    match = re.search(r'Total Sub-Issues.*?: (\d+)', body)
    if match:
        old_total = int(match.group(1))
    match = re.search(r'Completed.*?: (\d+)', body)
    if match:
        old_completed = int(match.group(1))
    match = re.search(r'In Progress.*?: (\d+)', body)
    if match:
        old_in_progress = int(match.group(1))
    match = re.search(r'Blocked.*?: (\d+)', body)
    if match:
        old_blocked = int(match.group(1))

    if old_total == total and old_completed == completed and old_in_progress == in_progress and old_blocked == blocked:
        return False

    pattern = r'## Progress Tracking.*?(?=##|\Z)'
    if re.search(pattern, body, re.DOTALL):
        new_body = re.sub(pattern, progress_section, body, flags=re.DOTALL)
    else:
        new_body = body + "\n\n" + progress_section

    new_body = update_checkboxes(new_body, issues_dict)

    update_url = f"https://api.github.com/repos/{REPO}/issues/{issue_number}"
    data = {"body": new_body}
    response = requests.patch(update_url, headers=HEADERS, json=data)
    if response.status_code == 200:
        print(f"Updated progress tracking for issue #{issue_number}")
        return True
    else:
        print(f"Error updating issue #{issue_number}: {response.status_code}")
        return False

if __name__ == "__main__":
    issues, issues_dict = fetch_issues()
    module_issues = filter_module_issues(issues)
    for module_issue in module_issues:
        body = module_issue.get('body', '')
        sub_issue_numbers = parse_sub_issues(body)
        if sub_issue_numbers:
            total, completed, in_progress, blocked = calculate_progress(sub_issue_numbers, issues_dict)
            update_progress_tracking(module_issue['number'], body, total, completed, in_progress, blocked, issues_dict)
        else:
            pass
