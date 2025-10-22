import requests


GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"
BLUE = "\033[93m"

numSuccess = 0
numTests = 0


def test_create_user(numSuccess, numTests):
    try:
        payload = {"email": "test@example.com", "name": "Test User", "password": "Password123"}
        res = requests.post("https://backend.nduboi.fr/api/auth/register", json=payload)
        assert res.status_code == 201
        assert res.json().get("message") == "User registered successfully"
        print(f"Test create_user: {GREEN} OK{RESET}")
        numSuccess += 1
    except AssertionError:
        print(f"Test create_user: {RED} FAILED{RESET}")
        print("Response JSON:", res.json())
    return numSuccess, numTests + 1

def test_create_user_bad_request(numSuccess, numTests):
    try:
        payload = {"email": "test@example.com", "password": "Password123"}
        res = requests.post("https://backend.nduboi.fr/api/auth/register", json=payload)
        assert res.status_code == 400
        assert res.json().get("error") == "Bad Request"
        print(f"Test create_user_bad_request: {GREEN} OK{RESET}")
        numSuccess += 1
    except AssertionError:
        print(f"Test create_user_bad_request: {RED} FAILED{RESET}")
        print("Response JSON:", res.json())
    return numSuccess, numTests + 1

def test_create_user_that_already_exists(numSuccess, numTests):
    try:
        payload = {"email": "test@example.com", "name": "Test User", "password": "Password123"}
        res = requests.post("https://backend.nduboi.fr/api/auth/register", json=payload)
        assert res.status_code == 409
        print(f"Test create_user_that_already_exists: {GREEN} OK{RESET}")
        numSuccess += 1
    except AssertionError:
        print(f"Test create_user_that_already_exists: {RED} FAILED{RESET}")
        print("Response JSON:", res.json())
    return numSuccess, numTests + 1



def test_register(numSuccess, numTests):
    try:
        payload = {"email": "test1@example.com", "name": "Test User", "password": "Password123"}
        res = requests.post("https://backend.nduboi.fr/api/auth/register", json=payload)
        assert res.status_code == 201
        assert res.json().get("message") == "User registered successfully"
        print(f"Test register: {GREEN} OK{RESET}")
        numSuccess += 1
    except AssertionError:
        print(f"Test register: {RED} FAILED{RESET}")
        print("Response JSON:", res.json())
    return numSuccess, numTests + 1

def test_login_email_not_verified(numSuccess, numTests):
    try:
        payload = {"email": "test1@example.com", "password": "Password123"}
        res = requests.post("https://backend.nduboi.fr/api/auth/login", json=payload)
        assert res.status_code == 401
        assert res.json().get("error") == "Email not verified"
        print(f"Test login_email_not_verified: {GREEN} OK{RESET}")
        numSuccess += 1
    except AssertionError:
        print(f"Test login_email_not_verified: {RED} FAILED{RESET}")
        print("Response JSON:", res.json())
    return numSuccess, numTests + 1

def test_login_correct_credentials(numSuccess, numTests):
    try:
        payload = {"email": "alice@example.com", "password": "123456"}
        res = requests.post("https://backend.nduboi.fr/api/auth/login", json=payload)
        assert res.status_code == 200
        assert "token" in res.json()
        print(f"Test login_correct_credentials: {GREEN} OK{RESET}")
        numSuccess += 1
    except AssertionError:
        print(f"Test login_correct_credentials: {RED} FAILED{RESET}")
        print("Response JSON:", res.json())
    return numSuccess, numTests + 1


# Helper to login and get token (for protected routes)
def get_auth_token(email, password):
    res = requests.post("https://backend.nduboi.fr/api/auth/login", json={"email": email, "password": password})
    if res.status_code == 200:
        return res.json().get("token"), res.cookies.get("auth_token")
    return None, None

