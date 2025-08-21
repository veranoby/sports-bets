import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { query, validationResult } from "express-validator";

const router = Router();

// Ad spaces configuration
const adSpaces = [
  {
    id: "header",
    name: "Header Banner",
    location: "header",
    size: "banner",
    description: "Banner ad displayed in the main header",
    active: true
  },
  {
    id: "sidebar",
    name: "Sidebar Ad",
    location: "sidebar", 
    size: "medium",
    description: "Advertisement in the sidebar area",
    active: true
  },
  {
    id: "article-top",
    name: "Article Top",
    location: "article-top",
    size: "large", 
    description: "Advertisement at the top of articles",
    active: true
  },
  {
    id: "article-bottom",
    name: "Article Bottom",
    location: "article-bottom",
    size: "large",
    description: "Advertisement at the bottom of articles", 
    active: true
  },
  {
    id: "dashboard-top",
    name: "Dashboard Top",
    location: "dashboard-top",
    size: "banner",
    description: "Banner ad on user dashboard",
    active: true
  },
  {
    id: "content-middle", 
    name: "Content Middle",
    location: "content-middle",
    size: "medium",
    description: "Advertisement in the middle of content",
    active: false
  }
];

// GET /api/ads/spaces - Get available advertising spaces
router.get(
  "/spaces",
  [
    query("active").optional().isBoolean(),
    query("location").optional().isString(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid parameters",
        errors: errors.array()
      });
    }

    const { active, location } = req.query;
    let filteredSpaces = [...adSpaces];

    // Filter by active status
    if (active !== undefined) {
      filteredSpaces = filteredSpaces.filter(space => 
        space.active === (active === 'true')
      );
    }

    // Filter by location
    if (location) {
      filteredSpaces = filteredSpaces.filter(space => 
        space.location === location
      );
    }

    res.json({
      success: true,
      data: {
        spaces: filteredSpaces,
        total: filteredSpaces.length
      }
    });
  })
);

// GET /api/ads/config - Get ads configuration for frontend
router.get(
  "/config", 
  asyncHandler(async (req, res) => {
    // In production, this would return actual ad configuration
    // For now, return basic config for ad spaces
    const activeSpaces = adSpaces.filter(space => space.active);
    
    res.json({
      success: true,
      data: {
        enabled: true,
        spaces: activeSpaces.map(space => ({
          id: space.id,
          location: space.location,
          size: space.size
        })),
        refreshInterval: 30000, // 30 seconds
        loadTimeout: 5000 // 5 seconds
      }
    });
  })
);

// POST /api/ads/impression - Track ad impression (for analytics)
router.post(
  "/impression",
  [
    query("spaceId").isString(),
    query("location").optional().isString(),
    query("userId").optional().isUUID(),
  ],
  asyncHandler(async (req, res) => {
    const { spaceId, location, userId } = req.body;
    
    // In production, this would track impressions in analytics
    console.log(`Ad impression tracked:`, {
      spaceId,
      location,
      userId,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: "Impression tracked"
    });
  })
);

export default router;