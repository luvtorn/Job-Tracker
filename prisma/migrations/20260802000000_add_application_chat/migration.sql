-- AlterTable
ALTER TABLE "users"
ADD COLUMN "preferred_locale" VARCHAR(5) NOT NULL DEFAULT 'en',
ADD COLUMN "chat_email_notifications" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "users"
ADD CONSTRAINT "users_preferred_locale_check" CHECK ("preferred_locale" IN ('en', 'pl', 'ru'));

-- CreateTable
CREATE TABLE "application_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "client_message_id" UUID NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "application_messages_content_length_check" CHECK (char_length("content") BETWEEN 1 AND 2000)
);

-- CreateTable
CREATE TABLE "application_chat_states" (
    "application_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "unread_count" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMP(3),
    "last_read_message_id" UUID,
    "scheduled_email_id" VARCHAR(255),
    "scheduled_email_at" TIMESTAMP(3),
    "scheduled_email_message_id" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_chat_states_pkey" PRIMARY KEY ("application_id","user_id"),
    CONSTRAINT "application_chat_states_unread_count_check" CHECK ("unread_count" >= 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "application_messages_sender_id_client_message_id_key" ON "application_messages"("sender_id", "client_message_id");
CREATE INDEX "application_messages_application_id_created_at_idx" ON "application_messages"("application_id", "created_at" DESC);
CREATE INDEX "application_messages_sender_id_idx" ON "application_messages"("sender_id");
CREATE INDEX "application_chat_states_user_id_unread_count_idx" ON "application_chat_states"("user_id", "unread_count");
CREATE INDEX "application_chat_states_user_id_last_message_at_idx" ON "application_chat_states"("user_id", "last_message_at" DESC);
CREATE INDEX "application_chat_states_scheduled_email_at_idx" ON "application_chat_states"("scheduled_email_at");

-- AddForeignKey
ALTER TABLE "application_messages" ADD CONSTRAINT "application_messages_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_messages" ADD CONSTRAINT "application_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_chat_states" ADD CONSTRAINT "application_chat_states_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_chat_states" ADD CONSTRAINT "application_chat_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_chat_states" ADD CONSTRAINT "application_chat_states_last_read_message_id_fkey" FOREIGN KEY ("last_read_message_id") REFERENCES "application_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "application_chat_states" ADD CONSTRAINT "application_chat_states_scheduled_email_message_id_fkey" FOREIGN KEY ("scheduled_email_message_id") REFERENCES "application_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
