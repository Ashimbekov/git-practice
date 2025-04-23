Практика с работой git

1. Создали репозиторий
2. Создание простой файл
echo "Hello, Git!" > hello.txt
3. Закоммить файл
git add hello.txt
git commit -m "Добавлен hello.txt с приветствием"
4. Переименовываем текущую ветку из master в main 
git branch -M main
5. Добавляет ссылку на удалённый репозиторий и называет её origin
git remote add origin git@github.com:Ashimbekov/git-practice.git
6. Отправляет ветку main на GitHub 
git push -u origin main

-u устанавливает связь между локальной веткой и удаленной

Создание новой ветки
git checkout -b feature/info
echo "Author: Nurdaulet" > info.txt
git add info.txt
git commit -m "Добавлен новый файл info.txt с информацией об авторе"