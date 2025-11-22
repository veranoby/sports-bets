"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cypress_1 = require("cypress");
exports.default = (0, cypress_1.defineConfig)({
    e2e: {
        baseUrl: 'http://localhost:5173',
        setupNodeEvents: function (on, config) {
            // implement node event listeners here
        },
        specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
        supportFile: 'cypress/support/commands.ts',
        viewportWidth: 1280,
        viewportHeight: 720,
        chromeWebSecurity: false,
        retries: {
            runMode: 2,
            openMode: 1
        },
        env: {
            apiUrl: 'http://localhost:3001/api',
            testUser: {
                email: 'testuser@example.com',
                password: 'password123'
            }
        }
    },
});
