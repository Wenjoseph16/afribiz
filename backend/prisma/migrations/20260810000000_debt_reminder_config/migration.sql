-- CreateTable
CREATE TABLE "DebtReminderConfig" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "channels" TEXT[] DEFAULT ARRAY['WHATSAPP','EMAIL']::TEXT[],
    "scheduleDays" INTEGER[] DEFAULT ARRAY[3,7,15,30]::INTEGER[],
    "maxRemindersPerDebt" INTEGER NOT NULL DEFAULT 4,
    "dueDateMessage" TEXT NOT NULL DEFAULT 'Bonjour {client} 👋, un petit rappel amical : il reste {montant} à régler chez {business} ({reference}). Vous pouvez payer en un clic ici : {lien}',
    "overdueMessage" TEXT NOT NULL DEFAULT 'Bonjour {client}, votre règlement de {montant} chez {business} ({reference}) est arrivé à échéance. Un paiement rapide protège votre confiance : {lien}',
    "criticalMessage" TEXT NOT NULL DEFAULT 'Bonjour {client}, votre dette de {montant} chez {business} ({reference}) devient urgente. Contactez-nous ou payez ici pour éviter toute gêne : {lien}',
    "paymentThanks" TEXT NOT NULL DEFAULT 'Merci {client} 🙏 ! Votre règlement de {montant} chez {business} a bien été reçu. À très vite !',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebtReminderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DebtReminderConfig_businessId_key" ON "DebtReminderConfig"("businessId");

-- AddForeignKey
ALTER TABLE "DebtReminderConfig" ADD CONSTRAINT "DebtReminderConfig_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "DebtReminder" ADD COLUMN     "metadataDay" INTEGER DEFAULT 0;
