describe('Admin Articles Management', () => {
  beforeEach(() => {
    // Login as admin user
    cy.login('admin', 'admin@test.com', 'testpassword')
    cy.visit('/admin/articles')
  })

  it('should display articles management page', () => {
    cy.get('[data-testid="admin-layout"]').should('exist')
    cy.get('[data-testid="articles-page"]').should('exist')
    cy.contains('Article Management').should('be.visible')
  })

  it('should allow admin to create a new article', () => {
    cy.get('[data-testid="create-article-btn"]').click()
    
    // Fill article form
    cy.get('[data-testid="article-title"]').type('Test Article Title')
    cy.get('[data-testid="article-content"]').type('This is a test article content with some meaningful text.')
    
    // Submit form
    cy.get('[data-testid="submit-article"]').click()
    
    // Verify article was created
    cy.get('[data-testid="success-message"]').should('contain', 'Article created successfully')
    cy.get('[data-testid="articles-table"]').should('contain', 'Test Article Title')
  })

  it('should allow admin to publish an article', () => {
    // First create an article (assuming it exists or create one)
    const articleTitle = 'Article to Publish'
    
    // Find the article in the table
    cy.get('[data-testid="articles-table"]')
      .contains(articleTitle)
      .closest('tr')
      .within(() => {
        // Check initial status
        cy.get('[data-testid="article-status"]').should('contain', 'draft')
        
        // Click publish button
        cy.get('[data-testid="publish-btn"]').click()
      })
    
    // Confirm publish action
    cy.get('[data-testid="confirm-publish"]').click()
    
    // Verify status changed
    cy.get('[data-testid="articles-table"]')
      .contains(articleTitle)
      .closest('tr')
      .within(() => {
        cy.get('[data-testid="article-status"]').should('contain', 'published')
      })
  })

  it('should validate required fields when creating article', () => {
    cy.get('[data-testid="create-article-btn"]').click()
    
    // Try to submit without filling required fields
    cy.get('[data-testid="submit-article"]').click()
    
    // Verify validation errors
    cy.get('[data-testid="title-error"]').should('contain', 'Title is required')
    cy.get('[data-testid="content-error"]').should('contain', 'Content is required')
  })

  it('should sanitize dangerous content in articles', () => {
    cy.get('[data-testid="create-article-btn"]').click()
    
    // Input potentially dangerous content
    const maliciousContent = '<script>alert("XSS")</script><p>Safe content</p>'
    
    cy.get('[data-testid="article-title"]').type('XSS Test Article')
    cy.get('[data-testid="article-content"]').type(maliciousContent)
    
    cy.get('[data-testid="submit-article"]').click()
    
    // Verify article was created but content was sanitized
    cy.get('[data-testid="success-message"]').should('contain', 'Article created successfully')
    
    // Check that the article content is sanitized (no script tags)
    cy.get('[data-testid="articles-table"]')
      .contains('XSS Test Article')
      .closest('tr')
      .within(() => {
        cy.get('[data-testid="article-preview"]').should('not.contain', '<script>')
        cy.get('[data-testid="article-preview"]').should('contain', 'Safe content')
      })
  })

  it('should show different actions based on article status', () => {
    // Test draft article actions
    cy.get('[data-testid="articles-table"] tbody tr').first().within(() => {
      cy.get('[data-testid="article-status"]').then(($status) => {
        if ($status.text().includes('draft')) {
          cy.get('[data-testid="publish-btn"]').should('be.visible')
          cy.get('[data-testid="edit-btn"]').should('be.visible')
          cy.get('[data-testid="delete-btn"]').should('be.visible')
        } else if ($status.text().includes('published')) {
          cy.get('[data-testid="unpublish-btn"]').should('be.visible')
          cy.get('[data-testid="edit-btn"]').should('be.visible')
        }
      })
    })
  })

  it('should filter articles by status', () => {
    // Test status filter
    cy.get('[data-testid="status-filter"]').select('published')
    cy.get('[data-testid="articles-table"] tbody tr').each(($row) => {
      cy.wrap($row).find('[data-testid="article-status"]').should('contain', 'published')
    })

    cy.get('[data-testid="status-filter"]').select('draft')
    cy.get('[data-testid="articles-table"] tbody tr').each(($row) => {
      cy.wrap($row).find('[data-testid="article-status"]').should('contain', 'draft')
    })
  })

  it('should handle article deletion', () => {
    const articleToDelete = 'Article to Delete'
    
    cy.get('[data-testid="articles-table"]')
      .contains(articleToDelete)
      .closest('tr')
      .within(() => {
        cy.get('[data-testid="delete-btn"]').click()
      })
    
    // Confirm deletion
    cy.get('[data-testid="confirm-delete"]').click()
    
    // Verify article was deleted
    cy.get('[data-testid="success-message"]').should('contain', 'Article deleted successfully')
    cy.get('[data-testid="articles-table"]').should('not.contain', articleToDelete)
  })
})

// Custom command for login (to be added to support/commands.ts)
declare global {
  namespace Cypress {
    interface Chainable {
      login(role: string, email: string, password: string): Chainable<void>
    }
  }
}