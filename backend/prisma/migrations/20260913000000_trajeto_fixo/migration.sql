-- CreateEnum
CREATE TYPE "StatusTrajetoFixo" AS ENUM ('ATIVO', 'INATIVO');

-- CreateTable
CREATE TABLE "TrajetoFixo" (
    "id" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" "StatusTrajetoFixo" NOT NULL DEFAULT 'ATIVO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrajetoFixo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrajetoFixo_origem_destino_key" ON "TrajetoFixo"("origem", "destino");
