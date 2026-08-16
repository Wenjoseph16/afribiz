-- DropIndex (la contrainte unique sur ownerId → un boss peut avoir N business)
DROP INDEX IF EXISTS "Business_ownerId_key";

-- L'index non-unique Business_ownerId_idx (déjà créé par @@index([ownerId])) reste en place
