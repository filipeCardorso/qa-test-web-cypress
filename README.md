# QA Test - Web Automation (Cypress + TypeScript)

Automação de testes end-to-end para a funcionalidade de pesquisa do [Blog do Agi](https://blogdoagi.com.br/), desenvolvida como parte de um teste técnico para QA. Este projeto complementa a versão em Selenium, demonstrando a mesma cobertura com uma abordagem moderna baseada em JavaScript.

## Sumário

- [Sobre o Projeto](#sobre-o-projeto)
- [Por Que Dois Projetos Web](#por-que-dois-projetos-web)
- [Análise da Aplicação](#análise-da-aplicação)
- [Cenários de Teste](#cenários-de-teste)
- [Arquitetura e Design Patterns](#arquitetura-e-design-patterns)
- [Stack Tecnológica](#stack-tecnológica)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Configuração e Execução](#configuração-e-execução)
- [CI/CD](#cicd)
- [Relatórios](#relatórios)
- [Decisões Técnicas](#decisões-técnicas)

---

## Sobre o Projeto

Este projeto automatiza os cenários mais relevantes da funcionalidade de pesquisa do Blog do Agi utilizando **Cypress com TypeScript**. A abordagem prioriza velocidade de execução, retry automático e uma DX (Developer Experience) superior com hot-reload e time-travel debugging.

## Por Que Dois Projetos Web

A decisão de implementar a automação Web em duas tecnologias diferentes (Selenium e Cypress) não foi acidental:

| Aspecto | Selenium | Cypress |
|---------|----------|---------|
| **Abordagem** | Controla o browser externamente via WebDriver | Executa dentro do browser, acesso direto ao DOM |
| **Linguagem** | Java (tipagem estática, OOP) | TypeScript (tipagem estática, funcional) |
| **Velocidade** | Mais lento (comunicação via HTTP) | Mais rápido (execução in-browser) |
| **Retry** | Manual via WebDriverWait | Nativo — retry automático em queries |
| **Debugging** | Screenshots + logs | Time-travel, snapshots do DOM |
| **Mercado** | Padrão corporativo, multi-browser real | Standard moderno, CI-first |

Ambos cobrem os **mesmos 4 cenários**, permitindo comparar abordagens e demonstrar versatilidade.

## Análise da Aplicação

O Blog do Agi é um site WordPress com o tema **Astra**. A funcionalidade de pesquisa segue o padrão WordPress:

- **URL original:** `https://blogdoagi.com.br/` (redireciona 301 para `https://blog.agibank.com.br/`)
- **Mecanismo:** Ícone de lupa (slide-search) no header que expande um campo de busca via CSS transition
- **Comportamento:** Submissão do formulário redireciona para `?s={termo}` com resultados paginados

### Desafio Técnico: Slide-Search do Astra

O tema Astra usa `visibility: hidden` e transições CSS para o campo de busca. O click nativo do Cypress no ícone de busca não ativa o dropdown de forma confiável. A solução adotada foi manipular o DOM via **jQuery** (disponível nativamente no Cypress) para adicionar a classe `ast-dropdown-active` e tornar o campo visível antes da interação.

### Erro JS da Aplicação

O site lança um erro JavaScript (`astra is not defined`) que o Cypress intercepta por padrão, falhando o teste. Foi adicionado um handler `Cypress.on('uncaught:exception')` para ignorar erros da aplicação que não são responsabilidade dos testes.

## Cenários de Teste

### CT-001: Pesquisa com termo válido retorna resultados
| Campo | Descrição |
|-------|-----------|
| **Prioridade** | Alta |
| **Dados** | Termo: "automação" (via fixture) |
| **Passos** | 1. Visitar a página inicial 2. Ativar o campo de busca 3. Digitar o termo e submeter |
| **Resultado esperado** | Pelo menos 1 elemento `article` é renderizado na página |
| **Por que é relevante** | Happy path — valida que o fluxo principal funciona end-to-end |

### CT-002: Pesquisa com termo inexistente exibe mensagem
| Campo | Descrição |
|-------|-----------|
| **Prioridade** | Alta |
| **Dados** | Termo: "xyznonexistent999" (via fixture) |
| **Passos** | 1. Visitar a página inicial 2. Pesquisar pelo termo |
| **Resultado esperado** | `hasNoResults()` retorna `true` e contagem de resultados é zero |
| **Por que é relevante** | Cenário negativo — garante feedback claro ao usuário quando nenhum conteúdo corresponde |

### CT-003: Pesquisa com caracteres especiais não quebra
| Campo | Descrição |
|-------|-----------|
| **Prioridade** | Média |
| **Dados** | Termo: "@#$%&" (via fixture) |
| **Passos** | 1. Visitar a página inicial 2. Pesquisar pelo termo |
| **Resultado esperado** | A URL contém `?s=` (página de resultados carregou sem erro) |
| **Por que é relevante** | Robustez — inputs inesperados não devem causar erro 500 ou página quebrada |

### CT-004: Resultado contém título e link coerentes com o termo
| Campo | Descrição |
|-------|-----------|
| **Prioridade** | Alta |
| **Dados** | Termo: "crédito" (via fixture) |
| **Passos** | 1. Visitar a página inicial 2. Pesquisar pelo termo 3. Verificar o primeiro resultado |
| **Resultado esperado** | O texto do título contém "crédito" (case-insensitive) e o atributo `href` não está vazio |
| **Por que é relevante** | Relevância — valida que o mecanismo de busca retorna conteúdo pertinente, não apenas qualquer resultado |

## Arquitetura e Design Patterns

### Page Object Model (POM) — Adaptado ao Cypress

Diferente do Selenium onde Page Objects retornam `WebElement`, no Cypress os Page Objects retornam **Chainable commands** que respeitam a natureza assíncrona do framework.

```
BasePage
  ├── HomePage           → visit() e searchFor(term)
  └── SearchResultPage   → getResults(), hasNoResults(), getFirstResultTitle()
```

**Por que POM no Cypress:** apesar de haver debate na comunidade sobre POM em Cypress (vs. Custom Commands puros), a abordagem POM mantém consistência com o projeto Selenium e encapsula seletores em um único lugar.

### Custom Commands

O comando `cy.search(term)` encapsula toda a lógica de ativação do dropdown + digitação + submissão. Pode ser usado como alternativa ao Page Object quando se quer uma abordagem mais "Cypress-nativa".

```typescript
Cypress.Commands.add('search', (term: string) => {
  cy.get('.ast-search-menu-icon').then(($el) => {
    $el.addClass('ast-dropdown-active');
    $el.find('.search-field').css({ width: '235px', visibility: 'visible', display: 'block' });
  });
  cy.get('.search-field').should('be.visible').clear().type(`${term}{enter}`);
});
```

### Fixtures / Data-Driven Testing

Os termos de busca são externalizados em `cypress/fixtures/searchData.json`:

```json
{
  "validTerm": "automação",
  "invalidTerm": "xyznonexistent999",
  "specialCharsTerm": "@#$%&",
  "contentValidationTerm": "crédito"
}
```

**Por que:** separar dados de teste do código permite alterar cenários sem modificar os testes, facilita manutenção e permite reutilizar dados em diferentes specs.

### Padrão AAA (Arrange-Act-Assert)

Mesmo padrão do projeto Selenium, adaptado à sintaxe do Cypress:

```typescript
it('should return results for valid search term', () => {
  // Arrange
  const term = searchData.validTerm;

  // Act
  const results = homePage.searchFor(term);

  // Assert
  results.getResults().should('have.length.greaterThan', 0);
});
```

### Retry-ability Nativo

Diferente do Selenium onde é necessário implementar `WebDriverWait` manualmente, o Cypress re-executa automaticamente queries de DOM até que a asserção passe ou o timeout expire. Isso resulta em testes mais estáveis sem código extra.

Configuração em `cypress.config.ts`:
```typescript
retries: {
  runMode: 2,   // CI — retenta até 2 vezes
  openMode: 0,  // Local — sem retry para debugging
}
```

## Stack Tecnológica

| Tecnologia | Versão | Justificativa |
|-----------|--------|---------------|
| Cypress | 15.12.0 | Framework moderno, execução in-browser, retry nativo, time-travel debug |
| TypeScript | 5.7.0 | Tipagem estática, autocomplete, prevenção de erros em tempo de compilação |
| Allure Report | 3.2.0 | Relatórios visuais consistentes com o projeto Selenium |
| Node.js | 20+ | Runtime LTS, compatível com Cypress 15 |

## Estrutura do Projeto

```
qa-test-web-cypress/
├── .github/workflows/test.yml          # Pipeline CI/CD
├── cypress.config.ts                   # Configuração do Cypress (base URL, timeouts, retries)
├── package.json                        # Dependências e scripts npm
├── tsconfig.json                       # Configuração TypeScript
├── cypress/
│   ├── e2e/
│   │   └── search.cy.ts               # 4 cenários de teste (padrão AAA)
│   ├── fixtures/
│   │   └── searchData.json            # Dados de teste externalizados
│   ├── pages/
│   │   ├── BasePage.ts                # Classe base — title, URL
│   │   ├── HomePage.ts               # Page Object — navegação + pesquisa
│   │   └── SearchResultPage.ts       # Page Object — verificações de resultado
│   ├── support/
│   │   ├── commands.ts               # Custom command cy.search()
│   │   ├── e2e.ts                    # Setup global + uncaught exception handler
│   │   └── index.d.ts               # Tipagens dos custom commands
│   └── reports/
│       └── .gitkeep
└── README.md
```

## Pré-requisitos

- **Node.js 20+** — [Download](https://nodejs.org/)
- **Google Chrome** — [Download](https://www.google.com/chrome/)
- **Git** — [Download](https://git-scm.com/)

## Configuração e Execução

```bash
# 1. Clonar o repositório
git clone https://github.com/filipeCardorso/qa-test-web-cypress.git
cd qa-test-web-cypress

# 2. Instalar dependências
npm install

# 3. Executar testes (headless)
npm test

# 4. Executar testes (modo interativo com time-travel debug)
npm run cy:open

# 5. Executar testes (headed — abre o browser)
npm run cy:run:headed

# 6. Gerar relatório Allure
npm run allure:generate

# 7. Abrir relatório no browser
npm run allure:open
```

### Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|-----------|
| `npm test` | `cypress run --browser chrome` | Execução headless (CI) |
| `npm run cy:open` | `cypress open` | Modo interativo com UI |
| `npm run cy:run:headed` | `cypress run --browser chrome --headed` | Execução com browser visível |
| `npm run allure:generate` | `allure generate ...` | Gera relatório HTML |
| `npm run allure:open` | `allure open ...` | Abre relatório no browser |

## CI/CD

O projeto possui pipeline **GitHub Actions** que executa automaticamente a cada push ou pull request:

1. **Setup:** Configura Node.js 20 e instala dependências via `npm ci`
2. **Testes:** Executa Cypress em Chrome headless via `cypress-io/github-action`
3. **Relatório de Resultados:** Publica gráficos com contagem de testes no Summary da pipeline (JUnit XML reporter)
4. **Allure Report:** Gera relatório e salva como artifact
5. **Screenshots:** Em caso de falha, salva screenshots como artifact para debugging

## Relatórios

| Tipo | Onde Encontrar | O Que Mostra |
|------|---------------|-------------|
| **Terminal** | Output do `npm test` | Tabela com specs, testes passed/failed, duração |
| **Pipeline Summary** | GitHub Actions > run > Summary | Gráficos com total de testes, taxa de sucesso |
| **Allure Report** | Artifact no GitHub Actions ou `npm run allure:open` | Cenários detalhados, steps, screenshots em falha |

## Decisões Técnicas

| Decisão | Alternativa | Justificativa |
|---------|------------|---------------|
| Cypress 15 sobre 13 | Cypress 13.17 | Compatibilidade com Chrome 146+ (erro IPC no v13) |
| TypeScript sobre JavaScript | JavaScript | Tipagem estática, autocomplete, prevenção de erros |
| POM sobre Custom Commands puros | Apenas Custom Commands | Consistência com projeto Selenium, encapsulamento de seletores |
| Fixtures sobre hardcoded | Dados inline | Separação de responsabilidades, facilidade de manutenção |
| jQuery DOM manipulation | `{force: true}` | Solução mais robusta que simula o comportamento real do dropdown |
| `uncaught:exception` handler | Nenhum | Erros JS do tema Astra não são responsabilidade dos testes |
| URL base `blog.agibank.com.br` | `blogdoagi.com.br` | Evita redirect 301 que adiciona latência |
| JUnit reporter | Default reporter | Gera XML compatível com ferramentas de CI para gráficos no pipeline |
