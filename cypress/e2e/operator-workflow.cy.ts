describe('Operator Workflow', () => {
  beforeEach(() => {
    // This is a placeholder for test data setup.
    // In a real scenario, we would use cy.exec() or cy.request()
    // to seed the database with an operator, events, and users.
    // For now, we assume the data exists.

    // For example:
    // cy.task('db:seed:operator-workflow');

    // Login as operator
    cy.login('operator', 'operator@test.com', 'testpassword');
    cy.visit('/admin');
  });

  it('should display a restricted navigation menu for operators', () => {
    cy.get('[data-testid="admin-sidebar"]').should('exist');

    // Items that should be visible
    cy.contains('Dashboard').should('be.visible');
    cy.contains('Eventos').should('be.visible');
    cy.contains('Usuarios').should('be.visible');
    cy.contains('Galleras').should('be.visible');
    cy.contains('Monitoreo').should('be.visible');

    // Items that should be hidden
    cy.contains('Noticias').should('not.exist');
    cy.contains('Solicitudes').should('not.exist');
    cy.contains('Finanzas').should('not.exist');
  });

  it('should display only assigned events in the event management page', () => {
    cy.visit('/admin/events');
    cy.get('[data-testid="events-table"]').should('exist');

    // Assuming the table contains event names
    cy.contains('Assigned Event').should('be.visible');
    cy.contains('Unassigned Event').should('not.exist');
  });

  it('should display only venue and gallera users in the user management page', () => {
    cy.visit('/admin/users');
    cy.get('[data-testid="user-management-table"]').should('exist');

    // Check for allowed user roles
    cy.get('tbody').contains('venue-user').should('be.visible');
    cy.get('tbody').contains('gallera-user').should('be.visible');

    // Check for disallowed user roles
    cy.get('tbody').contains('admin-user').should('not.exist');
    cy.get('tbody').contains('another-operator').should('not.exist');
  });

  it('should not allow access to admin-only pages', () => {
    cy.visit('/admin/finance', { failOnStatusCode: false });
    cy.contains('Forbidden').should('be.visible'); // Or check for a redirect
  });
});
