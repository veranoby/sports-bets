/// <reference types="cypress" />

describe('Admin Finance & Wallet Management', () => {
  beforeEach(() => {
    // Assuming cy.login() command is defined in cypress/support/commands.ts
    // It handles logging in a user with specified role
    cy.login('admin', 'admin@test.com', 'testpassword');
  });

  // --- Test Case 1: Access Deposit Requests Page ---
  it('should allow admin to access Deposit Requests page', () => {
    cy.visit('/admin/finance/deposits');
    cy.contains('Gestión de Solicitudes de Depósito').should('be.visible');
    cy.get('table').should('exist'); // Assuming there's a table for operations
  });

  // --- Test Case 2: Approve a Deposit Request ---
  it('should allow admin to approve a pending deposit request', () => {
    // Pre-condition: A user has a pending deposit request.
    // In a real scenario, this would be seeded via API or directly in DB.
    // For this test, we assume a pending request exists.
    // Let's create one via API for robustness if possible, otherwise rely on seeding.

    // Simulate creating a pending deposit for a specific user
    // cy.request({
    //   method: 'POST',
    //   url: 'http://localhost:3001/api/wallet-operations/deposit', // Assuming API is running on 3001
    //   headers: {
    //     Authorization: `Bearer ${Cypress.env('USER_TOKEN')}` // User token obtained from login or fixture
    //   },
    //   body: {
    //     userId: 'some-user-id', // Replace with a user ID for a test user
    //     amount: 50.00,
    //     paymentProofUrl: 'http://example.com/proof.jpg'
    //   }
    // }).then((response) => {
    //   expect(response.status).to.eq(201);
    //   const operationId = response.body.data.id;

    cy.visit('/admin/finance/deposits');
    cy.contains('Gestión de Solicitudes de Depósito').should('be.visible');

    // Filter by pending requests
    cy.get('select').select('pending');
    cy.contains('Página 1 de 1').should('be.visible'); // Assuming there's only one page for pending

    // Find the first pending deposit request and click Approve
    cy.get('[data-testid^="operation-card-"]').first().within(() => {
      cy.contains('Estatus: pending').should('be.visible');
      cy.get('[data-testid="approve-button"]').click();
    });

    // Fill admin notes in the Approve modal and confirm
    cy.get('[data-testid="approve-modal"]').should('be.visible');
    cy.get('[data-testid="admin-notes-input"]').type('Aprobado por E2E test');
    cy.get('[data-testid="confirm-approve-button"]').click();

    // Verify success toast and status change
    cy.get('[data-testid="toast-success"]').should('contain', 'Solicitud de depósito aprobada exitosamente.');
    cy.get('[data-testid^="operation-card-"]').first().should('contain', 'Estatus: approved'); // Verify status updated

    // }); // End of .then for cy.request
  });

  // --- Test Case 3: Reject a Deposit Request ---
  it('should allow admin to reject a pending deposit request', () => {
    // Pre-condition: A user has a pending deposit request.
    // Similar to approve, seed if necessary.

    cy.visit('/admin/finance/deposits');
    cy.contains('Gestión de Solicitudes de Depósito').should('be.visible');
    cy.get('select').select('pending'); // Ensure we are looking at pending

    // Find the first pending deposit request and click Reject
    cy.get('[data-testid^="operation-card-"]').first().within(() => {
      cy.contains('Estatus: pending').should('be.visible');
      cy.get('[data-testid="reject-button"]').click();
    });

    // Fill rejection reason and admin notes in the Reject modal and confirm
    cy.get('[data-testid="reject-modal"]').should('be.visible');
    cy.get('[data-testid="rejection-reason-input"]').type('Rechazado por E2E test: Comprobante ilegible.');
    cy.get('[data-testid="admin-notes-input"]').type('Notas del admin para rechazo.');
    cy.get('[data-testid="confirm-reject-button"]').click();

    // Verify success toast and status change
    cy.get('[data-testid="toast-success"]').should('contain', 'Solicitud de depósito rechazada.');
    cy.get('[data-testid^="operation-card-"]').first().should('contain', 'Estatus: rejected'); // Verify status updated
  });

  // --- Test Case 4: Manual Balance Adjustment (Credit) ---
  it('should allow admin to credit a user\'s wallet balance manually', () => {
    const testUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d4e5'; // Replace with a valid test user ID
    const initialBalance = 100.00; // Assuming this user's balance. Fetch if dynamically.
    const adjustmentAmount = 25.50;
    const adjustmentReason = 'Crédito de bonificación por evento especial E2E.';

    // Set up initial state (e.g., set user's wallet balance via API/DB seeding)
    // cy.task('db:seed:user-wallet', { userId: testUserId, balance: initialBalance });

    cy.visit(`/admin/users`);
    cy.contains('Gestión de Usuarios').should('be.visible');

    // Find the test user and open their edit modal
    cy.get('[data-testid="user-management-table"]')
      .contains(testUserId) // Assuming user ID is visible in the table
      .closest('tr')
      .find('[data-testid="edit-user-button"]')
      .click();

    cy.get('[data-testid="user-modal"]').should('be.visible');

    // Navigate to "Ajuste de Saldo" tab
    cy.contains('Ajuste de Saldo').click();

    // Select Credit, enter amount and reason
    cy.get('input[type="radio"][value="credit"]').check();
    cy.get('#adjustmentAmount').clear().type(adjustmentAmount.toString());
    cy.get('#adjustmentReason').type(adjustmentReason);

    // Click Confirm Adjustment button
    cy.contains('Confirmar Ajuste').click();

    // Confirm in the modal
    cy.get('[data-testid="confirm-modal"]').should('be.visible');
    cy.get('[data-testid="confirm-button"]').click();

    // Verify success toast
    cy.get('[data-testid="toast-success"]').should('contain', 'Saldo ajustado exitosamente.');

    // Verify balance update (This might require re-fetching the user or navigating to their profile)
    // For now, we'll assume the toast confirms the action.
    // A more robust test would fetch the user's wallet balance and assert it's `initialBalance + adjustmentAmount`.
  });

  // --- Test Case 5: Manual Balance Adjustment (Debit) ---
  it('should allow admin to debit a user\'s wallet balance manually', () => {
    const testUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d4e5'; // Replace with a valid test user ID
    const initialBalance = 100.00; // Assuming this user's balance
    const adjustmentAmount = 10.00;
    const adjustmentReason = 'Débito por error de sistema E2E.';

    // Pre-condition: User has sufficient balance.
    // cy.task('db:seed:user-wallet', { userId: testUserId, balance: initialBalance });

    cy.visit(`/admin/users`);
    cy.contains('Gestión de Usuarios').should('be.visible');

    // Find the test user and open their edit modal
    cy.get('[data-testid="user-management-table"]')
      .contains(testUserId)
      .closest('tr')
      .find('[data-testid="edit-user-button"]')
      .click();

    cy.get('[data-testid="user-modal"]').should('be.visible');

    // Navigate to "Ajuste de Saldo" tab
    cy.contains('Ajuste de Saldo').click();

    // Select Debit, enter amount and reason
    cy.get('input[type="radio"][value="debit"]').check();
    cy.get('#adjustmentAmount').clear().type(adjustmentAmount.toString());
    cy.get('#adjustmentReason').type(adjustmentReason);

    // Click Confirm Adjustment button
    cy.contains('Confirmar Ajuste').click();

    // Confirm in the modal
    cy.get('[data-testid="confirm-modal"]').should('be.visible');
    cy.get('[data-testid="confirm-button"]').click();

    // Verify success toast
    cy.get('[data-testid="toast-success"]').should('contain', 'Saldo ajustado exitosamente.');
  });

  it('should prevent debit adjustment if user has insufficient balance', () => {
    const testUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d4e5'; // Replace with a valid test user ID
    const initialBalance = 5.00; // User has low balance
    const adjustmentAmount = 10.00; // Attempt to debit more than balance
    const adjustmentReason = 'Intento de débito con saldo insuficiente E2E.';

    // Pre-condition: User has insufficient balance.
    // cy.task('db:seed:user-wallet', { userId: testUserId, balance: initialBalance });

    cy.visit(`/admin/users`);
    cy.contains('Gestión de Usuarios').should('be.visible');

    // Find the test user and open their edit modal
    cy.get('[data-testid="user-management-table"]')
      .contains(testUserId)
      .closest('tr')
      .find('[data-testid="edit-user-button"]')
      .click();

    cy.get('[data-testid="user-modal"]').should('be.visible');

    // Navigate to "Ajuste de Saldo" tab
    cy.contains('Ajuste de Saldo').click();

    // Select Debit, enter amount and reason
    cy.get('input[type="radio"][value="debit"]').check();
    cy.get('#adjustmentAmount').clear().type(adjustmentAmount.toString());
    cy.get('#adjustmentReason').type(adjustmentReason);

    // Click Confirm Adjustment button
    cy.contains('Confirmar Ajuste').click();

    // Confirm in the modal
    cy.get('[data-testid="confirm-modal"]').should('be.visible');
    cy.get('[data-testid="confirm-button"]').click();

    // Verify error toast
    cy.get('[data-testid="toast-error"]').should('contain', 'Insufficient balance for debit adjustment');
    // Ensure modal is still open or navigated back
    cy.get('[data-testid="user-modal"]').should('be.visible');
  });
});

// Custom command for login (to be added to support/commands.ts)
declare global {
  namespace Cypress {
    interface Chainable {
      login(role: string, email: string, password: string): Chainable<void>;
      // Add other custom commands here
    }
  }
}
