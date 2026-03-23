import { BasePage } from './BasePage';
import { SearchResultPage } from './SearchResultPage';

export class HomePage extends BasePage {
  private searchIcon = '.ast-search-menu-icon';
  private searchField = '.ast-search-menu-icon .search-field';

  visit(): this {
    cy.visit('/');
    return this;
  }

  searchFor(term: string): SearchResultPage {
    // Activate slide-search dropdown via JS (headless-safe)
    cy.get(this.searchIcon).then(($el) => {
      const container = $el.closest('.ast-search-menu-icon');
      container.addClass('ast-dropdown-active');
      container.find('.search-field')
        .css({ width: '235px', visibility: 'visible', display: 'block' });
    });
    cy.get(this.searchField).should('be.visible').clear().type(`${term}{enter}`);
    cy.url().should('include', '?s=');
    return new SearchResultPage();
  }
}
