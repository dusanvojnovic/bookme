-- Migrate existing imageUrl to VenueImage
INSERT INTO "VenueImage" ("id", "venueId", "path", "order", "createdAt")
SELECT gen_random_uuid(), id, "imageUrl", 0, NOW()
FROM "Venue"
WHERE "imageUrl" IS NOT NULL AND "imageUrl" != '';
