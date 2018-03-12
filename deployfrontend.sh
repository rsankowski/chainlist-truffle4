rsync -r src/ docs/
rsync build/contracts/ChainList.json docs/
git add .
git commit - "adding frontend files to Github pages"
git push
