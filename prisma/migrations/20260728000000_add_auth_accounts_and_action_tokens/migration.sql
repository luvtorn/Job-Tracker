CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'GITHUB');
CREATE TYPE "AuthActionType" AS ENUM ('VERIFY_EMAIL', 'PASSWORD_RESET');

ALTER TABLE "users"
ALTER COLUMN "password_hash" DROP NOT NULL;

CREATE TABLE "auth_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider" "AuthProvider" NOT NULL,
    "provider_account_id" VARCHAR(255) NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_action_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_hash" VARCHAR(64) NOT NULL,
    "type" "AuthActionType" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_action_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_accounts_provider_provider_account_id_key"
ON "auth_accounts"("provider", "provider_account_id");

CREATE UNIQUE INDEX "auth_accounts_user_id_provider_key"
ON "auth_accounts"("user_id", "provider");

CREATE INDEX "auth_accounts_user_id_idx"
ON "auth_accounts"("user_id");

CREATE UNIQUE INDEX "auth_action_tokens_token_hash_key"
ON "auth_action_tokens"("token_hash");

CREATE INDEX "auth_action_tokens_user_id_type_idx"
ON "auth_action_tokens"("user_id", "type");

CREATE INDEX "auth_action_tokens_expires_at_idx"
ON "auth_action_tokens"("expires_at");

ALTER TABLE "auth_accounts"
ADD CONSTRAINT "auth_accounts_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "auth_action_tokens"
ADD CONSTRAINT "auth_action_tokens_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
