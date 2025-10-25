describe('Navigation', () => {
  it('should navigate to the about page', () => {
    cy.visit('http://localhost:8081/')

    cy.get('a[href*="about"]').click()

    // The new url should include "/about"
    cy.url().should('include', '/about')

    cy.get('h1').contains('About')
  })
})