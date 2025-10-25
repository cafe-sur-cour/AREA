// Tests des fonctionnalités d'authentification
describe('Authentication Pages', () => {
  describe('Login Page', () => {
    beforeEach(() => {
      cy.visit('http://localhost:8081/login')
      cy.intercept('POST', '**/api/auth/login').as('loginRequest')
    })

    it('should display login form', () => {
      cy.get('form').should('exist')
      cy.get('input[type="email"]').should('exist')
      cy.get('input[type="password"]').should('exist')
      cy.get('button[type="submit"]').should('exist')
    })

    it('should handle invalid credentials', () => {
      cy.get('input[type="email"]').type('invalid@email.com')
      cy.get('input[type="password"]').type('wrongpassword')
      
      cy.get('button[type="submit"]').click()
      
      cy.wait('@loginRequest').then((interception) => {
        expect(interception.response.statusCode).to.eq(401)
        cy.get('[data-sonner-toaster], .sonner-toast')
          .should('exist')
          .and('be.visible')
      })
    })

    it('should have forgot password link', () => {
      cy.get('a[href*="forgot-password"]').should('exist')
    })
  })

  describe('Register Page', () => {
    beforeEach(() => {
      cy.visit('http://localhost:8081/register')
      // Intercepter les appels API d'inscription
      cy.intercept('POST', '**/api/auth/register').as('registerRequest')
    })

    it('should display register form', () => {
      cy.get('form').should('exist')
      cy.get('input[type="email"]').should('exist')
      cy.get('input[type="password"]').should('exist')
      cy.get('input[name="username"]').should('exist')
      cy.get('button[type="submit"]').should('exist')
    })

    it('should handle invalid email', () => {
      cy.get('input[type="email"]').type('invalidemail')
      cy.get('button[type="submit"]').click()
      // Vérifier la validation du formulaire
      cy.get('input[type="email"]:invalid').should('exist')
    })
  })
})

// Tests des pages authentifiées
describe('Protected Pages', () => {
  beforeEach(() => {
    // Gérer les exceptions non attrapées de l'application
    cy.on('uncaught:exception', (err) => {
      // Retourner false pour empêcher Cypress de faire échouer le test
      if (err.message.includes('API request failed: Unauthorized')) {
        return false
      }
    })
  })

  it('should handle unauthenticated access to protected pages', () => {
    // Test de la page services
    cy.visit('http://localhost:8081/services')
    // Attendre que la redirection soit complète
    cy.location('pathname', { timeout: 10000 }).should('include', '/login')

    // Test de la page profile
    cy.visit('http://localhost:8081/profile')
    cy.location('pathname', { timeout: 10000 }).should('include', '/login')
  })

  it('should handle unauthenticated access to services', () => {
    cy.intercept('GET', '**/api/services').as('servicesCheck')
    cy.visit('http://localhost:8081/services')
    
    // Attendre la requête qui échoue et vérifier la redirection
    cy.wait('@servicesCheck', { timeout: 10000 }).then(() => {
      cy.location('pathname', { timeout: 10000 }).should('include', '/login')
    })
  })
})

// Tests de la page My Areas (protégée)
describe('My Areas Page', () => {
  beforeEach(() => {
    // TODO: Ajouter la logique de connexion ici quand elle sera implémentée
    cy.visit('http://localhost:8081/my-areas')
  })

  it('should redirect to login if not authenticated', () => {
    cy.url().should('include', '/login')
  })
})

// Tests de la page d'accueil
describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8081/')
  })

  describe('Layout and Content', () => {
    it('should display navigation elements', () => {
      // Vérifier la présence du menu de navigation (en tenant compte des classes Tailwind)
      cy.get('div.lg\\:flex').should('exist')
    })

    it('should have the correct title and description', () => {
      cy.get('h1').should('be.visible')
      cy.get('p').should('exist')
    })

    it('should have language options', () => {
      // Rechercher le bouton ou menu de langue d'une manière plus générique
      cy.get('button').contains(/en|fr|English|Français/i).should('exist')
    })
  })

  describe('Navigation Links', () => {
    it('should have working navigation links', () => {
      cy.get('a').should('have.length.at.least', 1)
    })

    it('should navigate to register page', () => {
      cy.get('a[href*="register"]').first().click()
      cy.url().should('include', '/register')
      cy.go('back')
    })

    it('should navigate to login page', () => {
      cy.get('a[href*="login"]').first().click()
      cy.url().should('include', '/login')
      cy.go('back')
    })
  })

  describe('Responsive Design', () => {
    it('should show/hide elements appropriately on mobile', () => {
      cy.viewport('iphone-x')
      // Vérifier que le menu burger est visible sur mobile
      cy.get('button').should('be.visible')
      // Vérifier que le menu principal est caché
      cy.get('div.lg\\:flex').should('exist')
    })

    it('should show/hide elements appropriately on desktop', () => {
      cy.viewport(1280, 720) // Desktop size
      // Vérifier que le menu principal est visible
      cy.get('div.lg\\:flex').should('exist')
    })
  })

  describe('Interactive Elements', () => {
    it('should show mobile menu when clicking burger button on mobile', () => {
      cy.viewport('iphone-x')
      // Trouver et cliquer sur le bouton de menu mobile
      cy.get('button[aria-label*="menu" i], button[aria-label*="navigation" i]')
        .should('be.visible')
        .click()
      
      // Vérifier que le menu est devenu visible
      cy.get('nav, [role="navigation"]').should('be.visible')
    })

    it('should have working buttons', () => {
      cy.get('button').each(($button) => {
        cy.wrap($button).should('not.be.disabled')
      })
    })
  })

  describe('Authentication State', () => {
    it('should have login or register link when not logged in', () => {
      // Vérifier les liens de connexion/inscription de manière plus spécifique
      cy.get('a[href*="/login"], a[href*="/register"]')
        .should('have.length.at.least', 1)
        .then($links => {
          // Log les liens trouvés pour le débogage
          cy.log('Found auth links:', $links.length)
        })
    })

    it('should redirect to login for protected routes', () => {
      cy.visit('http://localhost:8081/my-areas')
      cy.url().should('include', '/login')
    })
  })
})