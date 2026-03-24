# QA Test - Web Automation (Cypress + TypeScript)

Automacao de testes end-to-end para a funcionalidade de pesquisa do [Blog do Agi](https://blogdoagi.com.br/), desenvolvida como parte de um teste tecnico para QA. Este projeto complementa a versao em Selenium, demonstrando a mesma cobertura com uma abordagem moderna baseada em JavaScript.

## Sumario

- [Sobre o Projeto](#sobre-o-projeto)
- [Por Que Dois Projetos Web](#por-que-dois-projetos-web)
- [Analise da Aplicacao](#analise-da-aplicacao)
- [Cenarios de Teste](#cenarios-de-teste)
- [Arquitetura e Design Patterns](#arquitetura-e-design-patterns)
- [Stack Tecnologica](#stack-tecnologica)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pre-requisitos](#pre-requisitos)
- [Configuracao e Execucao](#configuracao-e-execucao)
- [CI/CD](#cicd)
- [Relatorios](#relatorios)
- [Decisoes Tecnicas](#decisoes-tecnicas)

---

## Sobre o Projeto

Este projeto automatiza os cenarios mais relevantes da funcionalidade de pesquisa do Blog do Agi utilizando **Cypress com TypeScript**. A abordagem prioriza velocidade de execucao, retry automatico e uma DX (Developer Experience) superior com hot-reload e time-travel debugging.

## Por Que Dois Projetos Web

A decisao de implementar a automacao Web em duas tecnologias diferentes (Selenium e Cypress) nao foi acidental:

| Aspecto | Selenium | Cypress |
|---------|----------|---------|
| **Abordagem** | Controla o browser externamente via WebDriver | Executa dentro do browser, acesso direto ao DOM |
| **Linguagem** | Java (tipagem estatica, OOP) | TypeScript (tipagem estatica, funcional) |
| **Velocidade** | Mais lento (comunicacao via HTTP) | Mais rapido (execucao in-browser) |
| **Retry** | Manual via WebDriverWait | Nativo — retry automatico em queries |
| **Debugging** | Screenshots + logs | Time-travel, snapshots do DOM |
| **Mercado** | Padrao corporativo, multi-browser real | Standard moderno, CI-first |

Ambos cobrem os **mesmos 4 cenarios**, permitindo comparar abordagens e demonstrar versatilidade.

## Analise da Aplicacao

O Blog do Agi e um site WordPress com o tema **Astra**. A funcionalidade de pesquisa segue o padrao WordPress:

- **URL original:** `https://blogdoagi.com.br/` (redireciona 301 para `https://blog.agibank.com.br/`)
- **Mecanismo:** Icone de lupa (slide-search) no header que expande um campo de busca via CSS transition
- **Comportamento:** Submissao do formulario redireciona para `?s={termo}` com resultados paginados

### Desafio Tecnico: Slide-Search do Astra

O tema Astra usa `visibility: hidden` e transicoes CSS para o campo de busca. O click nativo do Cypress no icone de busca nao ativa o dropdown de forma confiavel. A solucao adotada foi manipular o DOM via **jQuery** (disponivel nativamente no Cypress) para adicionar a classe `ast-dropdown-active` e tornar o campo visivel antes da interacao.

### Erro JS da Aplicacao

O site lanca um erro JavaScript (`astra is not defined`) que o Cypress intercepta por padrao, falhando o teste. Foi adicionado um handler `Cypress.on('uncaught:exception')` para ignorar erros da aplicacao que nao sao responsabilidade dos testes.

## Cenarios de Teste

### CT-001: Pesquisa com termo valido retorna resultados
| Campo | Descricao |
|-------|-----------|
| **Prioridade** | Alta |
| **Dados** | Termo: "automacao" (via fixture) |
| **Passos** | 1. Visitar a pagina inicial 2. Ativar o campo de busca 3. Digitar o termo e submeter |
| **Resultado esperado** | Pelo menos 1 elemento `article` e renderizado na pagina |
| **Por que e relevante** | Happy path — valida que o fluxo principal funciona end-to-end |

### CT-002: Pesquisa com termo inexistente exibe mensagem
| Campo | Descricao |
|-------|-----------|
| **Prioridade** | Alta |
| **Dados** | Termo: "xyznonexistent999" (via fixture) |
| **Passos** | 1. Visitar a pagina inicial 2. Pesquisar pelo termo |
| **Resultado esperado** | `hasNoResults()` retorna `true` e contagem de resultados e zero |
| **Por que e relevante** | Cenario negativo — garante feedback claro ao usuario quando nenhum conteudo corresponde |

### CT-003: Pesquisa com caracteres especiais nao quebra
| Campo | Descricao |
|-------|-----------|
| **Prioridade** | Media |
| **Dados** | Termo: "@#$%&" (via fixture) |
| **Passos** | 1. Visitar a pagina inicial 2. Pesquisar pelo termo |
| **Resultado esperado** | A URL contem `?s=` (pagina de resultados carregou sem erro) |
| **Por que e relevante** | Robustez — inputs inesperados nao devem causar erro 500 ou pagina quebrada |

### CT-004: Resultado contem titulo e link coerentes com o termo
| Campo | Descricao |
|-------|-----------|
| **Prioridade** | Alta |
| **Dados** | Termo: "credito" (via fixture) |
| **Passos** | 1. Visitar a pagina inicial 2. Pesquisar pelo termo 3. Verificar o primeiro resultado |
| **Resultado esperado** | O texto do titulo contem "credito" (case-insensitive) e o atributo `href` nao esta vazio |
| **Por que e relevante** | Relevancia — valida que o mecanismo de busca retorna conteudo pertinente, nao apenas qualquer resultado |

## Arquitetura e Design Patterns

### Page Object Model (POM) — Adaptado ao Cypress

Diferente do Selenium onde Page Objects retornam `WebElement`, no Cypress os Page Objects retornam **Chainable commands** que respeitam a natureza assincrona do framework.

```
BasePage
  ├── HomePage           → visit() e searchFor(term)
  └── SearchResultPage   → getResults(), hasNoResults(), getFirstResultTitle()
```

**Por que POM no Cypress:** apesar de haver debate na comunidade sobre POM em Cypress (vs. Custom Commands puros), a abordagem POM mantem consistencia com o projeto Selenium e encapsula seletores em um unico lugar.

### Custom Commands

O comando `cy.search(term)` encapsula toda a logica de ativacao do dropdown + digitacao + submissao. Pode ser usado como alternativa ao Page Object quando se quer uma abordagem mais "Cypress-nativa".

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

Os termos de busca sao externalizados em `cypress/fixtures/searchData.json`:

```json
{
  "validTerm": "automacao",
  "invalidTerm": "xyznonexistent999",
  "specialCharsTerm": "@#$%&",
  "contentValidationTerm": "credito"
}
```

**Por que:** separar dados de teste do codigo permite alterar cenarios sem modificar os testes, facilita manutencao e permite reutilizar dados em diferentes specs.

### Padrao AAA (Arrange-Act-Assert)

Mesmo padrao do projeto Selenium, adaptado a sintaxe do Cypress:

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

Diferente do Selenium onde e necessario implementar `WebDriverWait` manualmente, o Cypress re-executa automaticamente queries de DOM ate que a asseracao passe ou o timeout expire. Isso resulta em testes mais estaveis sem codigo extra.

Configuracao em `cypress.config.ts`:
```typescript
retries: {
  runMode: 2,   // CI — retenta ate 2 vezes
  openMode: 0,  // Local — sem retry para debugging
}
```

## Stack Tecnologica

| Tecnologia | Versao | Justificativa |
|-----------|--------|---------------|
| Cypress | 15.12.0 | Framework moderno, execucao in-browser, retry nativo, time-travel debug |
| TypeScript | 5.7.0 | Tipagem estatica, autocomplete, prevencao de erros em tempo de compilacao |
| Allure Report | 3.2.0 | Relatorios visuais consistentes com o projeto Selenium |
| Node.js | 20+ | Runtime LTS, compativel com Cypress 15 |

## Estrutura do Projeto

```
qa-test-web-cypress/
├── .github/workflows/test.yml          # Pipeline CI/CD
├── cypress.config.ts                   # Configuracao do Cypress (base URL, timeouts, retries)
├── package.json                        # Dependencias e scripts npm
├── tsconfig.json                       # Configuracao TypeScript
├── cypress/
│   ├── e2e/
│   │   └── search.cy.ts               # 4 cenarios de teste (AAA pattern)
│   ├── fixtures/
│   │   └── searchData.json            # Dados de teste externalizados
│   ├── pages/
│   │   ├── BasePage.ts                # Classe base — title, URL
│   │   ├── HomePage.ts               # Page Object — navegacao + pesquisa
│   │   └── SearchResultPage.ts       # Page Object — verificacoes de resultado
│   ├── support/
│   │   ├── commands.ts               # Custom command cy.search()
│   │   ├── e2e.ts                    # Setup global + uncaught exception handler
│   │   └── index.d.ts               # Tipagens dos custom commands
│   └── reports/
│       └── .gitkeep
└── README.md
```

## Pre-requisitos

- **Node.js 20+** — [Download](https://nodejs.org/)
- **Google Chrome** — [Download](https://www.google.com/chrome/)
- **Git** — [Download](https://git-scm.com/)

## Configuracao e Execucao

```bash
# 1. Clonar o repositorio
git clone https://github.com/filipeCardorso/qa-test-web-cypress.git
cd qa-test-web-cypress

# 2. Instalar dependencias
npm install

# 3. Executar testes (headless)
npm test

# 4. Executar testes (modo interativo com time-travel debug)
npm run cy:open

# 5. Executar testes (headed — abre o browser)
npm run cy:run:headed

# 6. Gerar relatorio Allure
npm run allure:generate

# 7. Abrir relatorio no browser
npm run allure:open
```

### Scripts Disponiveis

| Script | Comando | Descricao |
|--------|---------|-----------|
| `npm test` | `cypress run --browser chrome` | Execucao headless (CI) |
| `npm run cy:open` | `cypress open` | Modo interativo com UI |
| `npm run cy:run:headed` | `cypress run --browser chrome --headed` | Execucao com browser visivel |
| `npm run allure:generate` | `allure generate ...` | Gera relatorio HTML |
| `npm run allure:open` | `allure open ...` | Abre relatorio no browser |

## CI/CD

O projeto possui pipeline **GitHub Actions** que executa automaticamente a cada push ou pull request:

1. **Setup:** Configura Node.js 20 e instala dependencias via `npm ci`
2. **Testes:** Executa Cypress em Chrome headless via `cypress-io/github-action`
3. **Relatorio de Resultados:** Publica graficos com contagem de testes no Summary da pipeline (JUnit XML reporter)
4. **Allure Report:** Gera e publica em GitHub Pages
5. **Screenshots:** Em caso de falha, salva screenshots como artifact para debugging

### Relatorio Online

Apos cada execucao, o Allure Report fica disponivel em:
**https://filipecardorso.github.io/qa-test-web-cypress/allure-report**

## Relatorios

| Tipo | Onde Encontrar | O Que Mostra |
|------|---------------|-------------|
| **Terminal** | Output do `npm test` | Tabela com specs, testes passed/failed, duracao |
| **Pipeline Summary** | GitHub Actions > run > Summary | Graficos com total de testes, taxa de sucesso |
| **Allure Report** | GitHub Pages ou `npm run allure:open` | Cenarios detalhados, steps, screenshots em falha |

## Decisoes Tecnicas

| Decisao | Alternativa | Justificativa |
|---------|------------|---------------|
| Cypress 15 sobre 13 | Cypress 13.17 | Compatibilidade com Chrome 146+ (IPC error no v13) |
| TypeScript sobre JavaScript | JavaScript | Tipagem estatica, autocomplete, prevencao de erros |
| POM sobre Custom Commands puros | Apenas Custom Commands | Consistencia com projeto Selenium, encapsulamento de seletores |
| Fixtures sobre hardcoded | Dados inline | Separacao de responsabilidades, facilidade de manutencao |
| jQuery DOM manipulation | `{force: true}` | Solucao mais robusta que simula o comportamento real do dropdown |
| `uncaught:exception` handler | Nenhum | Erros JS do tema Astra nao sao responsabilidade dos testes |
| URL base `blog.agibank.com.br` | `blogdoagi.com.br` | Evita redirect 301 que adiciona latencia |
| JUnit reporter | Default reporter | Gera XML compativel com ferramentas de CI para graficos no pipeline |
