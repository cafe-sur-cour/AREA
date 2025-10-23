#!/usr/bin/env python3
import health
import auth
import about
import user


if __name__ == "__main__":

    print("Running Health Tests:")
    health.run_health_test_suite()

    print("\nRunning Auth Tests:")
    auth.run_test_auth_suite()

    print("\nRunning About Tests:")
    about.run_test_about_suite()

    print("\nRunning User Tests:")
    user.run_test_user_suite()
