# abrahamwood-site

Personal site for Abraham Wood — session drumming, worship music direction,
track prep, speaking and lessons, plus sales & brand partnerships.

## Structure

```
index.html        the page itself
css/style.css     all styling
js/main.js        marquee, groove player, waveform
```

No build step, no frameworks. Open `index.html` in a browser and it runs.

## Running it locally

Double-click `index.html`, or from this folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000

## Publishing with GitHub Pages

1. Push this folder to a GitHub repo.
2. Repo → **Settings** → **Pages**.
3. Under *Build and deployment*, set Source to **Deploy from a branch**,
   branch `main`, folder `/ (root)`. Save.
4. The site goes live at `https://<username>.github.io/<repo>/` within a minute or two.

### Custom domain

Add a file named `CNAME` at the root containing only the domain:

```
abrahamwood.com
```

Then point the domain's DNS at GitHub Pages and enable HTTPS under Settings → Pages.

## Editing

- Text lives in `index.html`.
- Colors and type are CSS variables at the top of `css/style.css` (`:root`).
- The demo groove pattern is the `PATTERN` object in `js/main.js`.

## To do

- [ ] Photos (kit, stage, headshot)
- [ ] A video clip on the Work section
- [ ] Buy the domain and add `CNAME`
- [ ] Swap the contact email for a booking address
