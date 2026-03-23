Cypress.Commands.add('search', (term: string) => {
  cy.get('.ast-search-menu-icon').click();
  cy.get('.ast-search-menu-icon .search-field').clear().type(`${term}{enter}`);
});
