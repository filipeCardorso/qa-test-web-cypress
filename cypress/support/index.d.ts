declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to perform a search on the blog
     * @param term - The search term
     */
    search(term: string): Chainable<void>;
  }
}
