import requests

GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"
BLUE = "\033[93m"

numSuccess = 0
numTests = 2

def test_health_check(numSuccess):
    try:
        res = requests.get("https://backend.nduboi.fr/api/info/health")
        assert res.status_code == 200
        assert res.json() == {'status': 'OK'}
        print(f"Test health_check: {GREEN} OK{RESET}")
        numSuccess += 1
    except AssertionError:
        print(f"Test health_check: {RED} FAILED{RESET}")
        print("Response JSON:", res.json())
    return numSuccess

def test_health_db_check(numSuccess):
    try:
        res = requests.get("https://backend.nduboi.fr/api/info/health-db")
        assert res.status_code == 200
        assert res.json() == {'database': 'OK'}
        print(f"Test health_db_check: {GREEN} OK{RESET}")
        numSuccess += 1
    except AssertionError:
        print(f"Test health_db_check: {RED} FAILED{RESET}")
        print("Response JSON:", res.json())
    return numSuccess

def run_health_test_suite():
    numSuccess = 0
    numSuccess = test_health_check(numSuccess)
    numSuccess = test_health_db_check(numSuccess)
    print(f"\nHealth Test Summary:  {GREEN}{numSuccess}{RESET}/{BLUE}{numTests}{RESET} tests passed.")
