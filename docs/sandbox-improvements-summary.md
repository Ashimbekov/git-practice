# Sandbox Improvements — Summary

## Overview

Три направления улучшений для песочницы GitEngine: новые git-команды, persistence через localStorage, и интеграция sandbox с уровнями.

## Новые команды GitEngine

### git tag
- `git tag` — список тегов
- `git tag <name>` — создать lightweight тег на HEAD
- `git tag <name> <commit>` — тег на конкретный коммит
- `git tag -d <name>` — удалить тег
- Теги отображаются в `git log` и в визуализаторе графа (amber бейджи)

### git blame
- `git blame <file>` — для каждой строки показывает коммит, автора и сообщение
- Трассирует через историю коммитов, определяя какой коммит последний изменил каждую строку

### git bisect
- `git bisect start` — начать сессию бинарного поиска
- `git bisect bad [commit]` — отметить плохой коммит
- `git bisect good [commit]` — отметить хороший коммит
- Автоматический checkout на средний коммит между good и bad
- `git bisect reset` — завершить и вернуться на исходную ветку

## Persistence (localStorage)

- Состояние GitEngine сериализуется через `serialize()`/`deserialize()` (все Map-структуры конвертируются в JSON)
- Автосохранение после каждой команды
- Восстановление при загрузке страницы
- Сброс кнопкой Reset
- Раздельное хранение для свободной песочницы (`gitquest-sandbox`) и уровней (`gitquest-sandbox-level-{id}`)

## Интеграция с уровнями

### SandboxChallenge
Новый компонент заменяет self-report чекбоксы на интерактивную практику:
- Встроенный мини-терминал с автокомплитом
- Real-time чеклист валидации — проверки обновляются после каждой команды
- Кнопка "Завершить" активна только когда все проверки пройдены
- Поддержка подсказок

### Presets и Validators
- Каждый уровень может экспортировать `preset.ts` (предзаполненное состояние репо) и `validator.ts` (функция проверки конечного состояния)
- Lazy-загрузка через `loadPreset`/`loadValidator` в реестре уровней
- Валидация по состоянию (state-based), а не по последовательности команд
- Level 03 (staging) — первый уровень с preset и validator в качестве примера

### Кнопка "Открыть в песочнице"
Добавлена во все 33 уровня на шаге визуализации. Ведёт на `/sandbox?level={id}`.

## Файлы

### Новые
| Файл | Назначение |
|---|---|
| `src/engine/git-sandbox/commands/tag.ts` | Команда git tag |
| `src/engine/git-sandbox/commands/blame.ts` | Команда git blame |
| `src/engine/git-sandbox/commands/bisect.ts` | Команда git bisect |
| `src/engine/git-sandbox/__tests__/tag.test.ts` | Тесты git tag (8 тестов) |
| `src/engine/git-sandbox/__tests__/blame.test.ts` | Тесты git blame (5 тестов) |
| `src/engine/git-sandbox/__tests__/bisect.test.ts` | Тесты git bisect (8 тестов) |
| `src/engine/git-sandbox/__tests__/serialization.test.ts` | Тесты сериализации (7 тестов) |
| `src/components/sandbox/SandboxChallenge.tsx` | Компонент интерактивного challenge |
| `src/levels/03-staging/preset.ts` | Preset для уровня staging |
| `src/levels/03-staging/validator.ts` | Validator для уровня staging |

### Изменённые
| Файл | Изменения |
|---|---|
| `src/engine/git-sandbox/types.ts` | BisectState, tags/bisect в EngineState |
| `src/engine/git-sandbox/GitEngine.ts` | serialize/deserialize, completions, graph data |
| `src/engine/git-sandbox/commands/index.ts` | Регистрация tag/blame/bisect |
| `src/engine/git-sandbox/commands/basic.ts` | Теги в getBranchLabels, сброс в execInit |
| `src/engine/git-sandbox/commands/filesystem.ts` | Поддержка \n в echo |
| `src/components/sandbox/SandboxLayout.tsx` | Persistence, levelId prop |
| `src/components/sandbox/index.ts` | Экспорт SandboxChallenge |
| `src/app/sandbox/page.tsx` | Поддержка ?level= query param |
| `src/app/level/[id]/page.tsx` | Загрузка preset/validator |
| `src/levels/registry.ts` | loadPreset/loadValidator в LevelEntry |
| `src/levels/03-staging/Level.tsx` | SandboxChallenge вместо Challenge |
| `src/levels/*/Level.tsx` (03-33) | Кнопка "Открыть в песочнице" |
| `src/types/git-graph.ts` | GitTagRef, tags в GitGraphState |
| `src/components/git-visualizer/useGitGraph.ts` | tags в GraphNode |
| `src/components/git-visualizer/CommitNode.tsx` | Рендер tag бейджей |

## Тесты

136 тестов, 11 test suites — все проходят.
