describe('Authentication Pages', () => {
  describe('Login Page', () => {
    beforeEach(() => {
      cy.visit('http://localhost:8081/login');
      cy.intercept('POST', '**/api/auth/login').as('loginRequest');
    });

    it('should display login form', () => {
      cy.get('form').should('exist');
      cy.get('input[type="email"]').should('exist');
      cy.get('input[type="password"]').should('exist');
      cy.get('button[type="submit"]').should('exist');
    });

    it('should handle invalid credentials', () => {
      cy.get('input[type="email"]').type('invalid@email.com');
      cy.get('input[type="password"]').type('wrongpassword');

      cy.get('button[type="submit"]').click();

      cy.wait('@loginRequest').then(interception => {
        expect(interception.response.statusCode).to.eq(401);
        cy.get('[data-sonner-toaster], .sonner-toast')
          .should('exist')
          .and('be.visible');
      });
    });

    it('should have forgot password link', () => {
      cy.get('a[href*="forgot-password"]').should('exist');
    });
  });

  describe('Register Page', () => {
    beforeEach(() => {
      cy.visit('http://localhost:8081/register');
      cy.intercept('POST', '**/api/auth/register').as('registerRequest');
    });

    it('should display register form', () => {
      cy.get('form').should('exist');
      cy.get('input[type="email"]').should('exist');
      cy.get('input[type="password"]').should('exist');
      cy.get('input[name="username"]').should('exist');
      cy.get('button[type="submit"]').should('exist');
    });

    it('should handle invalid email', () => {
      cy.get('input[type="email"]').type('invalidemail');
      cy.get('button[type="submit"]').click();
      cy.get('input[type="email"]:invalid').should('exist');
    });
  });
});

describe('Protected Pages', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', err => {
      if (err.message.includes('API request failed: Unauthorized')) {
        return false;
      }
    });
  });

  it('should handle unauthenticated access to protected pages', () => {
    cy.visit('http://localhost:8081/services');
    cy.location('pathname', { timeout: 10000 }).should('include', '/login');

    cy.visit('http://localhost:8081/profile');
    cy.location('pathname', { timeout: 10000 }).should('include', '/login');
  });

  it('should handle unauthenticated access to services', () => {
    cy.intercept('GET', '**/api/services').as('servicesCheck');
    cy.visit('http://localhost:8081/services');

    cy.wait('@servicesCheck', { timeout: 10000 }).then(() => {
      cy.location('pathname', { timeout: 10000 }).should('include', '/login');
    });
  });
});

describe('My Areas Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8081/my-areas');
  });

  it('should redirect to login if not authenticated', () => {
    cy.url().should('include', '/login');
  });
});

describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8081/');
  });

  describe('Layout and Content', () => {
    it('should display navigation elements', () => {
      cy.get('div.lg\\:flex').should('exist');
    });

    it('should have the correct title and description', () => {
      cy.get('h1').should('be.visible');
      cy.get('p').should('exist');
    });

    it('should have language options', () => {
      cy.get('button')
        .contains(/en|fr|English|Français/i)
        .should('exist');
    });
  });

  describe('Navigation Links', () => {
    it('should have working navigation links', () => {
      cy.get('a').should('have.length.at.least', 1);
    });

    it('should navigate to register page', () => {
      cy.get('a[href*="register"]').first().click();
      cy.url().should('include', '/register');
      cy.go('back');
    });

    it('should navigate to login page', () => {
      cy.get('a[href*="login"]').first().click();
      cy.url().should('include', '/login');
      cy.go('back');
    });
  });

  describe('Responsive Design', () => {
    it('should show/hide elements appropriately on mobile', () => {
      cy.viewport('iphone-x');
      cy.get('button').should('be.visible');
      cy.get('div.lg\\:flex').should('exist');
    });

    it('should show/hide elements appropriately on desktop', () => {
      cy.viewport(1280, 720);
      cy.get('div.lg\\:flex').should('exist');
    });
  });

  describe('Interactive Elements', () => {
    it('should show mobile menu when clicking burger button on mobile', () => {
      cy.viewport('iphone-x');
      cy.get('button[aria-label*="menu" i], button[aria-label*="navigation" i]')
        .should('be.visible')
        .click();
      cy.get('nav, [role="navigation"]').should('be.visible');
    });

    it('should have working buttons', () => {
      cy.get('button').each($button => {
        cy.wrap($button).should('not.be.disabled');
      });
    });
  });

  describe('Authentication State', () => {
    it('should have login or register link when not logged in', () => {
      cy.get('a[href*="/login"], a[href*="/register"]')
        .should('have.length.at.least', 1)
        .then($links => {
          cy.log('Found auth links:', $links.length);
        });
    });

    it('should redirect to login for protected routes', () => {
      cy.visit('http://localhost:8081/my-areas');
      cy.url().should('include', '/login');
    });
  });
});

