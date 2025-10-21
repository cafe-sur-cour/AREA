import requests

GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"
BLUE = "\033[93m"

# Helper to login and get token (for protected routes)
def get_auth_token(email, password):
    res = requests.post("https://backend.nduboi.fr/api/auth/login", json={"email": email, "password": password})
    if res.status_code == 200:
        return res.json().get("token"), res.cookies.get("auth_token")
    return None, None

def test_get_me_success(numSuccess, numTests):
    try:
        token, _ = get_auth_token("alice@example.com", "123456")
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        res = requests.get("https://backend.nduboi.fr/api/user/me", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "email" in data and "name" in data
        print(f"Test get_me_success: {GREEN} OK{RESET}")
        numSuccess += 1
    except Exception as e:
        print(f"Test get_me_success: {RED} FAILED{RESET}")
        print("Response JSON:", res.json() if 'res' in locals() else str(e))
    return numSuccess, numTests + 1

def test_get_me_unauth(numSuccess, numTests):
    try:
        res = requests.get("https://backend.nduboi.fr/api/user/me")
        assert res.status_code == 401 or res.status_code == 403
        print(f"Test get_me_unauth: {GREEN} OK{RESET}")
        numSuccess += 1
    except Exception as e:
        print(f"Test get_me_unauth: {RED} FAILED{RESET}")
        print("Response JSON:", res.json() if 'res' in locals() else str(e))
    return numSuccess, numTests + 1

def test_update_me_success(numSuccess, numTests):
    try:
        token, _ = get_auth_token("alice@example.com", "123456")
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        payload = {"name": "Alice Updated", "bio": "Updated bio"}
        res = requests.put("https://backend.nduboi.fr/api/user/me", headers=headers, json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data.get("name") == "Alice Updated"
        print(f"Test update_me_success: {GREEN} OK{RESET}")
        numSuccess += 1
    except Exception as e:
        print(f"Test update_me_success: {RED} FAILED{RESET}")
        print("Response JSON:", res.json() if 'res' in locals() else str(e))
    return numSuccess, numTests + 1

def test_update_me_fail(numSuccess, numTests):
    try:
        token, _ = get_auth_token("alice@example.com", "123456")
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        payload = {}  # No fields
        res = requests.put("https://backend.nduboi.fr/api/user/me", headers=headers, json=payload)
        assert res.status_code == 400
        print(f"Test update_me_fail: {GREEN} OK{RESET}")
        numSuccess += 1
    except Exception as e:
        print(f"Test update_me_fail: {RED} FAILED{RESET}")
        print("Response JSON:", res.json() if 'res' in locals() else str(e))
    return numSuccess, numTests + 1

def test_get_all_users_admin(numSuccess, numTests):
    try:
        token, _ = get_auth_token("alice@example.com", "123456")
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        res = requests.get("https://backend.nduboi.fr/api/user", headers=headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)
        print(f"Test get_all_users_admin: {GREEN} OK{RESET}")
        numSuccess += 1
    except Exception as e:
        print(f"Test get_all_users_admin: {RED} FAILED{RESET}")
        print("Response JSON:", res.json() if 'res' in locals() else str(e))
    return numSuccess, numTests + 1

def test_get_user_by_id(numSuccess, numTests):
    try:
        token, _ = get_auth_token("alice@example.com", "123456")
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        # Get own user by id (should work for admin)
        res = requests.get("https://backend.nduboi.fr/api/user/1", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "email" in data
        print(f"Test get_user_by_id: {GREEN} OK{RESET}")
        numSuccess += 1
    except Exception as e:
        print(f"Test get_user_by_id: {RED} FAILED{RESET}")
        print("Response JSON:", res.json() if 'res' in locals() else str(e))
    return numSuccess, numTests + 1

def test_get_user_by_id_forbidden(numSuccess, numTests):
    try:
        # Register a new user (not admin)
        payload = {"email": "bob@example.com", "name": "Bob", "password": "Password123"}
        requests.post("https://backend.nduboi.fr/api/auth/register", json=payload)
        token, _ = get_auth_token("bob@example.com", "Password123")
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        # Try to get alice's user by id (should be forbidden)
        res = requests.get("https://backend.nduboi.fr/api/user/1", headers=headers)
        assert res.status_code == 403
        print(f"Test get_user_by_id_forbidden: {GREEN} OK{RESET}")
        numSuccess += 1
    except Exception as e:
        print(f"Test get_user_by_id_forbidden: {RED} FAILED{RESET}")
        print("Response JSON:", res.json() if 'res' in locals() else str(e))
    return numSuccess, numTests + 1

def run_test_user_suite():
    numSuccess = 0
    numTests = 0
    numSuccess, numTests = test_get_me_success(numSuccess, numTests)
    numSuccess, numTests = test_get_me_unauth(numSuccess, numTests)
    numSuccess, numTests = test_update_me_success(numSuccess, numTests)
    numSuccess, numTests = test_update_me_fail(numSuccess, numTests)
    numSuccess, numTests = test_get_all_users_admin(numSuccess, numTests)
    numSuccess, numTests = test_get_user_by_id(numSuccess, numTests)
    numSuccess, numTests = test_get_user_by_id_forbidden(numSuccess, numTests)
    print(f"\nUser Test Summary: {GREEN}{numSuccess}{RESET}/{BLUE}{numTests}{RESET} tests passed.")