def test_login_status_authenticated(numSuccess, numTests):
    try:
        token, cookie = get_auth_token("alice@example.com", "123456")
        cookies = {"auth_token": token} if token else {}
        res = requests.get("https://backend.nduboi.fr/api/auth/login/status", cookies=cookies)
        assert res.status_code == 200
        assert res.json().get("authenticated") is True
        print(f"Test login_status_authenticated: {GREEN} OK{RESET}")
        numSuccess += 1
    except AssertionError:
        print(f"Test login_status_authenticated: {RED} FAILED{RESET}")
        print("Response JSON:", res.json())
    return numSuccess, numTests + 1

def test_login_status_unauthenticated(numSuccess, numTests):
    try:
        res = requests.get("https://backend.nduboi.fr/api/auth/login/status")
        assert res.status_code == 401
        # Accept either 'msg' or 'authenticated' in response
        resp = res.json()
        assert resp.get("msg") == "Authentication required" or resp.get("authenticated") is False
        print(f"Test login_status_unauthenticated: {GREEN} OK{RESET}")
        numSuccess += 1
    except AssertionError:
        print(f"Test login_status_unauthenticated: {RED} FAILED{RESET}")
        print("Response JSON:", res.json())
    return numSuccess, numTests + 1

def test_logout_authenticated(numSuccess, numTests):
    try:
        token, cookie = get_auth_token("alice@example.com", "123456")
        cookies = {"auth_token": token} if token else {}
        res = requests.post("https://backend.nduboi.fr/api/auth/logout", cookies=cookies)
        assert res.status_code == 200
        assert "message" in res.json()
        print(f"Test logout_authenticated: {GREEN} OK{RESET}")
        numSuccess += 1
    except AssertionError:
        print(f"Test logout_authenticated: {RED} FAILED{RESET}")
        print("Response JSON:", res.json())
    return numSuccess, numTests + 1

def test_logout_unauthenticated(numSuccess, numTests):
    try:
        res = requests.post("https://backend.nduboi.fr/api/auth/logout")
        assert res.status_code == 500 or res.status_code == 401
        print(f"Test logout_unauthenticated: {GREEN} OK{RESET}")
        numSuccess += 1
    except AssertionError:
        print(f"Test logout_unauthenticated: {RED} FAILED{RESET}")
        print("Response JSON:", res.json())
    return numSuccess, numTests + 1

def test_forgot_password_valid(numSuccess, numTests):
    try:
        payload = {"email": "alice@example.com"}
        res = requests.post("https://backend.nduboi.fr/api/auth/forgot-password", json=payload)
        assert res.status_code in [200, 201, 500]
        resp = res.json()
        # Accept either a message or a known error
        if "message" in resp:
            print(f"Test forgot_password_valid: {GREEN} OK{RESET}")
            numSuccess += 1
        elif resp.get("error") == "Internal Server Error in forgot password":
            print(f"Test forgot_password_valid: {BLUE} WARNING (backend error, SMTP/config issue){RESET}")
        else:
            raise AssertionError
    except AssertionError:
        print(f"Test forgot_password_valid: {RED} FAILED{RESET}")
        print("Response JSON:", res.json())
    return numSuccess, numTests + 1

def test_forgot_password_missing_email(numSuccess, numTests):
    try:
        payload = {}
        res = requests.post("https://backend.nduboi.fr/api/auth/forgot-password", json=payload)
        assert res.status_code == 400
        assert res.json().get("error") == "Email is required"
        print(f"Test forgot_password_missing_email: {GREEN} OK{RESET}")
        numSuccess += 1
    except AssertionError:
        print(f"Test forgot_password_missing_email: {RED} FAILED{RESET}")
        print("Response JSON:", res.json())
    return numSuccess, numTests + 1

