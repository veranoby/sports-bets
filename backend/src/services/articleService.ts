import { Article } from "../models/Article";
import { User } from "../models/User"; // To check user roles and ownership
import { errors } from "../middleware/errorHandler"; // Assuming custom error handling
import { invalidatePattern } from "../config/redis"; // For cache invalidation

const articleService = {
  async delete(articleId: string, currentUser: User | undefined) {
    if (!currentUser) {
      console.error(`Article deletion failed: No current user provided for articleId: ${articleId}`);
      return { success: false, status: 401, error: "Authentication required" };
    }

    const article = await Article.findByPk(articleId);

    if (!article) {
      console.error(`Article deletion failed for articleId: ${articleId}. Article not found.`);
      return { success: false, status: 404, error: "Article not found" };
    }

    // Authorization check: Only admin or article owner can delete
    const isAdmin = currentUser.role === "admin";
    const isOwner = currentUser.id === article.author_id;

    if (!isAdmin && !isOwner) {
      console.error(`Article deletion failed for articleId: ${articleId}. User ${currentUser.id} (role: ${currentUser.role}) is not authorized.`);
      return { success: false, status: 403, error: "You are not authorized to delete this article" };
    }

    try {
      await article.destroy();
    } catch (dbError: any) {
      console.error(`Article deletion failed during database operation for articleId: ${articleId}. Error: ${dbError.message}`, dbError);
      return { success: false, status: 500, error: "Failed to delete article due to database error" };
    }

    // Invalidate caches related to articles
    await Promise.all([
      invalidatePattern('articles_list_*'),
      invalidatePattern('articles_featured_*'),
      invalidatePattern(`article_detail_${articleId}_*`)
    ]);

    return { success: true };
  },
};

export default articleService;