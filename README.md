# Open Tutor Ireland

Find Irish exam papers and study your flashcards.

This is a small study desk built around [Past Examination Finder](https://github.com/vivantaneja/Past-Examination-Finder) and [Ashvant's Oftly fork](https://github.com/MilesatAshvantAnand/oftly-AshFork). Both are pinned Git submodules.

## Make your own version

Fork this repo on GitHub. With Node.js 24 and Python 3 installed, run:

```sh
git clone --recurse-submodules https://github.com/YOUR-USERNAME/open-tutor-ireland.git
cd open-tutor-ireland
npm ci --prefix upstream/oftly
bash scripts/build.sh
python3 -m http.server --bind 127.0.0.1 --directory dist 8000
```

Open [localhost:8000](http://127.0.0.1:8000). Edit the files under `site/` and run the build again.

The build mounts Oftly's browser edition at `oftly/`. Study progress uses its local browser storage. Use Oftly's backup import and export to transfer your library between site origins. The hosted app uses guest mode.
