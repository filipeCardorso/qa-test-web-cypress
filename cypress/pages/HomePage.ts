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
    cy.get(this.searchIcon).click();
    cy.get(this.searchField).clear().type(`${term}{enter}`);
    return new SearchResultPage();
  }
}
