# QA Test - Web Automation (Cypress + TypeScript)

Automação de testes para a pesquisa do Blog do Agi (https://blogdoagi.com.br/).

## Stack

| Tecnologia | Versão |
|-----------|--------|
| Cypress | 15.12.0 |
| TypeScript | 5.7.0 |
| Allure Report | 3.2.0 |
| Node.js | 20+ |

## Arquitetura

O projeto utiliza os seguintes Design Patterns:

- **Page Object Model** — encapsula elementos e ações adaptados ao Cypress
- **Custom Commands** — ações reutilizáveis (`cy.search()`)
- **Fixtures/Data-Driven** — dados de teste externalizados em JSON

Padrão **AAA (Arrange-Act-Assert)** em todos os testes.

## Cenários de Teste

| # | Cenário | Prioridade |
|---|---------|-----------|
| 1 | Pesquisa com termo válido retorna resultados | Alta |
| 2 | Pesquisa com termo inexistente exibe mensagem | Alta |
| 3 | Pesquisa com caracteres especiais não quebra | Média |
| 4 | Resultado contém título e link coerentes | Alta |

## Pré-requisitos

- Node.js 20+
- Google Chrome instalado
- Git

## Executar os Testes

```bash
# Clonar o repositório
git clone https://github.com/SEU_USUARIO/qa-test-web-cypress.git
cd qa-test-web-cypress

# Instalar dependências
npm install

# Executar testes (headless)
npm test

# Executar testes (modo interativo)
npm run cy:open

# Executar testes (headed)
npm run cy:run:headed

# Gerar relatório Allure
npm run allure:generate

# Abrir relatório
npm run allure:open
```

## Estrutura do Projeto

```
cypress/
├── e2e/           # Cenários de teste
├── fixtures/      # Dados de teste (JSON)
├── pages/         # Page Objects
├── support/       # Commands e setup
└── reports/       # Allure output
```

## CI/CD

O projeto possui pipeline GitHub Actions que:
1. Instala Node.js e dependências
2. Executa testes com Cypress em Chrome headless
3. Gera e salva o relatório Allure como artifact
4. Salva screenshots em caso de falha
