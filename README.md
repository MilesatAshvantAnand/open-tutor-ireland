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

To publish your fork, select **GitHub Actions** under **Settings → Pages**, enable workflows in the fork's **Actions** tab, and run **Deploy study desk**.

## Search coverage

The finder searches the upstream catalogue for subjects, years, levels and materials across Leaving Certificate, Junior Cycle and Leaving Certificate Applied. Topic-to-question matches use the verified entries in `site/topics.js`. Each row contains aliases, a catalogue filename and a page or question label. The paper contents stay with the State Examinations Commission.

Run the catalogue and topic checks with `node --test tests/search.test.mjs upstream/papers/tests/catalogue.test.js`.

Past Examination Finder is by Vivan Taneja. Oftly is by Vivan Taneja and Ashvant Anand. Oftly is distributed under its upstream [AGPL licence](https://github.com/MilesatAshvantAnand/oftly-AshFork/blob/95398512a7e1e02199ed7797ed8d516a5bc2a770/LICENSE).
