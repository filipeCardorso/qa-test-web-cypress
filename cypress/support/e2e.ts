import './commands';

// Ignore uncaught exceptions from the application (e.g., Astra theme JS errors)
Cypress.on('uncaught:exception', () => {
  return false;
});
