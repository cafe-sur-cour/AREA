describe('Protected Pages', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8081/login');
    cy.intercept('POST', '**/api/auth/login').as('loginRequest');
    cy.on('uncaught:exception', err => {
      return false;
    });

    cy.get('input[type="email"]').type('alice@example.com');
    cy.get('input[type="password"]').type('123456');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest').then(interception => {
      expect(interception.response.statusCode).to.eq(200);
      cy.location('pathname', { timeout: 10000 }).should('eq', '/');
    });
  });

  describe('Dashboard Pages', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/mappings').as('getMappings');
      cy.intercept('GET', '**/services/subscribed').as('getServices');

      cy.visit('http://localhost:8081/dashboard');
    });

    it('should display dashboard header and navigation', () => {
      cy.wait(['@getMappings', '@getServices']);
      cy.get('h1').contains('Dashboard').should('be.visible');
      cy.get('nav').should('exist');
    });

    it('should display statistics cards', () => {
      cy.wait(['@getMappings', '@getServices']);

      cy.get('[data-slot="card"]').should('have.length.at.least', 4);
      cy.get('[data-slot="card"]').each($card => {
        cy.wrap($card).within(() => {
          cy.get('[data-slot="card-content"]').should('exist');
          cy.get('[data-slot="card-content"]').each($content => {
            cy.wrap($content).within(() => {
              cy.get('p').should('have.length.at.least', 2);
            });
          });
        });
      });
    });

    it('should handle loading and error states', () => {
      cy.intercept('GET', '**/mappings', req => {
        req.reply({ delay: 1000 });
      }).as('delayedMappings');

      cy.reload();

      cy.intercept('GET', '**/mappings', {
        statusCode: 500,
        body: { error: 'Internal Server Error' },
      }).as('errorMappings');

      cy.reload();
    });

    it('should have responsive layout', () => {
      cy.wait(['@getMappings', '@getServices']);

      cy.viewport(1280, 720);
      cy.get('[data-slot="card"]')
        .should('have.length.at.least', 4)
        .and('be.visible');

      cy.viewport('iphone-x');
      cy.get('[data-slot="card"]')
        .should('have.length.at.least', 4)
        .and('be.visible');

      cy.get('button[aria-label*="menu" i], button[aria-label*="navigation" i]')
        .should('be.visible')
        .click();
      cy.get('nav').should('be.visible');
    });
  });

  describe('Service Pages', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/mappings').as('getMappings');
      cy.intercept('GET', '**/services').as('getServices');
      cy.intercept('GET', '**/services/subscribed').as('getSubscribedServices');
      cy.intercept('GET', '**/services/*/auth').as('getServiceAuth');
      cy.intercept('GET', '**/services/*/status').as('getServiceStatus');

      cy.on('uncaught:exception', err => {
        return false;
      });

      cy.visit('http://localhost:8081/services');
    });

    it('should display service cards with correct information', () => {
      cy.wait('@getServices');

      cy.get('[data-slot="card"]').each($card => {
        cy.wrap($card).within(() => {
          cy.get('[data-slot="card-content"]')
            .should('exist')
            .within(() => {
              cy.get('h3').should('exist').and('not.be.empty');
              cy.get('p').should('exist');

              cy.get('[data-slot="badge"]')
                .should('exist')
                .invoke('text')
                .then(text => {
                  expect(text).to.match(/Subscribed|Not Subscribed/);
                });
            });
        });
      });
    });

    it('should handle 2 buttons per card', () => {
      cy.get('[data-slot="card"]').each($card => {
        cy.wrap($card).within(() => {
          cy.get('button').should('exist').and('have.length.at.least', 2);
        });
      });
    });

    it('should handle service interactions', () => {
      cy.wait('@getServices');

      cy.get('[data-slot="card"]')
        .first()
        .within(() => {
          cy.get('button').should('have.length', 2);

          cy.get('button')
            .contains('More details')
            .should('exist')
            .and('not.be.disabled');

          cy.get('button')
            .contains(/Subscribe|Unsubscribe/)
            .should('exist')
            .and('not.be.disabled')
            .click();
        });

      cy.url().should('satisfy', url => {
        return (
          url.includes('/oauth') ||
          url.includes('/catalogue') ||
          url === 'http://localhost:8081/services'
        );
      });
    });

    it('should have responsive layout', () => {
      cy.wait('@getServices');

      cy.viewport(1280, 720);
      cy.get('[data-slot="card"]').should('have.length.at.least', 1);

      cy.viewport('iphone-x');
      cy.get('[data-slot="card"]').should('have.length.at.least', 1);

      cy.get('button[aria-label*="menu" i], button[aria-label*="navigation" i]')
        .should('be.visible')
        .click();
      cy.get('nav').should('be.visible');
    });
  });

  describe('My-Areas Pages', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/mappings').as('getMappings');
      cy.intercept('POST', '**/mappings').as('createMapping');
      cy.intercept('DELETE', '**/mappings/*').as('deleteMapping');
      cy.intercept('PUT', '**/mappings/*/activate').as('activateMapping');
      cy.intercept('PUT', '**/mappings/*/deactivate').as('deactivateMapping');
      cy.intercept('GET', '**/services/*/actions/*').as('getAction');
      cy.intercept('GET', '**/services/*/reactions/*').as('getReaction');

      cy.visit('http://localhost:8081/my-areas');
    });

    it('should display page header and create button', () => {
      cy.wait('@getMappings');

      cy.get('h1').contains('My AREAs').should('be.visible');
      cy.contains('Manage your area (actions & reactions) workflows').should(
        'be.visible'
      );

      cy.get('button').contains('New Area').should('be.visible');
    });

    it('should handle empty state', () => {
      cy.intercept('GET', '**/mappings', { body: { mappings: [] } }).as(
        'emptyMappings'
      );
      cy.reload();
      cy.wait('@emptyMappings');

      cy.contains('No areas yet').should('be.visible');
      cy.contains('Create your first area to get started').should('be.visible');
    });

    it('should display existing areas correctly', () => {
      cy.wait('@getMappings');

      cy.get('[data-slot="card"]').each($card => {
        cy.wrap($card).within(() => {
          if (cy.get('p').contains('No areas yet')) {
            cy.get('p')
              .contains('Create your first area to get started')
              .should('be.visible');
            return;
          }

          cy.get('[data-slot="card-header"]').should('exist');
          cy.get('button').should('exist').should('have.length.at.least', 2);

          cy.contains('Action').should('exist');
          cy.contains('Reactions').should('exist');

          cy.get('button').should('have.length.at.least', 2); // Pour les boutons power et delete
        });
      });
    });

    it('should open create area drawer', () => {
      cy.wait('@getMappings');
      cy.get('button').contains('New Area').click();

      cy.get('[role="dialog"]').within(() => {
        cy.get('input#name').should('exist');
        cy.get('textarea#description').should('exist');
        cy.get('[type="submit"]').contains('Create Area').should('exist');
      });
    });

    it('should be responsive', () => {
      cy.wait('@getMappings');

      cy.viewport(1280, 720);
      cy.get('[data-slot="card"]').should('be.visible');

      cy.viewport('iphone-x');
      cy.get('[data-slot="card"]').should('be.visible');

      cy.get('button[aria-label*="menu" i], button[aria-label*="navigation" i]')
        .should('be.visible')
        .click();

      cy.get('nav').should('be.visible');
    });
  });
});
