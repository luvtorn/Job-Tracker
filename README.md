# JobTracker

JobTracker — fullstack SaaS-приложение для управления поиском работы и процессом найма.
Сикеры могут находить вакансии, отслеживать отклики, хранить документы и готовиться к интервью. Рекрутеры могут публиковать вакансии, управлять кандидатами, назначать интервью и анализировать воронку найма.

Проект создаётся как production-oriented приложение с разделением бизнес-логики, строгой типизацией, проверкой входных данных, ролевой авторизацией и полноценной локализацией.

> Статус: активная разработка. Основные сценарии поиска работы, рекрутинга, календаря и workspace реализованы. Google/GitHub OAuth, Google Meet и браузерная AI-платформа находятся в roadmap и пока не являются частью production-функциональности.

## Содержание

- [Возможности](#возможности)
- [Технологии](#технологии)
- [Архитектура](#архитектура)
- [Модель данных](#модель-данных)
- [Установка и запуск](#установка-и-запуск)
- [Переменные окружения](#переменные-окружения)
- [Работа с базой данных](#работа-с-базой-данных)
- [API](#api)
- [Авторизация и безопасность](#авторизация-и-безопасность)
- [Локализация](#локализация)
- [Тестирование](#тестирование)
- [Production deployment](#production-deployment)
- [Roadmap](#roadmap)
- [Ограничения текущей версии](#ограничения-текущей-версии)

## Возможности

### Для сикера

- регистрация и вход по email и паролю;
- просмотр опубликованных вакансий;
- поиск и фильтрация вакансий;
- добавление вакансий в избранное;
- отправка отклика;
- просмотр истории и статуса откликов;
- отображение назначенных интервью;
- персональный календарь;
- создание собственных событий, дедлайнов и follow-up;
- загрузка резюме и сопроводительного письма;
- просмотр PDF и DOCX;
- управление компаниями и контактами;
- заметки, теги и напоминания;
- персональная статистика и графики;
- уведомления в реальном времени;
- редактирование профиля и аватара.

### Для рекрутера

- создание и редактирование вакансий;
- lifecycle вакансии: `DRAFT`, `PUBLISHED`, `CLOSED`, `ARCHIVED`;
- поиск, сортировка и фильтрация собственных вакансий;
- просмотр кандидатов по выбранной вакансии;
- открытие профиля кандидата и приложенных документов;
- изменение статуса отклика;
- назначение и перенос интервью;
- удаление интервью с выбором следующего статуса;
- общий календарь интервью и личных событий;
- dashboard с основными метриками;
- статистика по вакансиям и воронке найма;
- уведомления о новых откликах и изменениях.

### Общие возможности

- адаптивный интерфейс;
- роли `SEEKER`, `RECRUITER` и служебная роль `ADMIN`;
- языки `en`, `pl`, `ru`;
- локализованные даты, время, числа и относительное время;
- loading, empty и error states;
- accessibility-подписи и клавиатурная навигация;
- защищённые API и проверка доступа к каждому ресурсу.

## Интервью и календарь

Интервью представлено одним `CalendarEvent`, связанным с откликом через уникальный `applicationId`.

Это гарантирует, что:

- одно назначенное интервью создаёт одно событие;
- повторное назначение обновляет существующее событие;
- перенос не создаёт дубликат;
- интервью одинаково отображается рекрутеру и кандидату;
- напрямую изменить или удалить interview-event через API обычных событий нельзя;
- удаление интервью выполняется через API отклика;
- собственные календарные события можно создавать, редактировать и удалять отдельно.

Поддерживаемые типы событий:

```text
INTERVIEW
MEETING
DEADLINE
FOLLOW_UP
NOTE
OTHER
```

Время события хранится как точный UTC-момент. Клиент отправляет `scheduledAt` с timezone offset, а интерфейс показывает время в локали пользователя.

## Документы

Сикер может хранить два актуальных типа документов:

- `RESUME`;
- `COVER_LETTER`.

Ограничения:

- поддерживаются PDF и DOCX;
- максимальный размер файла — 10 MB;
- файлы загружаются в приватное authenticated-хранилище Cloudinary;
- доступ к содержимому выдаётся через сервер после проверки владельца;
- рекрутер может открыть документ только кандидата, который откликнулся на его вакансию;
- при загрузке новой версии предыдущая перестаёт быть текущей.

## Технологии

### Frontend

- Next.js 16 App Router;
- React 19;
- TypeScript;
- Tailwind CSS;
- shadcn/ui и Radix UI;
- TanStack Query;
- React Hook Form;
- Zod;
- Framer Motion;
- React Big Calendar;
- Recharts;
- next-intl;
- date-fns.

### Backend

- Next.js Route Handlers;
- Prisma ORM 7;
- PostgreSQL / Neon;
- JWT access tokens;
- rotating refresh tokens;
- HttpOnly cookies;
- bcrypt;
- Zod validation;
- Server-Sent Events для уведомлений;
- Cloudinary для приватного хранения документов и аватаров.

### Инструменты качества

- ESLint;
- TypeScript strict mode;
- Node test runner через `tsx`;
- architecture и security regression tests;
- опциональный browser smoke через Playwright runtime.

## Архитектура

Проект следует направлению Clean Architecture:

```mermaid
flowchart TD
    UI["Pages и React components"] --> API["Next.js Route Handlers"]
    API --> Validation["Zod validation и authorization"]
    Validation --> Services["Services и workflow services"]
    Services --> Repositories["Repositories"]
    Repositories --> Prisma["Prisma ORM"]
    Prisma --> DB["PostgreSQL / Neon"]
    Services --> External["Cloudinary и другие внешние сервисы"]
```

Основные правила:

- Route Handler отвечает только за auth, validation, вызов сервиса и HTTP response;
- бизнес-логика находится в services;
- Prisma-запросы находятся в repositories;
- сложные операции выполняются транзакционно;
- UI не обращается к базе напрямую;
- каждый изменяемый body, query и route param проверяется через Zod;
- ошибки API имеют единый безопасный формат.

### Структура проекта

```text
job-tracker/
├── prisma/
│   ├── migrations/            # Версионируемые миграции PostgreSQL
│   └── schema.prisma          # Модель данных
├── scripts/
│   └── browser-smoke.mjs      # Read-only браузерная проверка
├── docs/
│   └── testing.md             # Дополнительная документация тестов
├── src/
│   ├── app/                   # Next.js pages, layouts и API routes
│   ├── components/            # Общие UI-компоненты
│   ├── features/              # UI и client logic отдельных функций
│   ├── hooks/                 # Общие React hooks
│   ├── i18n/                  # Конфигурация и словари en/pl/ru
│   ├── lib/                   # Prisma client и общая инфраструктура
│   ├── server/
│   │   ├── architecture/      # Architecture regression tests
│   │   ├── auth/              # Cookie helpers
│   │   ├── config/            # Environment и внешние сервисы
│   │   ├── errors/            # Централизованные ошибки
│   │   ├── middleware/        # Authentication и role guards
│   │   ├── repositories/      # Доступ к данным
│   │   ├── security/          # CSRF, rate limit и headers
│   │   ├── services/          # Бизнес-логика
│   │   └── validators/        # Zod schemas
│   ├── types/                 # Общие TypeScript-типы
│   └── utils/                 # Общие утилиты
├── ROADMAP.md
├── next.config.ts
├── prisma.config.ts
└── package.json
```

## Модель данных

Основные сущности:

| Модель | Назначение |
|---|---|
| `User` | Пользователь, роль, профиль и настройки |
| `RefreshToken` | Хешированные refresh-сессии |
| `Vacancy` | Вакансия рекрутера |
| `Application` | Отклик с текущим статусом и данными интервью |
| `CalendarEvent` | Интервью и пользовательские события |
| `Document` | Резюме или сопроводительное письмо |
| `ApplicationDocument` | Документ, зафиксированный для конкретного отклика |
| `Company` | Компания в workspace сикера |
| `Contact` | Профессиональный контакт |
| `ApplicationNote` | Заметка, связанная с откликом |
| `Tag` / `ApplicationTag` | Пользовательские теги откликов |
| `Reminder` | Напоминание, опционально связанное с откликом |
| `Wishlist` | Сохранённая вакансия |
| `Notification` | Уведомление пользователя |

Статусы отклика:

```text
APPLIED
INTERVIEWING
REJECTED
OFFER
ACCEPTED
WITHDRAWN
```

## Установка и запуск

### Требования

- Node.js;
- npm;
- PostgreSQL или Neon;
- аккаунт Cloudinary;
- Git.

### 1. Клонирование

```bash
git clone <repository-url>
cd job-tracker
```

### 2. Установка зависимостей

```bash
npm ci
```

Если lock-файл отсутствует:

```bash
npm install
```

### 3. Настройка окружения

Создайте `.env` в корне проекта. Prisma CLI загружает именно этот файл через `dotenv/config`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
JWT_SECRET="replace-with-a-long-random-secret"
ADMIN_API_KEY="replace-with-a-separate-random-secret"

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

Не добавляйте `.env`, `.env.local` или реальные секреты в Git.

### 4. Применение миграций

Для локальной разработки:

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Запуск

```bash
npm run dev
```

Приложение будет доступно по адресу:

```text
http://localhost:3000
```

В проекте нет обязательных seed-пользователей: создайте аккаунт через `/auth/register`.

## Переменные окружения

| Переменная | Обязательна | Назначение |
|---|---:|---|
| `DATABASE_URL` | Да | PostgreSQL connection string |
| `JWT_SECRET` | Да | Подпись access JWT |
| `ADMIN_API_KEY` | Для cleanup cron | Bearer token для служебной очистки вакансий |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Да | Имя Cloudinary cloud |
| `CLOUDINARY_API_KEY` | Да | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Да | Cloudinary API secret |
| `TEST_DATABASE_URL` | Для integration tests | Отдельная тестовая PostgreSQL-база |
| `E2E_BASE_URL` | Опционально | URL для browser smoke |
| `PLAYWRIGHT_NODE_PATH` | Опционально | Путь к внешнему Playwright runtime |
| `PLAYWRIGHT_EXECUTABLE_PATH` | Опционально | Путь к Chromium/Edge executable |

`TEST_DATABASE_URL` должна содержать `test` в имени базы или ветки. Защитная проверка не позволяет integration tests случайно очистить development или production базу.

## Работа с базой данных

Создание migration:

```bash
npx prisma migrate dev --name migration_name
```

Генерация Prisma Client:

```bash
npx prisma generate
```

Применение существующих migrations в production:

```bash
npx prisma migrate deploy
```

Открытие Prisma Studio:

```bash
npx prisma studio
```

Схему базы нельзя изменять вручную. Любое изменение должно оформляться новой Prisma migration.

## API

Все приватные endpoints используют HttpOnly cookies. Успешные ответы обычно имеют вид:

```json
{
  "success": true
}
```

Ошибки:

```json
{
  "success": false,
  "message": "Safe public error message"
}
```

### Authentication

| Method | Endpoint | Описание |
|---|---|---|
| `POST` | `/api/auth/register` | Регистрация SEEKER или RECRUITER |
| `POST` | `/api/auth/login` | Вход и создание сессии |
| `POST` | `/api/auth/refresh` | Ротация refresh token |
| `POST` | `/api/auth/logout` | Завершение текущей сессии |
| `GET` | `/api/auth/me` | Текущий пользователь |
| `PATCH` | `/api/auth/profile` | Обновление профиля |
| `POST` | `/api/auth/avatar` | Загрузка аватара |

### Public jobs

| Method | Endpoint | Описание |
|---|---|---|
| `GET` | `/api/jobs` | Список опубликованных вакансий |
| `GET` | `/api/jobs/:id` | Публичная карточка вакансии |

### Applications

| Method | Endpoint | Доступ | Описание |
|---|---|---|---|
| `GET` | `/api/applications` | Seeker | Собственные отклики |
| `POST` | `/api/applications` | Seeker | Новый отклик |
| `GET` | `/api/applications/stats` | Seeker | Статистика откликов |
| `PATCH` | `/api/applications/:id/status` | Recruiter | Изменение статуса кандидата |
| `PATCH` | `/api/applications/:id/interview` | Recruiter | Назначение или перенос интервью |
| `DELETE` | `/api/applications/:id/interview` | Recruiter | Удаление интервью |
| `GET` | `/api/applications/:id/candidate-profile` | Recruiter | Доступный профиль кандидата |

### Vacancies and candidates

| Method | Endpoint | Описание |
|---|---|---|
| `GET` / `POST` | `/api/vacancies` | Список и создание вакансий рекрутера |
| `GET` / `PATCH` / `DELETE` | `/api/vacancies/:id` | Работа с одной вакансией |
| `PATCH` | `/api/vacancies/:id/status` | Изменение lifecycle-статуса |
| `GET` | `/api/vacancies/:id/candidates` | Кандидаты доступной вакансии |
| `GET` | `/api/recruiter/dashboard/metrics` | Метрики dashboard |
| `GET` | `/api/recruiter/interviews` | Интервью рекрутера |
| `GET` | `/api/recruiter/statistics` | Аналитика рекрутера |

Страница `/candidates?vacancyId=<id>` предварительно выбирает доступную вакансию. Неизвестный или чужой ID безопасно заменяется первой доступной вакансией.

### Calendar

| Method | Endpoint | Описание |
|---|---|---|
| `GET` | `/api/calendar/events?month=7&year=2026` | События за месяц |
| `POST` | `/api/calendar/events` | Создание личного события |
| `PATCH` | `/api/calendar/events/:id` | Редактирование личного события |
| `DELETE` | `/api/calendar/events/:id` | Удаление личного события |

### Documents

| Method | Endpoint | Описание |
|---|---|---|
| `GET` / `POST` | `/api/documents` | Список и загрузка документов |
| `DELETE` | `/api/documents/:id` | Деактивация документа |
| `GET` | `/api/documents/:id/content` | Защищённый inline-контент |
| `GET` | `/api/documents/:id/download` | Защищённая загрузка |

### Workspace

CRUD endpoints доступны сикеру:

```text
/api/companies
/api/contacts
/api/notes
/api/reminders
/api/tags
/api/tags/applications
```

### Notifications

| Method | Endpoint | Описание |
|---|---|---|
| `GET` | `/api/notifications` | Список уведомлений |
| `PATCH` / `DELETE` | `/api/notifications/:id` | Изменение или удаление |
| `PATCH` | `/api/notifications/mark-all-as-read` | Прочитать все |
| `GET` | `/api/notifications/unread-count` | Количество непрочитанных |
| `GET` | `/api/notifications/stream` | SSE-поток |

### Admin

```http
POST /api/admin/cleanup-vacancies
Authorization: Bearer <ADMIN_API_KEY>
```

Endpoint удаляет истёкшие вакансии и предназначен для защищённого cron-вызова.

## Авторизация и безопасность

Реализовано:

- bcrypt hashing паролей;
- JWT access token со сроком жизни 1 час;
- случайные refresh tokens;
- хранение только SHA-256 хеша refresh token;
- ротация refresh token при обновлении сессии;
- HttpOnly cookies;
- `Secure` cookies в production;
- `SameSite=Lax`;
- server-side role guards;
- проверка владения vacancy, application, document и event;
- same-origin защита изменяющих API-запросов;
- Zod validation;
- фиксированный rate limit для auth и upload;
- безопасное сравнение admin token;
- CSP, HSTS, `nosniff`, frame protection и referrer policy;
- централизованные публичные ошибки;
- запрет выдачи внутренних исключений и секретов.

Текущий rate limiter хранится в памяти процесса. Для горизонтального production scaling его необходимо заменить общим хранилищем, например Redis-compatible сервисом.

## Локализация

Поддерживаются:

- English — `en`;
- Polski — `pl`;
- Русский — `ru`.

Локаль определяется по cookie и `Accept-Language`. Пользователь может изменить её через интерфейс.

Словари находятся в:

```text
src/i18n/messages/en.ts
src/i18n/messages/pl.ts
src/i18n/messages/ru.ts
```

Новый пользовательский текст должен добавляться сразу во все три словаря. Пользовательский контент — названия вакансий, компаний, заметки и документы — не переводится.

Текущая server timezone:

```text
Europe/Warsaw
```

## Тестирование

### Полный quality gate

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

### Unit и regression tests

```bash
npm test
```

Тесты покрывают:

- access и refresh token logic;
- ротацию сессий;
- lifecycle вакансий;
- interview persistence;
- workspace authorization;
- notification formatting;
- API architecture boundaries;
- security headers;
- CSRF/origin validation;
- rate limiter;
- Content-Disposition;
- полноту локализации и отсутствие случайного hardcoded UI-текста.

### Integration tests

Integration tests запускаются только с отдельной базой:

```env
TEST_DATABASE_URL="postgresql://.../job_tracker_test"
```

После применения migrations:

```bash
npm test
```

Без `TEST_DATABASE_URL` database integration suite безопасно пропускается.

### Browser smoke

Сначала соберите и запустите production server:

```bash
npm run build
npm run start
```

Затем в другом терминале:

```bash
npm run test:browser-smoke
```

Скрипт проверяет:

- HTTP 200;
- локаль `html lang`;
- рендеринг `en`, `pl`, `ru`;
- ошибки hydration;
- ошибки CSP;
- HTTP 5xx.

Если Playwright не установлен в проекте, можно передать доверенный внешний runtime через `PLAYWRIGHT_NODE_PATH`.

Дополнительные детали находятся в [docs/testing.md](docs/testing.md).

## Production deployment

Минимальная последовательность:

```bash
npm ci
npx prisma migrate deploy
npm run build
npm run start
```

Перед выпуском:

- настроить production `DATABASE_URL`;
- использовать длинные независимые `JWT_SECRET` и `ADMIN_API_KEY`;
- проверить Cloudinary authenticated assets;
- включить HTTPS;
- проверить cookie domain и proxy headers;
- настроить backup Neon;
- запускать cleanup endpoint только из доверенного cron;
- выполнить quality gate;
- проверить основные сценарии на `en`, `pl`, `ru`;
- убедиться, что migrations применились на staging;
- не использовать development database для тестов.

Приложение совместимо с Node.js hosting, поддерживающим Next.js App Router. Для serverless-развёртывания необходимо учитывать, что текущий in-memory rate limiter не является глобальным.

## Roadmap

Подробный текущий roadmap находится в [ROADMAP.md](ROADMAP.md).

Ближайшие запланированные направления:

1. Google и GitHub OAuth с сохранением текущей JWT-системы.
2. Отдельное подключение Google Calendar рекрутером.
3. Автоматическое создание приватной Google Meet-ссылки для интервью.
4. Выбор длительности и синхронизация переноса/отмены.
5. Локальная браузерная AI-платформа через WebLLM.
6. Версионированная история AI-результатов.
7. Дополнительные AI-функции после отдельного продуктового согласования.

Google OAuth, GitHub OAuth, Google Meet и AI ещё не реализованы.

## Ограничения текущей версии

- нет Google/GitHub OAuth;
- нет синхронизации с внешним календарём;
- нет автоматической Google Meet-ссылки;
- нет браузерного AI;
- нет полноценного write-E2E набора с отдельной тестовой БД;
- rate limit не распределён между несколькими server instances;
- уведомления SSE хранят активные подключения в памяти процесса;
- отсутствуют email-уведомления;
- отсутствует командный recruiter workspace;
- отсутствует двусторонняя синхронизация календаря;
- лицензия проекта пока не опубликована.

## Правила разработки

- strict TypeScript;
- не использовать `any`;
- Route Handler → Service → Repository → Prisma;
- все входные данные проверять через Zod;
- новые интерфейсы сразу локализовать на `en`, `pl`, `ru`;
- не изменять базу вручную — только migrations;
- использовать Conventional Commits;
- не включать секреты и пользовательские документы в Git;
- не смешивать feature changes с посторонними изменениями.

## Полезные документы

- [Roadmap](ROADMAP.md)
- [Testing guide](docs/testing.md)
- [Calendar development report](SESSION_REPORT_20260712.md)
- [Project development rules](AGENTS.md)

## Лицензия

Отдельный `LICENSE` файл пока не добавлен. До выбора лицензии проект не следует считать открытым для свободного распространения или коммерческого переиспользования.
