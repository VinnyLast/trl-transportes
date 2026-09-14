-- CreateEnum
CREATE TYPE "TipoVeiculo" AS ENUM ('TOCO', 'TRES_QUARTOS', 'OUTRO');

-- AlterTable: adiciona o tipo do veiculo
ALTER TABLE "Veiculo" ADD COLUMN "tipo" "TipoVeiculo" NOT NULL DEFAULT 'OUTRO';

-- AlterTable: troca o valor unico do trajeto fixo por um valor por tipo de veiculo
ALTER TABLE "TrajetoFixo" ADD COLUMN "valorToco" DECIMAL(10,2);
ALTER TABLE "TrajetoFixo" ADD COLUMN "valorTresQuartos" DECIMAL(10,2);

-- Migra o valor antigo (se existir algum registro) para o campo Toco, so para nao perder dado
UPDATE "TrajetoFixo" SET "valorToco" = "valor" WHERE "valor" IS NOT NULL;

ALTER TABLE "TrajetoFixo" DROP COLUMN "valor";
