import { BasePage } from './BasePage';

export class SearchResultPage extends BasePage {
  private resultArticles = 'article';
  private resultTitle = '.entry-title a';
  private noResults = '.no-results';

  getResults(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.resultArticles);
  }

  getResultCount(): Cypress.Chainable<number> {
    return cy.get('body').then(($body) => {
      if ($body.find(this.noResults).length > 0) {
        return 0;
      }
      return $body.find(this.resultArticles).length;
    });
  }

  getFirstResultTitle(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.resultTitle).first();
  }

  getFirstResultLink(): Cypress.Chainable<string> {
    return cy.get(this.resultTitle).first().invoke('attr', 'href') as Cypress.Chainable<string>;
  }

  hasNoResults(): Cypress.Chainable<boolean> {
    return cy.get('body').then(($body) => {
      return $body.find(this.noResults).length > 0;
    });
  }

  isPageLoaded(): void {
    cy.url().should('include', '?s=');
  }
}
