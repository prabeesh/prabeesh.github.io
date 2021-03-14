For new setup
```bash
git clone --single-branch --branch source git@github.com:prabeesh/prabeesh.github.io.git

git submodule add --force git@github.com:prabeesh/prabeesh.github.io.git public

git submodule add --force https://github.com/theNewDynamic/gohugo-theme-ananke.git themes/ananke
```

To regenerate the site
```bash
HUGO_ENV=production hugo
```
now for deployment
```bash
cd public # branch is master
git add .
git commit -m "deployment"
```

Then go to the root directory
```bash
cd .. # root directory, branch is source
git add public
git commit -m "sync with deployment"
```

To update the theme (ananke)
```bash
cd themes/ananke/ # branch is master
git pull origin master
```
Then go to the root directory
```bash
cd .. # root directory, branch is source
git add themes/ananke/
git commit -m "sync with ananke theme"
