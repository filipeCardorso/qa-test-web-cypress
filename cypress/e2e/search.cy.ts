import { HomePage } from '../pages/HomePage';
import { SearchResultPage } from '../pages/SearchResultPage';

describe('Blog do Agi - Search Tests', () => {
  const homePage = new HomePage();
  let searchData: Record<string, string>;

  before(() => {
    cy.fixture('searchData').then((data) => {
      searchData = data;
    });
  });

  beforeEach(() => {
    homePage.visit();
  });

  it('should return results for valid search term', () => {
    // Arrange
    const term = searchData.validTerm;

    // Act
    const results = homePage.searchFor(term);

    // Assert
    results.getResults().should('have.length.greaterThan', 0);
  });

  it('should show no results message for non-existent term', () => {
    // Arrange
    const term = searchData.invalidTerm;

    // Act
    const results = homePage.searchFor(term);

    // Assert
    results.hasNoResults().should('be.true');
    results.getResultCount().should('equal', 0);
  });

  it('should handle special characters without error', () => {
    // Arrange
    const term = searchData.specialCharsTerm;

    // Act
    const results = homePage.searchFor(term);

    // Assert
    results.isPageLoaded();
  });

  it('should return result title and link matching search term', () => {
    // Arrange
    const term = searchData.contentValidationTerm;

    // Act
    const results = homePage.searchFor(term);

    // Assert
    results.getResults().should('have.length.greaterThan', 0);
    results.getFirstResultTitle().invoke('text').then((title) => {
      expect(title.toLowerCase()).to.include(term.toLowerCase());
    });
    results.getFirstResultLink().should('not.be.empty');
  });
});
