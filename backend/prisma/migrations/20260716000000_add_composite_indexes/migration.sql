-- CreateIndex
CREATE INDEX "Booking_clientId_status_startDate_idx" ON "Booking"("clientId", "status", "startDate");

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "Order_buyerId_status_createdAt_idx" ON "Order"("buyerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "User_email_isActive_idx" ON "User"("email", "isActive");
