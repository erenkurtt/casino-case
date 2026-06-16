# Casino Case Backend - Database & Prisma Setup Notes

## 1. Çalışma ortamı

Proje WSL Ubuntu 22.04 üzerinde çalıştırıldı.

Proje yolu:

```bash
~/casino-case/backend
```

Backend klasörüne giriş:

```bash
cd ~/casino-case/backend
```

Node paketleri WSL içinde kuruldu. Windows tarafındaki Node/CMD kullanılmadı çünkü `\\wsl.localhost\...` path’i üzerinden `npm install` çalıştırınca Prisma kurulumu `UNC paths are not supported` hatası veriyordu.

Doğru yaklaşım:

```bash
cd ~/casino-case/backend
npm install
```

---

## 2. PostgreSQL Docker kurulumu

PostgreSQL için Docker container kullanıldı.

`docker-compose.yml` dosyası:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: game-platform-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: game_platform_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d game_platform_db"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

Docker credential hatası için WSL içindeki Docker config temizlendi:

```bash
mkdir -p ~/.docker
cp ~/.docker/config.json ~/.docker/config.json.bak 2>/dev/null || true
echo '{}' > ~/.docker/config.json
```

PostgreSQL container başlatıldı:

```bash
docker-compose up -d
```

Container kontrolü:

```bash
docker ps
```

Beklenen container:

```text
game-platform-postgres
```

PostgreSQL health kontrolü:

```bash
docker inspect game-platform-postgres --format='{{json .State.Health.Status}}'
```

---

## 3. Database bağlantısı

`.env` dosyasına PostgreSQL connection string eklendi:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/game_platform_db?schema=public"
```

Bu bilgiler `docker-compose.yml` ile uyumlu:

```text
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=game_platform_db
PORT=5432
```

---

## 4. Prisma 7 yapılandırması

Projede Prisma 7 kullanıldığı için `schema.prisma` içinde `datasource.url` kullanılmadı.

Yanlış kullanım:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Doğru kullanım:

```prisma
datasource db {
  provider = "postgresql"
}
```

Database URL artık `prisma.config.ts` içinde yönetildi.

`prisma.config.ts`:

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

Gerekli Prisma/PostgreSQL paketleri:

```bash
npm install @prisma/client @prisma/adapter-pg pg
npm install -D prisma
```

Seed script çalıştırmak için:

```bash
npm install -D tsx
```

---

## 5. Database schema tasarımı

Online casino platformu için aşağıdaki entity’ler modellendi:

```text
Users
Games
Game Types
Countries
User Favorite Games
Spin History
Casinos
Game Countries
```

Ek olarak `casinos` tablosu eklendi çünkü requirement içinde şu ilişki vardı:

```text
A casino contains multiple games.
```

Temel ilişkiler:

```text
Casino 1 - N Game
GameType 1 - N Game
Country 1 - N User
Game N - N Country
User N - N Game through UserFavoriteGame
User 1 - N SpinHistory
Game 1 - N SpinHistory
```

`games` ve `countries` arasında many-to-many ilişki olduğu için ara tablo kullanıldı:

```text
game_countries
```

`users` ve `games` favori ilişkisi için ara tablo kullanıldı:

```text
user_favorite_games
```

Spin geçmişi kalıcı kayıt olarak tasarlandı:

```text
spin_history
```

---

## 6. Prisma migration

Prisma schema hazırlandıktan sonra migration çalıştırıldı:

```bash
npx prisma migrate dev --name init
```

Başarılı çıktı:

```text
Your database is now in sync with your schema.
```

Prisma Client üretildi:

```bash
npx prisma generate
```

Tabloların oluştuğunu kontrol etmek için:

```bash
docker exec -it game-platform-postgres psql -U postgres -d game_platform_db -c "\dt"
```

Beklenen tablolar:

```text
casinos
countries
game_types
games
game_countries
users
user_favorite_games
spin_history
```

---

## 7. Game JSON datası için karar

`game-data.json` dosyasındaki oyunları backend runtime’da JSON’dan okumak yerine database’e seed/import datası olarak aktarmaya karar verdik.

Sebep:

```text
Favorite games ilişkisi games tablosuna FK ile bağlanmalı.
Spin history games tablosuna FK ile bağlanmalı.
Search, filter, pagination database üzerinden yapılmalı.
Case database design istediği için oyun datası PostgreSQL’de tutulmalı.
```

JSON dosyasındaki dış sistem id’sini kaybetmemek için `Game` modeline şu alan eklendi:

```prisma
externalId Int @unique @map("external_id")
```

Provider bilgisini tutmak için:

```prisma
providerName String @map("provider_name") @db.VarChar(100)
```

Bu değişiklik sonrası migration çalıştırıldı:

```bash
npx prisma migrate dev --name add_game_external_id_and_provider
npx prisma generate
```

---

## 8. Seed yapısı

JSON dosyası şu konuma koyuldu:

```text
prisma/seed-data/game-data.json
```

Seed script dosyası:

```text
prisma/seed.ts
```

Seed script’in yaptığı işler:

```text
1. game-data.json dosyasını okur.
2. Default Casino oluşturur.
3. Slot game type oluşturur.
4. TR, GB, DE ülkelerini oluşturur.
5. JSON içindeki oyunları games tablosuna upsert eder.
6. Her oyunu default ülkelerle game_countries tablosunda ilişkilendirir.
```

Seed komutu:

```bash
npx prisma db seed
```

Beklenen sonuç:

```text
Starting database seed...
Loaded 78 games from game-data.json
Database seed completed successfully.
```

Database kontrol komutları:

```bash
docker exec -it game-platform-postgres psql -U postgres -d game_platform_db
```

PostgreSQL içinde:

```sql
SELECT COUNT(*) FROM games;
SELECT COUNT(*) FROM countries;
SELECT COUNT(*) FROM game_countries;
```

Beklenen mantık:

```text
games          = 78
countries      = 3
game_countries = 234
```

Çıkış:

```sql
\q
```

---

## 9. Prisma Studio

Database’i tarayıcıdan görmek için:

```bash
npx prisma studio
```

Genelde şu adreste açılır:

```text
http://localhost:5555
```

---

## 10. Şu ana kadar tamamlananlar

Tamamlanan işler:

```text
PostgreSQL Docker container kuruldu.
Database bağlantısı .env içine eklendi.
Prisma 7 config yapısı düzeltildi.
schema.prisma içinde casino database modeli oluşturuldu.
Migration ile tablolar PostgreSQL’e basıldı.
Game JSON datası için seed yaklaşımı seçildi.
Seed script altyapısı hazırlandı.
JSON oyun datası database’e aktarılacak hale getirildi.
```

---

## 11. Bundan sonraki adım

Database kurulumu tamamlandıktan sonra sıradaki backend geliştirme adımı:

```text
1. PrismaService oluşturmak
2. Games module/controller/service yazmak
3. GET /games endpointini PostgreSQL’den veri okuyacak şekilde yapmak
4. Search/filter/pagination eklemek
5. Favorite games endpointlerini yazmak
6. Spin history kayıt endpointini yazmak
7. Auth/JWT entegrasyonuna geçmek
```
