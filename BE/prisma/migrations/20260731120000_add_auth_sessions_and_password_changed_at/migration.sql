-- Add passwordChangedAt to users: set whenever a password is created or changed,
-- so that access tokens issued before the change are rejected by JwtStrategy.
ALTER TABLE `users`
  ADD COLUMN `passwordChangedAt` DATETIME(3) NULL;

-- Refresh-token sessions (rotation + revocation). Only the SHA-256 hash of the
-- refresh token is stored, never the raw token.
CREATE TABLE `auth_sessions` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `refreshHash` VARCHAR(64) NOT NULL,
  `userAgent` VARCHAR(500) NULL,
  `ip` VARCHAR(64) NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `revokedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `auth_sessions_userId_idx` (`userId`),
  INDEX `auth_sessions_refreshHash_idx` (`refreshHash`),
  CONSTRAINT `auth_sessions_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
