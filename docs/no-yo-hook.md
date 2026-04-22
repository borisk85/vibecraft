# Pre-commit hook: запрет буквы ё/Ё

Блокирует коммит, если в staged-файлах найдены символы `ё` или `Ё`.
Используется в Vibecraft и переносится в любой проект Boris (где правило про запрет ё везде).

## Что блокируется

Проверка по staged-изменениям в файлах с расширениями: `.tsx, .ts, .jsx, .js, .mdx, .md, .css, .html, .yaml, .yml, .sql, .sh`.

Если хоть в одном найдена `ё` или `Ё` — коммит отменяется, скрипт показывает файлы и строки.

## Установка в новый проект

### 1. Установить husky

```bash
npm install --save-dev husky
npx husky init
```

`husky init` сам добавит в `package.json` строку:
```json
"scripts": {
  "prepare": "husky"
}
```

И создаст папку `.husky/` с файлом `pre-commit` (с дефолтным `npm test`).

### 2. Заменить содержимое .husky/pre-commit

Скопировать в `.husky/pre-commit` следующее:

```sh
#!/usr/bin/env sh
# Блокирует коммит если в staged-изменениях есть буквы ё/Ё.
# Правило проекта: эти буквы запрещены везде (UI, комментарии, docs).

files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(tsx?|jsx?|mdx?|md|css|html|ya?ml|sql|sh)$')

if [ -z "$files" ]; then
  exit 0
fi

found=0
for file in $files; do
  matches=$(git show ":$file" 2>/dev/null | grep -nE '[ёЁ]' || true)
  if [ -n "$matches" ]; then
    if [ $found -eq 0 ]; then
      echo ""
      echo "ОШИБКА: найдены ё/Ё в staged-файлах. По правилу проекта буква ё запрещена везде."
      echo ""
    fi
    echo "  $file:"
    echo "$matches" | sed 's/^/    /'
    found=1
  fi
done

if [ $found -eq 1 ]; then
  echo ""
  echo "Замените ё на е, Ё на Е, выполните git add и попробуйте снова."
  exit 1
fi

exit 0
```

### 3. Сделать исполняемым (Linux/Mac)

```bash
chmod +x .husky/pre-commit
```

На Windows этот шаг можно пропустить — git под Windows запускает скрипты через bash без проверки прав.

### 4. Закоммитить .husky/

```bash
git add .husky/ package.json package-lock.json
git commit -m "chore: pre-commit hook против ё/Ё"
```

После этого хук работает у всех кто склонит репо и сделает `npm install` (husky установится через `prepare` скрипт).

## Тест

```bash
echo "тест ё" > test.md
git add test.md
git commit -m "should fail"
```

Должен вывести ошибку с указанием файла и строки. Если коммит прошёл — хук не работает.

После теста:
```bash
git reset HEAD test.md
rm test.md
```

## Whitelist (исключения из проверки)

В скрипте по умолчанию из проверки исключены:
- `CLAUDE.md` — там само правило про запрет описано
- `docs/no-yo-hook.md` — эта инструкция

```sh
| grep -vE '^(CLAUDE\.md|docs/no-yo-hook\.md)$'
```

Если у твоего проекта другой путь к инструкции / другой файл с правилами — поправь regex под него.

## Расширения файлов под проверку

По умолчанию проверяются: `.tsx .ts .jsx .js .mdx .md .css .html .yaml .yml .sql .sh`

Если в проекте есть другие текстовые файлы где тоже не нужна ё (например `.go`, `.py`, `.rs`) — добавить в regex в строке `grep -E '\.(...)$'`:

```sh
files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(tsx?|jsx?|mdx?|md|css|html|ya?ml|sql|sh|py|go|rs)$')
```

## Обход хука (только для экстренных случаев)

```bash
git commit -m "..." --no-verify
```

Использовать только если в коммите реально нужна буква ё (например, документация про сам этот хук). По умолчанию никогда не обходить.