describe('Catalogue Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8081/catalogue');
    cy.intercept('GET', '**/about.json').as('aboutRequest');
  });

  it('should display header and filter section', () => {
    cy.get('h1')
      .contains('Catalogue of Actions and Reactions')
      .should('be.visible');

    cy.get('h2')
      .contains('Filter')
      .should('be.visible')
      .parent()
      .find('svg')
      .should('exist');
  });

  it('should have working filter dropdowns', () => {
    cy.get('[data-slot="select-trigger"]').first().click({ force: true });
    cy.get('[role="listbox"]')
      .should('be.visible')
      .within(() => {
        cy.contains('All Types').should('exist');
        cy.contains('Actions Only').should('exist');
        cy.contains('Reactions Only').should('exist');
      });
    cy.get('body').type('{esc}');

    cy.get('[data-slot="select-trigger"]').eq(1).click({ force: true });
    cy.get('[role="listbox"]')
      .should('be.visible')
      .within(() => {
        cy.contains('All Services').should('exist');
      });
  });

  it('should display action cards correctly', () => {
    cy.wait('@aboutRequest');
    cy.wait(1000);
    cy.get('[data-slot="card"]')
      .should('exist')
      .should('have.length.at.least', 1)
      .each($card => {
        cy.wrap($card).within(() => {
          cy.get('[data-slot="card-content"]')
            .find('h3')
            .should('exist')
            .and('be.visible');
          cy.get('[data-slot="badge"]')
            .should('exist')
            .and('be.visible')
            .invoke('text')
            .then(text => {
              expect(text).to.match(/(Reaction|Action)/);
            });
          cy.get('button')
            .should('exist')
            .and('be.visible')
            .invoke('text')
            .then(text => {
              expect(text).to.match(/(Add this action|Add this reaction)/);
            });
        });
      });
  });

  it('should handle filter changes', () => {
    cy.wait('@aboutRequest');

    cy.get('[data-slot="select-trigger"]').first().click({ force: true });
    cy.get('[role="listbox"]').contains('Actions Only').click();
    cy.url().should('include', 'filterType=actions');

    cy.get('[data-slot="select-trigger"]').first().click({ force: true });
    cy.get('[role="listbox"]').contains('Reactions Only').click();
    cy.url().should('include', 'filterType=reactions');

    cy.get('[data-slot="select-trigger"]').first().click({ force: true });
    cy.get('[role="listbox"]').contains('All Types').click();
    cy.url().should('include', 'filterType=all');
  });

  it('should check text styles and responsiveness', () => {
    cy.get('h1').should('have.class', 'font-heading');
    cy.get('h1').should('have.class', 'text-3xl');

    cy.viewport(1280, 720);
    cy.get('.grid').should('have.class', 'lg:grid-cols-3');

    cy.viewport('iphone-x');
    cy.get('.grid').should('have.class', 'grid-cols-1');
  });

  it('should handle button interactions', () => {
    cy.wait('@aboutRequest').then(() => {
      cy.get('button')
        .contains(/Add this action|Add this reaction/)
        .first()
        .should('have.class', 'cursor-pointer')
        .trigger('mouseover')
        .should('have.class', 'hover:bg-app-red-primary');
    });
  });
});
