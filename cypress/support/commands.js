"use strict";
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
Object.defineProperty(exports, "__esModule", { value: true });
Cypress.Commands.add('login', function (role, email, password) {
    cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: { login: email, password: password },
    }).then(function (resp) {
        // Set token in localStorage
        window.localStorage.setItem('token', resp.body.data.token);
    });
});
