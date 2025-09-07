// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

Cypress.Commands.add('login', (role, email, password) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: { login: email, password },
  }).then((resp) => {
    // Set token in localStorage
    window.localStorage.setItem('token', resp.body.data.token);
  });
});

// Add type definition for the custom command
declare global {
  namespace Cypress {
    interface Chainable {
      login(role: string, email: string, password: string): Chainable<void>
    }
  }
}

// To make this file a module
export {};
