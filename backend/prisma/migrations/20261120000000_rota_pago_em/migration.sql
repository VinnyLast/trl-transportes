-- AlterTable: data de pagamento da rota (nulo = pendente); nao altera dados existentes
ALTER TABLE "Rota" ADD COLUMN "pagoEm" TIMESTAMP(3);
