describe('Authentication Pages', () => {
  describe('Register Page', () => {
    beforeEach(() => {
      cy.visit('http://localhost:8081/register');
      cy.intercept('POST', '**/api/auth/register').as('registerRequest');
    });
    it('should display register form', () => {
      cy.get('form').should('exist');
      cy.get('input[name="username"]').should('exist');
      cy.get('input[type="email"]').should('exist');
      cy.get('input[type="password"]').should('exist');
      cy.get('button[type="submit"]').should('exist');
      cy.get('span').contains('Login with Google');
      cy.get('span').contains('Login with Microsoft 365');
      cy.get('span').contains('Login with Github');
      cy.get('span').contains('Login with Meta');
    });
  });

  describe('Login Page', () => {
    beforeEach(() => {
      cy.visit('http://localhost:8081/login');
      cy.intercept('POST', '**/api/auth/login').as('loginRequest');
      cy.on('uncaught:exception', err => {
        return false;
      });
    });

    it('should display login form and social login options', () => {
      cy.get('form').should('exist');
      cy.get('input[type="email"]').should('exist');
      cy.get('input[type="password"]').should('exist');
      cy.get('button[type="submit"]').should('exist');
      cy.get('span').contains('Login with Google');
      cy.get('span').contains('Login with Microsoft 365');
      cy.get('span').contains('Login with Github');
      cy.get('span').contains('Login with Meta');
    });

    it('should successfully login with valid credentials', () => {
      cy.get('input[type="email"]').type('alice@example.com');
      cy.get('input[type="password"]').type('123456');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginRequest').then(interception => {
        expect(interception.response.statusCode).to.eq(200);
        cy.location('pathname', { timeout: 10000 }).should('eq', '/');
      });
    });

    it('should successfully login and naviagate to protected pages', () => {
      cy.get('input[type="email"]').type('alice@example.com');
      cy.get('input[type="password"]').type('123456');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginRequest').then(interception => {
        expect(interception.response.statusCode).to.eq(200);
        cy.location('pathname', { timeout: 10000 }).should('eq', '/');
        cy.visit('http://localhost:8081/services');
        cy.location('pathname', { timeout: 10000 }).should(
          'include',
          '/services'
        );
        cy.visit('http://localhost:8081/my-areas');
        cy.location('pathname', { timeout: 10000 }).should(
          'include',
          '/my-areas'
        );
        cy.visit('http://localhost:8081/dashboard');
        cy.location('pathname', { timeout: 10000 }).should(
          'include',
          '/dashboard'
        );
      });
    });

    it('should navigate to forgot password page', () => {
      cy.get('a[href="/forgot-password"]').click();
      cy.location('pathname').should('eq', '/forgot-password');
    });

    it('should navigate to register page from login', () => {
      cy.get('a[href="/register"]').click();
      cy.location('pathname').should('eq', '/register');
    });

    it('should show loading state during login attempt', () => {
      cy.get('input[type="email"]').type('alice@example.com');
      cy.get('input[type="password"]').type('123456');
      cy.get('button[type="submit"]').click();

      cy.get('button[type="submit"]').should('contain', 'Logging in...');
    });

    it('should maintain form validation', () => {
      cy.get('input[type="email"]').type('invalidemail');
      cy.get('button[type="submit"]').click();
      cy.get('input[type="email"]:invalid').should('exist');

      cy.get('input[type="email"]').clear();
      cy.get('input[type="password"]').clear();
      cy.get('button[type="submit"]').click();
      cy.get('input[type="email"]:invalid').should('exist');
      cy.get('input[type="password"]:invalid').should('exist');
    });
  });
});
