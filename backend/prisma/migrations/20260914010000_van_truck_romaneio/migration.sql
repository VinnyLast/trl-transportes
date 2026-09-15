-- AlterEnum: adiciona novos tipos de veiculo (nao afeta veiculos ja cadastrados)
ALTER TYPE "TipoVeiculo" ADD VALUE 'VAN';
ALTER TYPE "TipoVeiculo" ADD VALUE 'TRUCK';

-- AlterTable: novas colunas de valor por tipo, todas opcionais
ALTER TABLE "TrajetoFixo" ADD COLUMN "valorVan" DECIMAL(10,2);
ALTER TABLE "TrajetoFixo" ADD COLUMN "valorTruck" DECIMAL(10,2);

-- AlterTable: campo para guardar o caminho do arquivo da foto do romaneio
ALTER TABLE "Rota" ADD COLUMN "fotoRomaneio" TEXT;
