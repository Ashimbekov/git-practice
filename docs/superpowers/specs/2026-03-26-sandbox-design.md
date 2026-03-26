# Git Sandbox — Интерактивная песочница

## Обзор

Режим свободной практики, где пользователь вводит git-команды в виртуальный терминал и видит в реальном времени как меняется граф коммитов и файловая система. Полная эмуляция git в браузере без бэкенда.

## Архитектура движка

**GitEngine** — класс, хранящий полное состояние виртуального git-репозитория:

```
GitEngine
├── workingDir: Map<path, content>    — рабочая директория
├── stagingArea: Map<path, content>   — staging (индекс)
├── commits: CommitObject[]           — все коммиты
├── branches: Map<name, commitId>     — ветки
├── head: string                      — текущая ветка или commit (detached)
├── remotes: Map<name, RemoteBranch>  — эмулированные remote-ветки
├── stash: StashedState[]             — стек stash
└── reflog: ReflogEntry[]             — история HEAD
```

Каждый коммит хранит полный снимок файлов (snapshot). При diff сравниваем snapshots.

Команды обрабатываются парсером:
1. Текст → парсинг (команда + аргументы + флаги)
2. Валидация (есть ли файл, правильна ли ветка)
3. Выполнение → новое состояние
4. Генерация вывода (реалистичный git-output или обучающая подсказка при ошибке)

## Поддерживаемые команды

### Git-команды

| Команда | Что делает в движке |
|---------|-------------------|
| `git init` | Сброс в пустое состояние |
| `git add <file>` / `git add .` | Копирует из workingDir в stagingArea |
| `git commit -m "msg"` | Создаёт snapshot из stagingArea, новый коммит |
| `git status` | Сравнивает workingDir vs staging vs последний коммит |
| `git log` / `--oneline` / `--graph` | Выводит историю коммитов |
| `git diff` / `--staged` | Построчное сравнение файлов |
| `git branch` / `-d` | Создание/удаление/список веток |
| `git switch` / `-c` / `git checkout` | Переключение HEAD, обновление workingDir |
| `git merge <branch>` | Fast-forward или 3-way merge с конфликтами |
| `git rebase <branch>` | Replay коммитов на новую базу |
| `git cherry-pick <id>` | Копирование одного коммита |
| `git reset --soft/mixed/hard` | Перемещение HEAD, обновление staging/workingDir |
| `git revert <id>` | Создание обратного коммита |
| `git stash` / `pop` / `list` | Сохранение/восстановление состояния |
| `git reflog` | История перемещений HEAD |
| `git remote add` / `git push` / `pull` / `fetch` | Эмулированные remote-операции |

### Shell-команды

| Команда | Что делает |
|---------|-----------|
| `echo "text" > file` | Создание/перезапись файла |
| `cat file` | Чтение файла |
| `ls` | Список файлов |
| `rm file` | Удаление файла |

### Обучающие ошибки

- `git commit` без staged файлов → "Нечего коммитить! Сначала добавь файлы: git add <файл>"
- `git push` без коммитов → "Нет коммитов для отправки. Сначала сделай commit"
- Неизвестная команда → "Команда не найдена. Попробуй git --help для списка команд"
- `git merge` с конфликтами → подробное объяснение конфликтных маркеров

## UI страницы /sandbox

### Три панели

**Левая — Терминал:**
- Ввод команд внизу
- Автодополнение при Tab (команды + имена файлов/веток)
- История команд (стрелка вверх/вниз)
- Цветной вывод (зелёный — success, красный — error, жёлтый — обучающая подсказка)

**Центральная — Git граф:**
- Переиспользуем существующий SVG GitVisualizer
- Обновляется в реальном времени после каждой команды
- Анимация появления новых коммитов/веток

**Правая — Файлы:**
- Три секции: Working Directory, Staging Area, последний коммит
- Файлы с иконками статусов (new, modified, deleted)
- Клик по файлу → показ содержимого
- Diff-вьюер: +/- строки с подсветкой

**Быстрые кнопки (внизу):**
- Самые частые команды: git add, git commit, git branch, git merge, git log, git status
- При клике вставляют команду в терминал (можно дописать аргументы)

### Адаптивность

- Десктоп: три колонки
- Планшет: терминал + граф (файлы в выдвижной панели)
- Мобильный: табы (Терминал | Граф | Файлы)

## Интеграция с уровнями

На каждом уровне в шаге "visualization" кнопка "Открыть в песочнице":
- Открывает `/sandbox?from=<levelId>`
- Предзагружает начальное состояние уровня (initial commits, branches)
- Кнопка "Вернуться к уроку" возвращает обратно

Состояние песочницы хранится в `sessionStorage` — сбрасывается при закрытии вкладки.

## Структура файлов

```
src/
├── engine/
│   └── git-sandbox/
│       ├── GitEngine.ts          — основной класс движка
│       ├── commands/
│       │   ├── index.ts          — реестр команд
│       │   ├── basic.ts          — init, add, commit, status, log, diff
│       │   ├── branch.ts         — branch, switch, checkout, merge
│       │   ├── advanced.ts       — rebase, cherry-pick, reset, revert, stash, reflog
│       │   ├── remote.ts         — remote, push, pull, fetch, clone
│       │   └── filesystem.ts     — echo, cat, ls, rm
│       ├── parser.ts             — парсинг текста → команда + аргументы
│       ├── types.ts              — типы для движка
│       └── __tests__/
│           ├── engine.test.ts
│           └── commands.test.ts
├── app/
│   └── sandbox/
│       └── page.tsx              — страница песочницы
└── components/
    └── sandbox/
        ├── SandboxLayout.tsx     — трёхпанельный layout
        ├── SandboxTerminal.tsx   — терминал с вводом
        ├── SandboxFiles.tsx      — панель файлов + diff
        └── QuickActions.tsx      — панель быстрых кнопок
```
