import requests


GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"
BLUE = "\033[93m"

numSuccess = 0
numTests = 0


def test_about_json_success(numSuccess, numTests):
    try:
        res = requests.get("https://backend.nduboi.fr/about.json")
        assert res.status_code == 200
        data = res.json()
        assert "client" in data and "server" in data
        assert "host" in data["client"]
        assert "current_time" in data["server"]
        assert "services" in data["server"]
        print(f"Test about_json_success: {GREEN} OK{RESET}")
        numSuccess += 1
    except Exception as e:
        print(f"Test about_json_success: {RED} FAILED{RESET}")
        print("Response JSON:", res.json() if 'res' in locals() else str(e))
    return numSuccess, numTests + 1

def test_about_json_lang_param(numSuccess, numTests):
    try:
        res = requests.get("https://backend.nduboi.fr/about.json?lang=fr")
        assert res.status_code == 200
        data = res.json()
        assert "client" in data and "server" in data
        print(f"Test about_json_lang_param: {GREEN} OK{RESET}")
        numSuccess += 1
    except Exception as e:
        print(f"Test about_json_lang_param: {RED} FAILED{RESET}")
        print("Response JSON:", res.json() if 'res' in locals() else str(e))
    return numSuccess, numTests + 1

def test_about_json_invalid_url(numSuccess, numTests):
    try:
        res = requests.get("https://backend.nduboi.fr/about.jso")
        assert res.status_code == 404 or res.status_code == 500
        print(f"Test about_json_invalid_url: {GREEN} OK{RESET}")
        numSuccess += 1
    except Exception as e:
        print(f"Test about_json_invalid_url: {RED} FAILED{RESET}")
        print("Response JSON:", res.json() if 'res' in locals() else str(e))
    return numSuccess, numTests + 1

def run_test_about_suite():
    numSuccess = 0
    numTests = 0
    numSuccess, numTests = test_about_json_success(numSuccess, numTests)
    numSuccess, numTests = test_about_json_lang_param(numSuccess, numTests)
    numSuccess, numTests = test_about_json_invalid_url(numSuccess, numTests)
    print(f"\nAbout Test Summary: {GREEN}{numSuccess}{RESET}/{BLUE}{numTests}{RESET} tests passed.")
