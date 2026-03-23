export class BasePage {
  getPageTitle(): Cypress.Chainable<string> {
    return cy.title();
  }

  getCurrentUrl(): Cypress.Chainable<string> {
    return cy.url();
  }
}
