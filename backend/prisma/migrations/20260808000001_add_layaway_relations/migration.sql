-- AddForeignKey
ALTER TABLE "LayawayPlan" ADD CONSTRAINT "LayawayPlan_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "LayawayOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LayawayContribution" ADD CONSTRAINT "LayawayContribution_planId_fkey" FOREIGN KEY ("planId") REFERENCES "LayawayPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
