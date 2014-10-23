git add .
git commit -m "logging/quickly debugging a production issue"
git push heroku master
heroku logs --tail