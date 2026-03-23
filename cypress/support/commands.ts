Cypress.Commands.add('search', (term: string) => {
  cy.get('.ast-search-menu-icon').then(($el) => {
    $el.addClass('ast-dropdown-active');
    $el.find('.search-field').css({ width: '235px', visibility: 'visible', display: 'block' });
  });
  cy.get('.ast-search-menu-icon .search-field').should('be.visible').clear().type(`${term}{enter}`);
});
