import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  globalSearch,
  listRecentSearches,
  saveRecentSearch,
} from "../controllers/search.controller";

const router = Router();

router.use(requireAuth);
router.get("/recent", listRecentSearches);
router.post("/recent", saveRecentSearch);
router.get("/", globalSearch);

export default router;
