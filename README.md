# Ohio Docket Hub

Ohio Docket Hub is an early prototype for helping people find Ohio court docket resources in one place.

## Current prototype

- Search and filter fictional sample cases by name, case number, county, and case type.
- Open sample case timelines and save sample cases in the current browser.
- Use the official court links page to open external court resources.
- Review the demo notice and source information before relying on a court record.

The prototype does **not** search, retrieve, or monitor live court records. The sample case names, numbers, and docket events are invented. Saved cases and preferences stay in the browser's local storage; accounts, email notifications, and server-side data are not connected.

## Local development

```sh
npm install
npm run dev
```

Check the production build with:

```sh
npm run build
```

## GitHub Pages

The repository includes a GitHub Actions workflow to build and publish the static Vite app. In the repository's **Settings → Pages**, choose **GitHub Actions** as the build and deployment source. The Vite base path is configured for this repository name.

## Live court data

Before any live docket integration, identify a pilot court and confirm its approved access method, published terms, and rate limits. Use a server-side adapter, show source links and retrieval timestamps, and handle restricted and unavailable records safely. See [COURT_DATA_INTEGRATION.md](./COURT_DATA_INTEGRATION.md) and [the pilot checklist](./docs/PILOT_ACCEPTANCE_CHECKLIST.md).