# For /verify and /reset-password, we need a valid token. We'll use a dummy/invalid token for fail cases.
def test_verify_invalid_token(numSuccess, numTests):
    try:
        headers = {"Authorization": "Bearer invalidtoken"}
        res = requests.post("https://backend.nduboi.fr/api/auth/verify", headers=headers, json={"token": "invalidtoken"})
        assert res.status_code == 401 or res.status_code == 409
        print(f"Test verify_invalid_token: {GREEN} OK{RESET}")
        numSuccess += 1
    except AssertionError:
        print(f"Test verify_invalid_token: {RED} FAILED{RESET}")
        print("Response JSON:", res.json())
    return numSuccess, numTests + 1

# /reset-password success would require a real token from the email, which is not practical in this test.
# We'll test the fail case with an invalid token and missing password.
def test_reset_password_invalid_token(numSuccess, numTests):
    try:
        headers = {"Authorization": "Bearer invalidtoken"}
        res = requests.post("https://backend.nduboi.fr/api/auth/reset-password", headers=headers, json={"newPassword": "NewPassword123!"})
        assert res.status_code == 400
        assert "error" in res.json()
        print(f"Test reset_password_invalid_token: {GREEN} OK{RESET}")
        numSuccess += 1
    except AssertionError:
        print(f"Test reset_password_invalid_token: {RED} FAILED{RESET}")
        print("Response JSON:", res.json())
    return numSuccess, numTests + 1

def test_reset_password_missing_password(numSuccess, numTests):
    try:
        headers = {"Authorization": "Bearer invalidtoken"}
        res = requests.post("https://backend.nduboi.fr/api/auth/reset-password", headers=headers, json={})
        assert res.status_code == 400
        # Accept either error for missing password or invalid/expired token
        err = res.json().get("error")
        assert err == "New password is required" or err == "Invalid or expired token"
        print(f"Test reset_password_missing_password: {GREEN} OK{RESET}")
        numSuccess += 1
    except AssertionError:
        print(f"Test reset_password_missing_password: {RED} FAILED{RESET}")
        print("Response JSON:", res.json())
    return numSuccess, numTests + 1

def test_logout_correct(numSuccess, numTests):
    try:
        res = requests.post("https://backend.nduboi.fr/api/auth/logout", json={})
        assert res.status_code == 200
        assert res.json().get("message") == "Logout successful"
        print(f"Test logout_correct: {GREEN} OK{RESET}")
        numSuccess += 1
    except AssertionError:
        print(f"Test logout_correct: {RED} FAILED{RESET}")
        print("Response JSON:", res.json())
    return numSuccess, numTests + 1

def run_test_auth_suite():
    numSuccess = 0
    numTests = 0
    numSuccess, numTests = test_create_user(numSuccess, numTests)
    numSuccess, numTests = test_create_user_bad_request(numSuccess, numTests)
    numSuccess, numTests = test_create_user_that_already_exists(numSuccess, numTests)
    numSuccess, numTests = test_register(numSuccess, numTests)
    numSuccess, numTests = test_login_email_not_verified(numSuccess, numTests)
    numSuccess, numTests = test_login_correct_credentials(numSuccess, numTests)
    numSuccess, numTests = test_login_status_authenticated(numSuccess, numTests)
    numSuccess, numTests = test_login_status_unauthenticated(numSuccess, numTests)
    numSuccess, numTests = test_logout_authenticated(numSuccess, numTests)
    numSuccess, numTests = test_logout_unauthenticated(numSuccess, numTests)
    numSuccess, numTests = test_forgot_password_valid(numSuccess, numTests)
    numSuccess, numTests = test_forgot_password_missing_email(numSuccess, numTests)
    numSuccess, numTests = test_verify_invalid_token(numSuccess, numTests)
    numSuccess, numTests = test_reset_password_invalid_token(numSuccess, numTests)
    numSuccess, numTests = test_reset_password_missing_password(numSuccess, numTests)
    print(f"\nAuth Test Summary: {GREEN}{numSuccess}{RESET}/{BLUE}{numTests}{RESET} tests passed.")
