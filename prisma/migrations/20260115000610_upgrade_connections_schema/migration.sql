/*
  Warnings:

  - You are about to drop the column `accessToken` on the `Connection` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `Connection` table. All the data in the column will be lost.
  - You are about to drop the column `scopes` on the `Connection` table. All the data in the column will be lost.
  - The `status` column on the `Connection` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[organizationId,provider,name]` on the table `Connection` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Connection` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `provider` on the `Connection` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('SHOPIFY', 'WOOCOMMERCE', 'GOOGLE_ADS', 'META_ADS', 'TIKTOK_ADS', 'GA4');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('ACTIVE', 'DISABLED', 'ERROR');

-- AlterTable
ALTER TABLE "Connection" DROP COLUMN "accessToken",
DROP COLUMN "refreshToken",
DROP COLUMN "scopes",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "credentialsEncrypted" TEXT,
ADD COLUMN     "lastTestAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "provider",
ADD COLUMN     "provider" "Provider" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ConnectionStatus" NOT NULL DEFAULT 'DISABLED';

-- CreateIndex
CREATE UNIQUE INDEX "Connection_organizationId_provider_name_key" ON "Connection"("organizationId", "provider", "name");
