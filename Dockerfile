# ASOBI LAB — Railway / 永続ディスク対応ホスト向けDockerfile
#
# better-sqlite3のネイティブビルドとの相性を優先し、Alpineではなくglibc系の
# debian-slimベースを使用。devDependencies（prisma CLI, tsx）も本番イメージに
# 含めて、起動時の `prisma migrate deploy` / seed 実行をシンプルにしている
# （standalone出力+ devDependencies除外はイメージが小さくなる反面、
# ネイティブモジュールのトレース漏れで壊れやすいため、確実さを優先）。

FROM node:22-slim

WORKDIR /app

# better-sqlite3のフォールバックビルド（prebuildが使えない場合）とPrismaに必要なツール
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY . .
RUN npm ci
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

CMD ["/app/docker-entrypoint.sh"]
