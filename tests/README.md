# AREA Project Testing Guide

This document explains how to run both **functional** and **stress** tests for the AREA backend.

---

## Functional Tests

Functional tests check that your API endpoints behave as expected (correct responses, error handling, permissions, etc.).

### Location
- All functional test scripts are in `tests/fonctionalTest/`
  - Example files: `auth.py`, `user.py`, `about.py`, etc.

### Requirements
- Python 3.x
- `requests` library (install with `pip install requests`)

### How to Run
1. Open a terminal in the project root.
2. Make sure the backend server is running and accessible (default: `https://backend.nduboi.fr`).
3. Run a test script:
   ```bash
   python3 tests/fonctionalTest/auth.py
   python3 tests/fonctionalTest/user.py
   python3 tests/fonctionalTest/about.py
   # ...etc
   ```
   Or run all scripts in the folder (Linux):
   ```bash
   for f in tests/fonctionalTest/*.py; do python3 "$f"; done
   ```

---

## Stress Tests

Stress tests simulate heavy load to measure performance and stability.

### Location
- All stress test scripts are in `tests/stressTest/`
  - Example files: `login-test.js`, etc.

### Requirements
- [k6](https://k6.io/) load testing tool

### How to Run
1. Install k6 (see [k6 installation guide](https://k6.io/docs/getting-started/installation/)).
2. Open a terminal in the project root.
3. Run a stress test:
   ```bash
   k6 run tests/stressTest/login-test.js
   # or any other .js file in the folder
   ```
4. To save results to a file:
   ```bash
   k6 run --out json=results.json tests/stressTest/login-test.js
   ```
5. To run multiple tests in parallel:
   ```bash
   k6 run tests/stressTest/test-load.js & k6 run tests/stressTest/another-test.js
   ```

---

## Current Stats

**login-test** 60% for a 1000 limit at 500
**register** 100% for 814 request
**navigation** 100% for 6 iterration for 300 users, 4050
**Webhook** 100% for 500 users, 28782 complete

## Notes
- Always ensure the backend is running before starting tests.
- Functional tests are safe and do not overload the server.
- Stress tests can impact server performance—run them with caution, preferably on a staging environment.

---

For any issues, check the test script output or contact the project maintainers.
